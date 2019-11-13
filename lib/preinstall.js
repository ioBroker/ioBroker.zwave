var path = require('path');
var fs   = require('fs');
var os   = require('os');
var cp   = require('child_process');
var util = require('util');

var platform = os.platform();
const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;

function doScript(script, suppressException) {
  console.log('---> ' + script);
  try {
    return cp.execSync(script, { shell: '/bin/bash' }).toString();
  } catch(e) {
    console.log('---> ' + e.toString());
    if (!suppressException) throw e;
  }
}

switch (platform) {
  //   =======
  case 'linux':
  //   =======
    if (!isOpenZWaveInstalled()) {
      // FIXME: sudo in an installer script is dangerous.
      doScript(`${isRoot ? '' : 'sudo '}apt-get install libudev-dev -y`);
      installOpenZwave();
    }
    break;
  // =========
  case 'darwin':
  // =========
    if (fs.existsSync('/usr/bin/xcodebuild')) {
      doScript('xcode-select --install', true);
      doScript('brew install pkgconfig');
      doScript('brew link pkgconfig');
      installOpenZwave();
    } else {
      console.log('Please install XCode first');
      console.log('Please start XCode and accept "Xcode and Apple SDKs Agreement"');
    }
    break;
  default:
	 console.error(platform + ' is currently not supported');
}

function isOpenZWaveInstalled() {
  var configs = {
    includedir: {
      findpattern: 'OZWException.h',
      locations: ["/tmp", "/usr/include/", "/usr/local/include/"]
    },
    libdir: {
      findpattern: 'libopenzwave.so',
      locations: ["/usr/lib", "/usr/lib64", "/usr/local/lib", "/usr/local/lib64"]
    },
    sysconfdir: {
      findpattern: 'zwcfg.xsd',
      locations: ["/usr/etc", "/usr/local/etc/", "/etc/"]
    },
    version: {
      findpattern: 'manufacturer_specific.xml',
      locations: ["/usr/etc", "/usr/local/etc/", "/etc/"],
      searchpattern: 'Revision="56"'
    }
  }
  var usepkgconfig = true;
  try {
    cp.execSync("pkg-config --exists libopenzwave");
  } catch (e) {
    usepkgconfig = false;
  }

  function checkOZWitem(item) {
    // 1. try the easy way first: use pkg-config and libopenzwave.pc
    if (usepkgconfig) {
      var cmdfmt = "pkg-config --variable=%s libopenzwave";
      var cmd = util.format(cmdfmt, item);
      if (configs[item].searchpattern) {
        var cmdfmt = "find %s -name '%s' 2>/dev/null";
        var fp = configs[item].findpattern;
        for (var i in configs[item].locations) {
          var loc = configs[item].locations[i];
          if (!fs.existsSync(loc)) {
            continue;
          }
          var cmd = util.format(cmdfmt, loc, fp);
          var dir = doScript(cmd, true);
          if (!dir) continue;
          console.log('%s found in %s', fp, dir);
          sp = configs[item].searchpattern;
          var cmdfmt = "find %s -name '%s' -exec grep -H '%s' '{}' \\; 2>/dev/null";
          cmd = util.format(cmdfmt, loc, fp, sp);
          var found = doScript(cmd, true);
          if (!found) continue;
          return true;
        }
      } else {
          return (cp.execSync(cmd).toString().split('\n')[0]);
      }    
    } else {
      // 2. try using plain find
      var cmdfmt = "find %s -name '%s' 2>/dev/null";
      var fp = configs[item].findpattern;
      for (var i in configs[item].locations) {
        var loc = configs[item].locations[i];
        if (!fs.existsSync(loc)) {
          continue;
        }
        var cmd = util.format(cmdfmt, loc, fp);
        var dir = doScript(cmd, true);
        if (!dir) continue;
        console.log('%s found in %s', fp, dir);
        // Check if we have a specific patch installed 
        if (configs[item].searchpattern) {
          var sp = configs[item].searchpattern;
          cmdfmt = "find %s -name '%s' -exec grep -H '%s' '{}' \\; 2>/dev/null";
          cmd = util.format(cmdfmt, loc, fp, sp);
          var found = doScript(cmd, true);
          if (!found) continue;
        }
        return true;
      }
    }
    return false;
  }

  var checks = [];
  Object.keys(configs).forEach(function(item) {
    checks.push( checkOZWitem(item) );
  });

  // all checks must have passed
  return !/false/i.test(checks.join(''));
}

function installOpenZwave() {
  // TODO: use deb/rpm packages if available
  installOpenZwaveFromSource();
}

function installOpenZwaveFromSource() {
  const version = 'openzwave-1.6.953';
  doScript(`curl --connect-timeout 5 --retry 3 -L -O http://old.openzwave.com/downloads/${version}.zip`);
  doScript(`unzip -o ${version}.zip && rm ${version}.zip`);
  doScript(`cd ${version} && make && ${isRoot ? '' : 'sudo '}make install`);
  // TODO: requires ldconfig to be allowed with sudo
  /*if (platform == 'linux') {
      if (fs.existsSync("/usr/local/lib64")) {
          doScript(`${isRoot ? '' : 'sudo '} ldconfig /usr/local/lib64`);
      } else {
          doScript(`${isRoot ? '' : 'sudo '} ldconfig`);
      }
  }*/
}
