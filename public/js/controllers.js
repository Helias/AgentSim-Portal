app.controller('homeController', function ($scope) {

  $(function() {
    $('#commits').githubInfoWidget({ user: 'Helias', repo: 'AgentSim-Portal', branch: 'master', last: 10, limitMessageTo: 60 });
  });

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
      url: path + "api/authenticate",
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

app.controller('registerController', function ($scope, $http, $state, Notification) {

  $scope.alertMessage = "";

  $scope.registerUser = function() {

    $http({
      method: 'POST',
      url: path + "api/register",
      data: $.param({ email: $scope.email , name: $scope.username, password: $scope.password }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(
      function(res) {
        if (res.data.success) {
          Notification.success(res.data.message);
          $scope.alertMessage = res.data.message;
          $state.go("home");
        }
        else {
          Notification.error(res.data.message);
          $scope.alertMessage = res.data.message;
        }
      },
      function(err) {
        Notification.error("Error!");
        $scope.alertMessage = "Registered successfully! Check email!";
      }
    );

  };

});

app.controller('scriptsController', function ($scope, $http, $rootScope, $timeout, $stateParams, Notification, Upload) {

  // init variables
  $scope.f = null;
  $scope.errFile = null;

  $scope.from = $stateParams.from == null ? 0 : $stateParams.from;

  // show scripts
  $scope.showScripts = function() {
    $http.get(path + "api/scripts?from=" + $scope.from)
      .then(function(res) {

        $scope.scripts = res.data;
        for (var i in $scope.scripts)
          $scope.scripts[i].creation = new Date($scope.scripts[i].creation);

      }, function(res) {
        console.log("http error!");
    });
  };
  $scope.showScripts();

  // send script
  $scope.uploadScript = function(scriptName, script) {

    $http({
      method: 'POST',
      url: path + "api/upload",
      data: $.param({ param_script: script, name: scriptName, token: $rootScope.user.token }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(
      function(res) {
        if (res.data.success)
          Notification.success("Script sent!");
        else
          Notification.error(res.data.message);
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
            url: path + "api/upload",
            data: { sampleFile: file, token: $rootScope.user.token}
        });

        file.upload.then(function (response) {
            $timeout(function () {
                file.result = response.data;
                if (response.data.success)
                  Notification.success(response.data.message);
                else
                  Notification.error(response.data.message);
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


app.controller('myScriptsController', function ($scope, $http, $state, $rootScope, $stateParams, Notification) {

  if ($rootScope.user.name == null || $rootScope.user.name == '')
    $state.go("home");

  $scope.from = $stateParams.page == null ? 0 : $stateParams.page;

  $scope.enableModify = $stateParams.id == null ? false : true;

  if ($stateParams.id != null) {

    $scope.curretTab = 1;

    $http.get(path + "api/getScript/" + $stateParams.id + "?token=" + $rootScope.user.token)
      .then(function(response) {

        if (response.data.success) {
          $scope.scriptName = response.data.path.replace("-" +  response.data.users_id, "");
          $scope.script = response.data.code;
          Notification.success("Script loaded!");
        }
        else
          Notification.error(response.data.message);

      }, function(response) {
        console.log("Error!");
    });
  }

  $scope.showScripts = function() {
    $http.get(path + "api/scripts/" + $rootScope.user.name + "?from=" + $scope.from + "&token=" + $rootScope.user.token)
      .then(function(res) {

        $scope.scripts = res.data;
        for (var i in $scope.scripts)
          $scope.scripts[i].creation = new Date($scope.scripts[i].creation);

      }, function(res) {
        console.log("http error!");
    });
  };
  $scope.showScripts();

  $scope.modifyScript = function(scriptName, script) {
    $http({
      method: 'POST',
      url: path + "api/modify",
      data: $.param({ id_script: $stateParams.id, value: script, name: scriptName, token: $rootScope.user.token }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(
      function(res) {
        if (res.data.success)
          Notification.success("Script updated!");
        else
          Notification.error(res.data.message);
      },
      function(err) {
        Notification.error("Error!");
      }
    );
  };

});
