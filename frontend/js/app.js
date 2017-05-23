var app = angular.module('app', [ 'ui.router', 'ui.bootstrap', 'ui-notification' ]);

app.controller('homeController', function ($scope) {
  $scope.helloworld = "Hello world by AngularJS";
});

app.controller('loginController', function ($scope, $state, $http, Notification) {
  var path = "http://localhost:8080/";

  $scope.loginUser = function() {
    $http({
      url: path + "api/authenticate",
      method: "POST",
      data: { 'name' : $scope.username, 'password' : $scope.password }
    })
    .then(function(response) {
      $scope.result = response.data;
      if ($scope.result["result"]){
        $localStorage.token = $scope.result["result"];
        $state.go("/");
      }
      else if ($scope.result["error"])
        Notification.error($scope.result["error"]);
    },
    function(response) {
      console.log("http Request error!");
    });
  };
});
