app.controller('homeController', function ($scope) {
  $scope.helloworld = "Hello world by AngularJS";
});

app.controller('loginController', function ($scope, $rootScope, $state, $http, $localStorage, Notification) {

  // check if user is already logged
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

app.controller('registerController', function ($scope, $http, Notification) {

  $scope.show_alert = false;

  $scope.registerUser = function() {

    $http({
      method: 'POST',
      url: path + "/register",
      data: $.param({ email: $scope.email , name: $scope.username, password: $scope.password }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(
      function(res) {
        if (res.data.success)
          Notification.success("Registered successfully check email!");
        else
          Notification.error("Error during the registration");
      },
      function(err) {
        Notification.error("Error!");
      }
    );

    $scope.show_alert = true;
  };

});

app.controller('scriptsController', function ($scope, $http, $rootScope, $timeout, Notification, Upload) {

  // init variables
  $scope.f = null;
  $scope.errFile = null;

  // send script
  $scope.uploadScript = function(scriptName, script) {

    $http({
      method: 'POST',
      url: path + "/upload",
      data: $.param({ param_script: script, name: scriptName }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(
      function(res) {
        if (res.data.success)
          Notification.success("Script sent!");
        else
          Notification.error("Error!");
      },
      function(err) {
        Notification.error("Error!");
      }
    );

  };

  // update file path
  $scope.setFile = function(file, errFiles) {
     $scope.f = file;
     $scope.errFile = errFiles && errFiles[0];
  };

  // upload file
  $scope.uploadFile = function(file, errFiles) {
    if (file) {
        file.upload = Upload.upload({
            url: path + "/upload",
            data: { sampleFile: file }
        });

        file.upload.then(function (response) {
            $timeout(function () {
                file.result = response.data;
                Notification.success("Script uploaded!");
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
