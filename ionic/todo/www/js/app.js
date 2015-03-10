var objects = ['Hug', 'User'];
var root = 'http://127.0.0.1:3400/api/';

var actions = {};
var tabs = {'hugs': 'basic', 'users':'list'};

$.get('actions.yaml', function(data) {
  actions = jsyaml.load(data);
  console.log(actions)
  for (var url in actions) {
    var ctrlName = capitalizeFirstLetter(url.split(".")[1]);

    if (url.indexOf("detail") > -1) {
      ctrlName = ctrlName.singularize();
    }

    ctrlName = ctrlName + "Ctrl";
    
    var actionList = actions[url];
    app.controller(ctrlName, (function (actionList) {
      return function ($scope, $injector) {
        for (var i = 0; i < actionList.length; i++) {
          var action = actionList[i].action;
          var obj = actionList[i].type;
          // Basically, this is `list($scope, User)` or `create($scope, Offer)`
          actionTemplateFunctions[action]($scope, $injector.get(obj));
          if (action == "view") {
            $scope[obj.toLowerCase()+"Id"] = $injector.get('$stateParams')[obj.toLowerCase()+"Id"];
            $scope.$on('$ionicView.enter', (function (obj) {
              return function() {
                $scope.view($scope[obj.toLowerCase()+"Id"])
              };
            })(obj));
          }
        }
      }
    })(actionList));
  }
});

/*{
  'tabs.home': [{action: "list", type: "Offer"}],
  'tabs.users.index': [{action: "list", type: "User"}],
  'tabs.users.detail': [{action: "view", type: "User"}, {action: "create", type: "Offer"}],
}


*/


// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('starter', ['ionic', 'ngResource']);

// HACK: we ask for $injector instead of $compile, to avoid circular dep
app.factory('$templateCache', function($cacheFactory, $http, $injector) {
  var cache = $cacheFactory('templates');
  var allTplPromise;
 
  return {
    get: function(url) {
      var fromCache = cache.get(url);
 
      // already have required template in the cache
      if (fromCache) {
        return fromCache;
      }
      // first template request ever - get the all tpl file
      if (!allTplPromise) {
        allTplPromise = $http.get('templates/main.html').then(function(response) {
          // compile the response, which will put stuff into the cache
          $injector.get('$compile')(response.data);
          return response;
        });
      }
      // return the all-tpl promise to all template requests
      return allTplPromise.then(function(response) {
        return {
          status: response.status,
          data: cache.get(url),
          headers: response.headers
        };
      });
    },
 
    put: function(key, value) {
      cache.put(key, value);
    }
  };
});

app.run(function($ionicPlatform, $templateCache) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

/*
Using the angular $resource directive

query   LIST
get     VIEW
save    CREATE
"put"   UPDATE
delete  DELETE
*/

for (var i = 0; i<objects.length; i++) {
  var obj = objects[i];
  console.log(obj.toLowerCase().pluralize()+'/:id')
  app.factory(obj, (function (obj) {
    return function($resource) {
      return $resource(root+obj.toLowerCase().pluralize()+'/:id');
    }
  })(obj))
}

function makeBasicState(n) {
  var o  = {
    url: '/'+n,
    templateUrl: n+'.html',
    controller: capitalizeFirstLetter(n)+'Ctrl'
  };
  return o;
}

function makeBasicTabState(n) {
  var o  = {
    url: '/'+n,
    views: {}
  };
  o.views[n+"-tab"] = {
    templateUrl: n+'.html',
    controller: capitalizeFirstLetter(n)+'Ctrl'
  }
  console.log(o);
  return o;
}

function makeNestableTabState(n) {
  var o  = {
    abstract: true,
    url: '/'+n,
    views: {}
  };
  o.views[n+"-tab"] = {
    template: '<ion-nav-view></ion-nav-view>'
  }
  return o;
}

function makeRootTabState(n) {
  var o  = {
    abstract: true,
    url: '/'+n,
    templateUrl: n+'.html'
  };
  return o;
}

function makeListState(n) {
  var o  = {
    url: '',
    templateUrl: n+'.html',
    controller: capitalizeFirstLetter(n)+'Ctrl'
  };
  return o;
}

function makeDetailState(n) {
  var o  = {
    url: '/:'+n+'Id',
    templateUrl: n+'.html',
    controller: capitalizeFirstLetter(n)+'Ctrl',
    resolve: {}
  };
  o.resolve[n+"Id"] = (function (n) {
    return function($stateParams) {
      return $stateParams[n+"Id"];
    }
  })(n)
  return o;
};

app.config(function($stateProvider, $urlRouterProvider, $injector) {
  $urlRouterProvider.otherwise('/login')
  console.log(actions);
  /*tabs = {}
  for (var url in actions) {
    var tabname = url.split('.')[1];
    var isList = url.split('.')[2] === 'detail';
    if (isList) {
      tabs[tabname] = 'list'
    } else {
      tabs[tabname] = 'basic'
    }
  }*/

  tabs = {'hugs': 'basic', 'users':'list'}
  console.log(tabs);
  $stateProvider.state('login', makeBasicState('login'));
  $stateProvider.state('signup', makeBasicState('signup'));
  $stateProvider.state('tabs', makeRootTabState('tabs'));
  for (var tab in tabs) {
    console.log(tab);
    var action = tabs[tab];
    if (action == 'basic') {
      console.log(tab);
      $stateProvider.state('tabs.'+tab, makeBasicTabState(tab));
    } else if (action == 'list') {
      console.log(tab);
      $stateProvider.state('tabs.'+tab, makeNestableTabState(tab));
      $stateProvider.state('tabs.'+tab+'.index', makeListState(tab));
      $stateProvider.state('tabs.'+tab+'.detail', makeDetailState(tab.singularize()));
    }
  }
  

  /*
  $stateProvider.state('tabs.home', makeBasicTabState('home'));
  $stateProvider.state('tabs.users', makeNestableTabState('users'))
  $stateProvider.state('tabs.users.index', makeListState('users'));
  $stateProvider.state('tabs.users.detail', makeDetailState('user'));
  */

});



app.controller('LoginCtrl', function($scope, $http, $window, $state) {
  $scope.user = {email: '', password: ''};
  $scope.login = function() {
    $http
          .post('http://127.0.0.1:3400/authenticate', $scope.user)
          .success(function (data, status, headers, config) {
            $window.sessionStorage.token = data.token;
            $state.go('tabs.hugs');
          })
          .error(function (data, status, headers, config) {
            // Erase the token if the user fails to log in
            delete $window.sessionStorage.token;

            // Handle login errors here
            $scope.message = 'Error: Invalid user or password';
          });
  }
});

app.controller('SignupCtrl', function($scope, $http, $window, $state) {
  $scope.user = {};
  $scope.signup = function() {
    console.log($scope);
    $http
          .post('http://127.0.0.1:3400/register', $scope.user)
          .success(function (data, status, headers, config) {
            $window.sessionStorage.token = data.token;
            $state.go('tabs.hugs');
          })
          .error(function (data, status, headers, config) {
            // Erase the token if the user fails to log in
            delete $window.sessionStorage.token;
            // Handle login errors here
            $scope.message = data;
          });
  }
});

function once(scope, func) {
  scope.loaded = false;

  scope.$on('$ionicView.enter', function(){
    if (scope.loaded) {
      return;
    }
    else {
      func();
      scope.loaded = true;
    }
  });
}

function list(scope, Model) {
  scope.list = function() {
    Model.query(function (objs) {
      scope.data = objs;
      scope.$broadcast('scroll.refreshComplete');
    });
  };
  once(scope, scope.list);
};

function view(scope, Model) {
  scope.view = function (id) {
    scope.obj = Model.get({id: id});
  };
};

function create(scope, Model) {
  scope.create = function(obj) {
    console.log(obj);
    Model.save(obj, function (saved_obj) {
      scope.created = saved_obj;
    });
  };
};

var actionTemplateFunctions = {
  list: list,
  view: view,
  create: create
}

/*
app.controller('HomeCtrl', function($scope, $window, $state, Offer) {
  list($scope, Offer);

  $scope.logout = function () {
    delete $window.sessionStorage.token;
    $state.go('login');
  };
});

app.controller('UsersCtrl', function($scope, $state, User) {
  list($scope, User);
});

app.controller('UserCtrl', function($scope, $state, User, Offer, userId) {
  view($scope, User);
  $scope.userId = userId;
  $scope.offer = {'recipientId': userId};

  scope.$on('$ionicView.enter', function() {
    $scope.view(userId)
  });

  create($scope, Offer)
});
*/
app.factory('authInterceptor', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    response: function (response) {
      if (response.status === 401) {
        // handle the case where the user is not authenticated
        $state.go('login')
      }
      return response || $q.when(response);
    }
  };
});

app.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
});

// UTIL

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}