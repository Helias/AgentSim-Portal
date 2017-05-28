var app = angular.module('app', [ 'ui.router',
                                  'ui.bootstrap',
                                  'ui-notification',
                                  'ngStorage',
                                  'angular-loading-bar',
                                  'ngFileUpload'
                                ]);

var path = "http://localhost:8080/api";

app.run(function($rootScope, $localStorage, $state){
  $rootScope.user = ($localStorage.user != null && $localStorage.user.token != "") ? $localStorage.user : "";

  $rootScope.logout = function() {
    $rootScope.user = "";
    $localStorage.user = "";
    $state.go("login");
  };

});
