var path = require("path");
var fs = require('fs');

var os = require("os");
var platform = os.platform();

if (platform === "linux") {
	install_openzwave();
} else if (platform === "darwin") {
	var exec = require('child_process').exec, child;
	var script = "";
	
	if (fs.existsSync("/usr/bin/xcodebuild")) {
		script = 'xcode-select --install';
		console.log("---> " + script);
		child = exec(script, function (error, stdout, stderr) {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			script = 'brew install pkgconfig';
			console.log("---> " + script);
			child = exec(script, function (error, stdout, stderr) {
				console.log('stdout: ' + stdout);
				console.log('stderr: ' + stderr);
				if (error !== null) {
					console.log('exec error: ' + error);
				} else {
					install_openzwave();
				}
			});
		});
	} else {
		console.log("Please install XCode first");
		console.log("Please start XCode and accept 'Xcode and Apple SDKs Agreement'");
	}
} else {
	console.log(platform + " is currently not supported");
}

function install_openzwave() {
	var exec = require('child_process').exec, child;

	var script = 'curl -L -O https://github.com/OpenZWave/open-zwave/archive/master.zip';
	console.log("---> " + script);
	child = exec(script, function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		if (error !== null) {
			console.log('exec error: ' + error);
		} else {
			script = 'unzip master.zip && rm master.zip';
			console.log("---> " + script);
			child = exec(script, function (error, stdout, stderr) {
				console.log('stdout: ' + stdout);
				console.log('stderr: ' + stderr);
				if (error !== null) {
					console.log('exec error: ' + error);
				} else {
					script = 'cd open-zwave-master && make';
					console.log("---> " + script);
					child = exec(script, function (error, stdout, stderr) {
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
						if (error !== null) {
							console.log('exec error: ' + error);
						} else {
					
							script = 'cd open-zwave-master && sudo make install';
							console.log("---> " + script);
							child = exec(script, function (error, stdout, stderr) {
								console.log('stdout: ' + stdout);
								console.log('stderr: ' + stderr);
								if (error !== null) {
									console.log('exec error: ' + error);
								}
							});
						}
					});
				}
			});
		}
	});
}
