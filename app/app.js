var app = angular.module('myApp', ['ngRoute']);
app.factory("services", ['$http', function($http) {
  var serviceBase = 'services/'
    var obj = {};
    obj.getEntries = function(){
        return $http.get(serviceBase + 'entries');
    }
    obj.getAllEntries = function(){
        return $http.get(serviceBase + 'allentries');
    }
    obj.getEntriesByDeviceKey = function(deviceKey){
        return $http.get(serviceBase + 'allentries?deviceKey=' + deviceKey);
    }
    obj.getEntry = function(entryID){
        return $http.get(serviceBase + 'entry?id=' + entryID);
    }

    obj.insertEntry = function (entry) {
    return $http.post(serviceBase + 'insertEntry', entry).then(function (results) {
        return results;
    });
	};

	obj.updateEntry = function (entryID,entry) {
	    return $http.post(serviceBase + 'updateEntry', {id:entryID, entry:entry}).then(function (status) {
	        return status.data;
	    });
	};

	obj.deleteEntry = function (entryID) {
	    return $http.delete(serviceBase + 'deleteEntry?id=' + entryID).then(function (status) {
	        return status.data;
	    });
	};

    return obj;   
}]);

app.controller('listCtrl', function ($scope, services) {
    services.getEntries().then(function(data){
        $scope.entries = data.data;
        $scope.showActions=false;
        $scope.showHistory=true;
    });
});
app.controller('listAllCtrl', function ($scope, services) {
    services.getAllEntries().then(function(data){
        $scope.entries = data.data;
        $scope.showActions=true;
        $scope.showHistory=false;
    });
});
app.controller('editCtrl', function ($scope, $rootScope, $location, $routeParams, services, entry) {
    var entryID = ($routeParams.entryID) ? parseInt($routeParams.entryID) : 0;
    $rootScope.title = (entryID > 0) ? 'Edit Entry' : 'Add Entry';
    $scope.buttonText = (entryID > 0) ? 'Update Entry' : 'Add New Entry';
      var original = entry.data;
      original._id = entryID;
      $scope.entry = angular.copy(original);
      $scope.entry._id = entryID;

      $scope.isClean = function() {
        return angular.equals(original, $scope.entry);
      }

      $scope.deleteEntry = function(entry) {
        $location.path('/entries');
        if(confirm("Are you sure to delete entry number: "+$scope.entry._id)==true)
        services.deleteEntry(entry.id);
      };

      $scope.saveEntry = function(entry) {
        $location.path('/entries');
        if (entryID <= 0) {
            services.insertEntry(entry);
        }
        else {
            services.updateEntry(entryID, entry);
        }
    };
});
app.controller('historyCtrl', function ($scope, $routeParams, services) {
  services.getEntriesByDeviceKey($routeParams.deviceKey).then(function(data){
        $scope.entries = data.data;
    });
});
app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        title: 'Dashboard',
        templateUrl: 'partials/entries.html',
        controller: 'listCtrl'
      })
      .when('/entries', {
        title: 'Entries',
        templateUrl: 'partials/entries.html',
        controller: 'listAllCtrl'
      })
      .when('/edit-entry/:entryID', {
        title: 'Edit Entry',
        templateUrl: 'partials/edit-entry.html',
        controller: 'editCtrl',
        resolve: {
          entry: function(services, $route){
            var entryID = $route.current.params.entryID;
            return services.getEntry(entryID);
          }
        }
      })
      .when('/entry-history/:deviceKey', {
        title: 'Entry History',
        templateUrl: 'partials/entry-history.html',
        controller: 'historyCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
}]);
app.run(['$location', '$rootScope', function($location, $rootScope) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
}]);