var app = angular.module('app', [ 'ui.router',
                                  'ui.bootstrap',
                                  'ui-notification',
                                  'ngStorage',
                                  'angular-loading-bar'
                                ]);

app.controller('homeController', function ($scope) {
  $scope.helloworld = "Hello world by AngularJS";
});

app.controller('loginController', function ($scope, $state, $http, $localStorage, Notification) {

  var path = "http://localhost:8080/api";

  $scope.loginUser = function() {

    $http({
        method: 'POST',
        url: path + "/authenticate",
        data: $.param({ name: $scope.username, password: $scope.password }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(
        function(res) {
          $localStorage.token = res.data.token;
          $state.go("home");
          Notification.success("Logged successfully");
        },
        function(err) {
          Notification.error("Error!");
        }
    );

  };
});
