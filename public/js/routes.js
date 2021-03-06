var app = angular.module('app');

app.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/home');

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'partials/home.html',
      controller: 'homeController'
    })
    .state('login', {
      url: '/login',
      templateUrl: 'partials/login.html',
      controller: 'loginController'
   })
   .state('register', {
      url: '/register',
      templateUrl: 'partials/register.html',
      controller: 'registerController'
    })
   .state('scripts', {
      url: '/scripts',
      templateUrl: 'partials/scripts.html',
      controller: 'scriptsController'
    })
    .state('scripts_from', {
       url: '/scripts/:from',
       templateUrl: 'partials/scripts.html',
       controller: 'scriptsController'
     })
    .state('my_scripts', {
       url: '/my_scripts',
       templateUrl: 'partials/my_scripts.html',
       controller: 'myScriptsController'
    })
    .state('my_scripts_page', {
      url: '/my_scripts/p/:page',
      templateUrl: 'partials/my_scripts.html',
      controller: 'myScriptsController'
    })
    .state('my_scripts_single', {
      url: '/my_scripts/:id',
      templateUrl: 'partials/my_scripts.html',
      controller: 'myScriptsController'
    });
});
