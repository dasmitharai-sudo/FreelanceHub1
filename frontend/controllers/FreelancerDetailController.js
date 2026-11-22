angular.module('freelanceHubApp')
.controller('FreelancerDetailController', ['$scope', '$routeParams', '$location', 'DataService', 'AuthService', '$rootScope', function ($scope, $routeParams, $location, DataService, AuthService, $rootScope) {
  $scope.freelancerUser = null;
  $scope.profile = null;
  $scope.services = [];
  $scope.reviews = [];
  $scope.isLoading = true;
  $scope.isSaved = false;

  $scope.loadFreelancer = function () {
    DataService.getFreelancer($routeParams.id).then(function (res) {
      if (res.success) {
        $scope.freelancerUser = res.user;
        $scope.profile = res.profile;
        $scope.services = res.services;
        $scope.reviews = res.reviews;
      }
      $scope.isLoading = false;
    }).catch(function () {
      $scope.isLoading = false;
      $rootScope.showToast('Freelancer profile not found.', 'danger');
      $location.path('/freelancers');
    });

    if ($rootScope.isLoggedIn && $rootScope.currentUser.role === 'client') {
      AuthService.getMe().then(function (meRes) {
        if (meRes.clientProfile && meRes.clientProfile.savedFreelancers) {
          var ids = meRes.clientProfile.savedFreelancers.map(function (f) {
            return typeof f === 'object' ? f._id : f;
          });
          $scope.isSaved = ids.indexOf($routeParams.id) > -1;
        }
      });
    }
  };

  $scope.toggleSave = function () {
    if (!$rootScope.isLoggedIn || $rootScope.currentUser.role !== 'client') {
      $rootScope.showToast('Please login as a client to save freelancers.', 'warning');
      return;
    }

    AuthService.toggleSaveFreelancer($routeParams.id).then(function (res) {
      $scope.isSaved = res.data.isSaved;
      $rootScope.showToast($scope.isSaved ? 'Freelancer saved to bookmarks!' : 'Freelancer removed from bookmarks.', 'info');
    });
  };

  $scope.contactFreelancer = function () {
    if (!$rootScope.isLoggedIn) {
      $rootScope.showToast('Please login to message this freelancer.', 'warning');
      $location.path('/login');
      return;
    }
    $location.path('/messages').search({ contactId: $scope.freelancerUser._id });
  };

  $scope.loadFreelancer();
}]);
