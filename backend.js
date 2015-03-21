var yaml = require('js-yaml');
var fs   = require('fs');

var inflection = require('inflection');

try {
  var conf = yaml.safeLoad(fs.readFileSync('./routes.yaml', 'utf8'));
} catch (e) {
  console.log(e);
}

console.log(process.env.DATABASE_SECURE == "false" ? false : true)

var Sequelize = require('sequelize');
var sequelize = new Sequelize((process.env.DATABASE_URL || "mysql://root@localhost:3306/main"));

var objs_spec = yaml.safeLoad(fs.readFileSync('./objects.yaml', 'utf8'));
var type_mapper = {
  'text': 'STRING',
  'choice': 'ENUM',
  'string': 'STRING',
  'enum': 'ENUM',
  'date': 'DATE'
}

var relationships = [];

for (var obj in objs_spec) {
  
  var spec = objs_spec[obj];
  var toRemove = {};
  for (var prop in spec) {
    if (type_mapper.hasOwnProperty(spec[prop].type)) {
      spec[prop].type = Sequelize[type_mapper[spec[prop].type]];
    } else {
      relationships.push({"owner": spec[prop].type, "owned": obj, "propertyName": prop});
      delete spec[prop];
    }
  }
  sequelize.define(obj, spec);
}


var force = false;
if (process.argv[2] === "true") {
  force = true;
  console.log("Forcing!")
}

/*
var User = sequelize.define('User', {
  email: {
    type: Sequelize.STRING,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: Sequelize.STRING,
    validate: {
      len:[8, 100]
    }
  },
  name: {
    type: Sequelize.STRING,
    validate: {
      len: [2,50]
    }
  },
  type: {
    type: Sequelize.ENUM('skinny', 'toned', 'average', 'muscular', 'chubby', 'large')
  },
  wants: {
    type: Sequelize.ENUM('give', 'recieve', 'both')
  }
});
*/

sequelize.models.User.beforeCreate(function (attr, err) {
  attr.dataValues.password = bcrypt.hashSync(attr.dataValues.password, 10);
});

/*
var Offer = sequelize.define('Offer', {
  title: {
    type: Sequelize.STRING,
    validate: {
      len: [1,160]
    }
  },
  "for": {
    type: Sequelize.ENUM('give', 'recieve', 'both')
  }
});
*/

console.log("------")
console.log(relationships);

sequelize.sync({force: force}).then(function () {
  for(var i=0; i<relationships.length; i++) {
    var relation = relationships[i];
    sequelize.models[relation.owned].belongsTo(sequelize.models[relation.owner], {as: relation.propertyName});
  }
  sequelize.sync({force: force});
});



//sequelize.models.Hug.belongsTo(sequelize.models.User, {as: "sender"});
//sequelize.models.Hug.belongsTo(sequelize.models.User, {as: "recipient"});

/*.then(function () {
  User.create({email: "joe@gmail.com", password: "foobarfoobar"}).then(function (user) {
    Person.create({name: 'Joe', type: 'toned', wants: 'give'}).then(function (person) { 
      person.setUser(user)
    });
  });
})*/


var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

var secret = 'this is a really bad secret';
// We are going to protect /api routes with JWT
app.use('/api', expressJwt({secret: secret}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Enable CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});


app.post('/authenticate', function (req, res) {
  //TODO validate req.body.email and req.body.password
  //if is invalid, return 401

  ODM.User.find({where: {email: req.body.email}}).then(function (user) {
    if (bcrypt.compareSync(req.body.password, user.password)) {
      // We are sending the profile inside the token
      var token = jwt.sign(user.dataValues, secret, { expiresInMinutes: 60*5 });
      res.json({ token: token });
    } else { 
      res.status(401).send('Wrong user or password');
    }
  }).catch(function (err) {
    res.status(401).send('Wrong user or password');
  });
});

app.post('/register', function (req,res) {
  console.log(req.body);
  ODM.User.create(req.body).then(function (user) {
    // Return the token after succesful signup
    var token = jwt.sign(user.dataValues, secret, { expiresInMinutes: 60*5 });
    res.json({ token: token });
  }).catch(function (err) {
    console.log(err);
    res.status(400).json(err);
  })
});

var ODM = sequelize.models;

function genCreate(objName, config) {
  return (function (objName, config) {
    return function (req, res) {
      var Model = ODM[objName];
      var data = req.body;
      if (config.before) {
        if (config.before.set) {
          for (var k in config.before.set) {
            var val = config.before.set[k];
            if (val === "me")
              val = req.user.id;
            data[k+"Id"] = val;
          }
        }
      }
      Model.create(data).then(function (obj) {
        res.json(obj);
      }).catch(function (err) {
        res.json({error: err})
      });
    };
  })(objName, config);
}

function genRead(objName, config) {
  return (function (objName, config) {
    return function (req, res) {
      var Model = ODM[objName];

      var where = {};
      if (config.where) {
        for (var k in config.where) {
          var val = config.where[k];
          if (val === "me")
            val = req.user.id;
          where[k+"Id"] = val;
        }
      }
      var include = undefined;
      if (config.include) {
        var include = [];
        for (var i = 0; i < config.include.length; i++) {
          include[i] = {};
          for (var k in config.include[i]) {
            if (k === "model")
              include[i][k] = ODM[config.include[i][k]];
            else
              include[i][k] = config.include[i][k];
          }          
        }
      }
      var attributes = undefined;
      if (config.attributes) {
        attributes = config.attributes.concat(['id']);
      }
      where.id = req.params.id;
      console.log(where);
      console.log("where");
      Model.find({where: where, attributes: attributes, include: include}).then(function (obj) {
        res.json(obj);
      }).catch(function (err) {
        res.json({error: err})
      });
    };
  })(objName, config);
}

function genList(objName, config) {
  return (function (objName, config) {
    return function (req, res) {
      var Model = ODM[objName];

      var where = undefined;
      if (config.where) {
        where = {};
        for (var k in config.where) {
          var val = config.where[k];
          if (val === "me")
            val = req.user.id;
          where[k+"Id"] = val;
        }
      }
      var include = undefined;
      if (config.include) {
        var include = [];
        for (var i = 0; i < config.include.length; i++) {
          include[i] = {};
          for (var k in config.include[i]) {
            if (k === "model")
              include[i][k] = ODM[config.include[i][k]];
            else
              include[i][k] = config.include[i][k];
          }          
        }
      }
      var attributes = undefined;
      if (config.attributes) {
        attributes = config.attributes.concat(['id']);
      }
      Model.findAll({where: where, attributes: attributes, include: include}).then(function (obj) {
        res.json(obj);
      }).catch(function (err) {
        console.log("ERRORRRRRRRRR");
        console.log(err);
        res.json({error: err})
      });
    };
  })(objName, config);
}

var actionMapper = {
  'create': genCreate,
  'list': genList,
  'read': genRead
}

var httpMethodMapper = {
  'create': 'post',
  'list': 'get',
  'read': 'get',
  'update': 'put'
}

for (var objName in conf) {
  var obj = conf[objName];
  for (var actionName in obj) {
    var action = obj[actionName];
    var actionFunction = actionMapper[actionName];
    var httpMethod = httpMethodMapper[actionName];
    var url = '/api/'+ inflection.pluralize(objName.toLowerCase()) + ((actionName == 'read') ? '/:id' : '');

    //  replaces this:
    //  app.get('/api/hugs', genList('Hug', conf.hug.list));
    app[httpMethod](url, actionFunction(objName, action));
  }
}

/*
app.get('/api/hugs', genList('Hug', conf.hug.list));
app.post('/api/hugs', genCreate('Hug', conf.hug.create));
app.get('/api/hugs/:id', genRead('Hug', conf.hug.read));
app.get('/api/users', genList('User', conf.user.list));
app.get('/api/users/:id', genRead('User', conf.user.read));
*/

console.log("Backend started on :3400")

app.listen(3400);

//app.get('/api/offers', genCreate('Offer', conf));

/*
app.get('/api/offers', function (req, res) {
  Offer.findAll({where: {recipientId: req.user.id}, include: [{model: User, as: 'sender', attributes: ['id', 'name', 'type', 'wants']}]}).then(function (offers) {
    res.json(offers);
  });
});
*/

/*
app.post('/api/offers', function (req, res) {
  var obj = req.body;
  console.log(obj);
  obj.senderId = req.user.id;
  Offer.create(req.body).then(function (obj) {
    res.json(obj);
  }).catch(function (err) {
    res.json({error: err})
  });
});


// GET :id -> get an offer
app.get('/api/offers/:id', function (req, res) {
  Offer.find(req.params.id).then(function (obj) {
    res.json(obj);
  });
});
*/

/*
app.get('/api/users', function (req, res) {
  User.findAll({attributes: ['id', 'name', 'type', 'wants']}).then(function(users) {
    res.json(users);
  })
});


app.get('/api/users/:id', function (req, res) {
  console.log(req.params)
  User.find({where: {id: req.params.id}, attributes: ['id', 'name', 'type', 'wants']}).then(function(user) {
    res.json(user);
  })
});
*/
// 



/*
sequelize.sync().then(function() {
  //console.log(sequelize.models)

  for (var model in sequelize.models) {
    var urlName = model.toLowerCase();
    var Model = sequelize.models[model];

    // LIST with sort + filter
    app.get("/"+urlName+"/list", (function(M) {
      return function (req, res) {
        var where = {};
        var order = '';

        if (req.query.hasOwnProperty('where'))
          where = req.query.where;
        if (req.query.hasOwnProperty('order'))
          order = req.query.order;

        M.findAll({where: where, order: order}).then(function (objs) {
          res.json(objs);
        }).catch(function(err) {
          res.json({error: err})
        });
      }
    })(Model));

    // GET by id
    app.get("/"+urlName+"/:id", (function(M) {
      return function (req, res) {
        M.find(req.params.id).then(function (obj) {
          res.json(obj);
        }).catch(function(err) {
          res.json({error: err})
        });
      }
    })(Model));

    // CREATE with validations
    app.post("/"+urlName+"/create", (function(M) {
      return function (req, res) {
        M.create(req.body).then(function (obj) {
          res.json(obj);
        }).catch(function(err) {
          res.json({error: err});
        });
      }
    })(Model));

    // UPDATE with validations
    app.post("/"+urlName+"/:id/update", (function(M) {
      return function (req, res) {
        M.find(req.params.id).then(function (obj) {
          obj.update(req.body).then(function (updated) {
            res.json(updated);
          });
        }).catch(function(err) {
          res.json({error: err})
        });
      }
    })(Model));


  }
  app.get('/', function(req, res) {
    Project.findAll().then(function(projects) {
      res.json(projects);
    });
  });
})
*/
