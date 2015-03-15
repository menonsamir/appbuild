var sys = require('sys')
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var p = exec('ionic serve -b --port $PORT --address $(ip addr | grep \'state UP\' -A2 | tail -n1 | awk \'{print $2}\' | cut -f1  -d\'/\')', {cwd: 'ionic/todo'});
p.stdout.on('data', function(data) {
    console.log(' ' + data);
});
/*
exec('export IP=\"$(ip addr | grep \'state UP\' -A2 | tail -n1 | awk \'{print $2}\' | cut -f1  -d\'/\')\"', function () {
	var frontend = spawn("ionic", [ "serve", "-b", "--address", process.env.IP], {'cwd': 'ionic/todo'});
	frontend.stdout.on('data', function(data) { console.log(""+data); });
});
*/
// export IP="$(ip addr | grep 'state UP' -A2 | tail -n1 | awk '{print $2}' | cut -f1  -d'/')"