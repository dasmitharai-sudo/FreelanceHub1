angular.module('freelanceHubApp')
.controller('ServiceCompareController', ['$scope', '$routeParams', '$location', 'DataService', function ($scope, $routeParams, $location, DataService) {
  $scope.allServices = [];
  $scope.selectedServiceIds = [];
  $scope.comparedServices = [];
  $scope.selectedTier = 'basic'; // 'basic' | 'standard' | 'premium'
  $scope.isLoading = true;

  $scope.init = function () {
    DataService.getServices().then(function (res) {
      if (res.success) {
        $scope.allServices = res.data;
        if ($routeParams.ids) {
          $scope.selectedServiceIds = $routeParams.ids.split(',');
        } else if ($scope.allServices.length >= 2) {
          $scope.selectedServiceIds = [$scope.allServices[0]._id, $scope.allServices[1]._id];
        }
        $scope.fetchComparedServices();
      }
      $scope.isLoading = false;
    });
  };

  $scope.fetchComparedServices = function () {
    if ($scope.selectedServiceIds.length === 0) return;
    DataService.compareServices($scope.selectedServiceIds.join(',')).then(function (res) {
      if (res.success) {
        $scope.comparedServices = res.data;
      }
    });
  };

  $scope.addServiceToCompare = function (serviceId) {
    if ($scope.selectedServiceIds.indexOf(serviceId) === -1 && $scope.selectedServiceIds.length < 3) {
      $scope.selectedServiceIds.push(serviceId);
      $scope.fetchComparedServices();
    }
  };

  $scope.removeServiceFromCompare = function (index) {
    $scope.selectedServiceIds.splice(index, 1);
    $scope.comparedServices.splice(index, 1);
  };

  $scope.viewService = function (id) {
    $location.path('/services/' + id);
  };

  $scope.init();
}]);
