var sys = require('sys')
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;


var fs = require('fs');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

var backend = spawn("node", ["backend.js"]);
backend.stdout.on('data', function(data) { console.log(""+data); });

var port = (process.env.PORT || 8100);
var address = "localhost";
if (port !== 8100) {
  address = "$(ip addr | grep \'state UP\' -A2 | tail -n1 | awk \'{print $2}\' | cut -f1  -d\'/\')";
}
var frontend = exec("ionic serve", {'cwd': 'ionic/todo'});// --address "+address+" --port "+port, {'cwd': 'ionic/todo'});
frontend.stdout.on('data', function(data) { console.log(""+data); });

var gulp = spawn("gulp", ["watch", "--cwd","ionic/todo"]);
gulp.stdout.on('data', function(data) { console.log(""+data); });

app.get('/edit', function (req, res) {
  fs.readFile('objects.yaml', {encoding: 'utf8'}, function (err, objects) {
    fs.readFile('routes.yaml', {encoding: 'utf8'}, function (err, routes) {
      fs.readFile('ionic/todo/jade/main.jade', {encoding: 'utf8'}, function (err, views) {
        fs.readFile('ionic/todo/www/actions.yaml', {encoding: 'utf8'}, function (err, actions) {
          res.render("editor", {objects: objects, routes: routes, views: views, actions: actions});
        });
      });
    })
  })
});

app.get('/reset', function (req, res) {
    // TODO: FIX THIS TO ACCOUNT FOR VIEWS AND ACTIONS
  fs.readFile('objects_original.yaml', {encoding: 'utf8'}, function (err, objects) {
    fs.readFile('routes_original.yaml', {encoding: 'utf8'}, function (err, routes) {
      fs.writeFile('objects.yaml', objects, function (err) {
        fs.writeFile('routes.yaml', routes, function (err) {
          res.send("Successfully reset!")
        });
      });
    });
  });
});

app.post('/', function (req, res) {
  console.log(req.body);
  fs.writeFile('objects.yaml', req.body.objects, function (err) {
    fs.writeFile('routes.yaml', req.body.routes, function (err) {
      fs.writeFile('ionic/todo/jade/main.jade', req.body.views, function (err) {
        fs.writeFile('ionic/todo/www/actions.yaml', req.body.actions, function (err) {
          res.send("Done!");
          backend.kill();
          var args = ["backend.js"];
          if(req.body.force) {
            args.push("true")
          }
          backend = spawn("node", args);
          backend.stdout.on('data', function(data) { console.log(""+data); });

          // ???? Clients only have to refresh if 'actions' is changed... ?
        });
      });
    });
  });
});

app.listen(3100);