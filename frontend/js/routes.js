var app = angular.module('app');

app.config(function($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/home');

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'partials/home.html',
      controller: 'homeController'
    })
   .state('page2', {
      url: '/page2',
      templateUrl: 'partials/page2.html',
      controller: 'homeController'
    })

    ;
});
