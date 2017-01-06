var path = require('path');
var fs   = require('fs');
var os   = require('os');
var cp   = require('child_process');
var util = require('util');

var platform = os.platform();

function doScript(script) {
  console.log('---> ' + script);
  console.log(cp.execSync(script));
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
      doScript('xcode-select --install');
      doScript('brew install pkgconfig');
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
      locations: ["/usr/include/", "/usr/local/include/"]
    },
    libdir: {
      findpattern: 'libopenzwave.so',
      locations: ["/usr/lib*", "/usr/local/lib*"]
    },
    sysconfdir: {
      findpattern: 'zwcfg.xsd',
      locations: ["/usr/etc/", "/usr/local/etc/", "/etc/"]
    },
    docdir: {
      findpattern: 'openzwave-*',
      locations: ["/usr/local/share/doc/"]
    }
  }
  var usepkgconfig = true;
  try {
    cp.execSync("pkg-config --exists libopenzwave");
  } catch (e) {
    usepkgconfig = false;
  }

  function getConfigItem(item) {
    // 1. try the easy way first: use pkg-config and libopenzwave.pc
    if (usepkgconfig) {
      var cmdfmt = "pkg-config --variable=%s libopenzwave";
      var cmd = util.format(cmdfmt, item);
      return (cp.execSync(cmd).toString().split('\n')[0]);
    } else {
      // 2. try using plain find
      var cmdfmt = "find %s -type f -name %s";
      var fp = configs[item].findpattern;
      for (var i in configs[item].locations) {
        var loc = configs[item].locations[i];
        if (!fs.existsSync(loc)) continue;
        var cmd = util.format(cmdfmt, loc, fp);
        try {
          var dir = cp.execSync(cmd).toString().split('\n')[0];
          if (!dir) continue;
          console.log('%s found in %s', fp, loc);
          return path.dirname(dir);
        } catch (e) {
          console.log('%s not found in %s', fp, loc);
        }
      }
    }
  }

  var paths = {};
  Object.keys(configs).forEach(function(item) {
    paths[item] = getConfigItem(item);
  });
  // all 4 items must exist in an OpenZWave installation
  return (Object.keys(paths).length == 4);
}

function installOpenZwave() {
  // TODO: use deb/rpm packages if available
  installOpenZwaveFromSource();
}

function installOpenZwaveFromSource() {
  doScript('curl -L -O https://github.com/OpenZWave/open-zwave/archive/master.zip');
  doScript('unzip master.zip && rm master.zip');
  doScript('cd open-zwave-master && make && sudo make install');
}
