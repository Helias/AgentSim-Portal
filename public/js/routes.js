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
   .state('scripts', {
      url: '/scripts',
      templateUrl: 'partials/scripts.html',
      controller: 'scriptsController'
    });
});
