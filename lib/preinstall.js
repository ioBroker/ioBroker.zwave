var path = require('path');
var fs   = require('fs');
var os   = require('os');
var cp   = require('child_process');
var util = require('util');

var platform = os.platform();

function doScript(script, suppressException) {
  console.log('---> ' + script);
  try {
    return(cp.execSync(script).toString());
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
      doScript('sudo apt-get install libudev-dev -y');
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
    patch1125: {
      findpattern: 'CentralScene.h',
      locations: ["/tmp", "/usr/include/", "/usr/local/include/"],
      searchpattern: 'createSupportedKeyAttributesValues'
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
        var cmdfmt = "find %s -name '%s'";
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
          var cmdfmt = "find %s -name '%s'|grep '%s'";
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
      var cmdfmt = "find %s -name '%s'";
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
        // Check if we have a specific patch installed (for now check if patch 1125 is installed)
        if (configs[item].searchpattern) {
          var sp = configs[item].searchpattern;
          cmdfmt = "find %s -name '%s'|grep '%s'";
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
  doScript('curl -L -O https://github.com/OpenZWave/open-zwave/archive/master.zip');
  doScript('rm -rf open-zwave-master');
  doScript('unzip master.zip && rm master.zip');
  // Add Patch 1125, needed for CentralScene Support
  doScript('cd open-zwave-master && curl -O -L https://github.com/OpenZWave/open-zwave/pull/1125.patch && patch -p1 < 1125.patch');
  doScript('cd open-zwave-master && make && sudo make install');
}
