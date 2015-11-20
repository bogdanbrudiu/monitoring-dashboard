var app = angular.module('myApp', ['ngRoute', 'event-drops']);
app.factory("services", ['$http', function($http) {
  var serviceBase = 'services/';
    var obj = {};
    obj.getEntries = function(){
        return $http.get(serviceBase + 'entries');
    };
    obj.getAllEntries = function(){
        return $http.get(serviceBase + 'allentries');
    };
    obj.getEntriesByDeviceKey = function(deviceKey){
        return $http.get(serviceBase + 'allentries?deviceKey=' + deviceKey);
    };
    obj.getEntry = function(entryID){
        return $http.get(serviceBase + 'entry?id=' + entryID);
    };
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


    obj.getDevices = function(){
        return $http.get(serviceBase + 'devices');
    };
    obj.insertDevice = function (entry) {
      return $http.post(serviceBase + 'insertOrUpdateDevice', entry).then(function (results) {
        return results;
      });
	  };
  	obj.deleteDevice = function (entryID) {
	    return $http.delete(serviceBase + 'deleteDevice?deviceKey=' + entryID).then(function (status) {
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
      };

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
   $scope.entriesPromise=services.getEntriesByDeviceKey($routeParams.deviceKey).then(function(data){
        $scope.entries=data.data;
        $scope.deviceKey=$routeParams.deviceKey;
        return data.data;
    });
});

app.controller('devicesCtrl', function ($scope, $location, services) {
   $scope.editedItems = {};
   $scope.oldValues = {};
    services.getDevices().then(function(data){
        $scope.entries = data.data;
    });
    $scope.toggleEditing = function(device) {
      $scope.editedItems[device.deviceKey] =  !$scope.editedItems[device.deviceKey] || true;
      $scope.oldValues[device.deviceKey] =  $scope.oldValues[device.deviceKey]?$scope.oldValues[device.deviceKey]:device.friendlyName;
    };
    $scope.cancelEditing= function(device, $event) {
      device.friendlyName=$scope.oldValues[device.deviceKey];
      delete $scope.editedItems[device.deviceKey];
      delete $scope.oldValues[device.deviceKey]; 
      $event.stopPropagation();
    };
    $scope.saveDevice = function(device, $event) {
        $location.path('/devices');
        services.insertDevice(device);
        delete $scope.editedItems[device.deviceKey];
        delete $scope.oldValues[device.deviceKey]; 
        $event.stopPropagation();
    };
    $scope.deleteDevice = function(entry) {
        $location.path('/devices');
        if(confirm("Are you sure to delete device: "+entry.deviceKey)==true)
          services.deleteDevice(entry.deviceKey);
    };
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
      .when('/devices', {
        title: 'Devices',
        templateUrl: 'partials/devices.html',
        controller: 'devicesCtrl'
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


var eventdrops = eventdrops || angular.module("event-drops",[]);

eventdrops.directive("eventdropschart",function(){  
    return{
        restrict : "A",
        link: function($scope, $elem, $attr){
          
          $scope[$attr.eventdropschart].then(function (data) {
                  var chartdata = [];

                  function createEvent (name, dataList) {
                      var event = {
                          name: name,
                          dates: []
                      };
                      angular.forEach(dataList, function(value) {
                         event.dates.push(new Date(value.timestamp));
                      }, event);

                      return event;
                  }
                  
                    
                    chartdata.push(createEvent("On", data.filter(function(item) {    
                      return item.state == 1;
                    })));
                    chartdata.push(createEvent("Off",data.filter(function(item) {    
                      return item.state == 2;
                    })));

                  
                  var color = d3.scale.category20();
                  // create chart function
                  
                  var endDate=new Date();
                  var startDate=new Date();
                  startDate.setDate(startDate.getDate() - 30);
   
                  
                  var eventDropsChart = d3.chart.eventDrops()
                      .eventLineColor(function (datum, index) {
                          return color(index);
                      })
                      .start(startDate)
                      .end(endDate);
                  
                  // bind data with DOM

                  var element = d3.select($elem[0]).datum(chartdata);
                  
                  // draw the chart
                  eventDropsChart(element);
                  
          });
          
           
            

            
        }
    }
});