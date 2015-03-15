var sys = require('sys')
var spawn = require('child_process').spawn;
var frontend = spawn("../../node_modules/ionic/bin/ionic", ["serve", "-b", "--port", process.env.PORT, "--address", 'localhost'], {'cwd': 'ionic/todo'});
frontend.stdout.on('data', function(data) { console.log(""+data); });
