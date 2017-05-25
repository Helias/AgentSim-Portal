var app = angular.module('app', [ 'ui.router',
                                  'ui.bootstrap',
                                  'ui-notification',
                                  'ngStorage',
                                  'angular-loading-bar'
                                ]);

app.run(function($rootScope, $localStorage){
  $rootScope.user = ($localStorage.user != null && $localStorage.user.token != "") ? $localStorage.user : "";
});


app.controller('homeController', function ($scope) {
  $scope.helloworld = "Hello world by AngularJS";
});

app.controller('loginController', function ($scope, $rootScope, $state, $http, $localStorage, Notification) {

  var path = "http://localhost:8080/api";

  if ($rootScope.user != null && $rootScope.user.token != "") {
    $rootScope.user = null;
    $localStorage.user = null;
  }

  $scope.loginUser = function() {

    $http({
        method: 'POST',
        url: path + "/authenticate",
        data: $.param({ name: $scope.username, password: $scope.password }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(
        function(res) {
          if (res.data.success) {
            $localStorage.user = { token : res.data.token, name : $scope.username };
            $rootScope.user = $localStorage.user;
            $state.go("home");
            Notification.success("Logged successfully");
          }
          else
            Notification.error("Wrong username or password!");
        },
        function(err) {
          Notification.error("Error!");
        }
    );

  };
});
