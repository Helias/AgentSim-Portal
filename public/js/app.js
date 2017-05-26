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

app.controller('homeController', function ($scope) {
  $scope.helloworld = "Hello world by AngularJS";
});

app.controller('loginController', function ($scope, $rootScope, $state, $http, $localStorage, Notification) {

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

app.controller('scriptsController', function ($scope, $http, $rootScope, $timeout, Notification, Upload) {

  $scope.f = null;
  $scope.errFile = null;

  $scope.setFile = function(file, errFiles) {
     $scope.f = file;
     $scope.errFile = errFiles && errFiles[0];
  };

  $scope.uploadFile = function(file, errFiles) {
    if (file) {
        file.upload = Upload.upload({
            url: path + "/upload",
            data: { sampleFile: file }
        });

        file.upload.then(function (response) {
            $timeout(function () {
                file.result = response.data;
            });
        }, function (response) {
            if (response.status > 0)
                $scope.errorMsg = response.status + ': ' + response.data;
        }, function (evt) {
            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        });
    }
  };


});
