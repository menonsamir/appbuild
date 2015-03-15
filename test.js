var sys = require('sys')
var spawn = require('child_process').spawn;
var frontend = spawn("ionic", [ "serve", "-b", "--port", "8100"], {'cwd': 'ionic/todo'});
frontend.stdout.on('data', function(data) { console.log(""+data); });
