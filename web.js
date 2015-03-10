var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var inflection = require( 'inflection' );

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'jade');

app.get("/list", function (req, res) {
	console.log(ideas);
	res.render('pages/list.jade', {
		ideas: ideas
	})
});

app.get("/create", function (req, res) {
	res.render('pages/create.jade', {})
});

app.post("/create", function (req, res) {
	var data = processData(req.body);
	ideas.push(data);
	console.log(data);
	res.redirect('/list')
})

app.get("/test", function (req, res) {
	res.render('pages/ionic/blocks.jade', {});
});


app.listen(3300);

var ideas = [
	{
		title: "StartupIdeas",
		category: "App",
		subheader: "Give and get feedback on startup ideas",
		bullets: [
			"Post startup ideas",
			"Vote for your favorites",
			"Give and recieve feedback"
		]
	},
	{
		title: "MapBot",
		category: "Hardware",
		subheader: "Map indoor and outdoor environments using lasers",
		bullets: [
			"Generate a 3D map of almost any environment",
			"Measure distances as far as 100 meters.",
			"Costs about $200"
		]
	},
];

function processData(d) {
	var toAdd = {};
	for (var key in d) {
		var place = key.indexOf('[')
		if (place != -1) {
			var newkey = inflection.pluralize(key.slice(0,place));
			if (!toAdd.hasOwnProperty(newkey)) {
				toAdd[newkey] = [];
			}
			toAdd[newkey].splice(parseInt(key.slice(place+1,-1)), 0, d[key]);
			delete d[key];
		}
	}
	for (var i in toAdd) { d[i] = toAdd[i]; }
	return d;
}