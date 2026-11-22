angular.module('freelanceHubApp')
.controller('FreelancersController', ['$scope', '$location', '$routeParams', 'DataService', 'AuthService', '$rootScope', function ($scope, $location, $routeParams, DataService, AuthService, $rootScope) {
  $scope.freelancers = [];
  $scope.isLoading = true;
  $scope.savedIds = [];

  $scope.filters = {
    search: $routeParams.search || '',
    category: $routeParams.category || 'All',
    skill: '',
    minRate: '',
    maxRate: '',
    minRating: '',
    availability: 'All',
    experience: ''
  };

  $scope.loadFreelancers = function () {
    $scope.isLoading = true;
    var params = {};
    if ($scope.filters.search) params.search = $scope.filters.search;
    if ($scope.filters.category && $scope.filters.category !== 'All') params.category = $scope.filters.category;
    if ($scope.filters.skill) params.skill = $scope.filters.skill;
    if ($scope.filters.minRate) params.minRate = $scope.filters.minRate;
    if ($scope.filters.maxRate) params.maxRate = $scope.filters.maxRate;
    if ($scope.filters.minRating) params.minRating = $scope.filters.minRating;
    if ($scope.filters.availability && $scope.filters.availability !== 'All') params.availability = $scope.filters.availability;
    if ($scope.filters.experience) params.experience = $scope.filters.experience;

    DataService.getFreelancers(params).then(function (res) {
      if (res.success) {
        $scope.freelancers = res.data;
      }
      $scope.isLoading = false;
    }).catch(function () {
      $scope.isLoading = false;
    });
  };

  // Check saved status
  $scope.checkSaved = function () {
    if ($rootScope.isLoggedIn && $rootScope.currentUser.role === 'client') {
      AuthService.getMe().then(function (res) {
        if (res.clientProfile && res.clientProfile.savedFreelancers) {
          $scope.savedIds = res.clientProfile.savedFreelancers.map(function (f) {
            return typeof f === 'object' ? f._id : f;
          });
        }
      });
    }
  };

  $scope.isFreelancerSaved = function (id) {
    return $scope.savedIds.indexOf(id) > -1;
  };

  $scope.toggleSave = function (freelancerId) {
    if (!$rootScope.isLoggedIn || $rootScope.currentUser.role !== 'client') {
      $rootScope.showToast('Please login as a client to bookmark freelancers.', 'warning');
      return;
    }

    AuthService.toggleSaveFreelancer(freelancerId).then(function (res) {
      if (res.data.isSaved) {
        $scope.savedIds.push(freelancerId);
        $rootScope.showToast('Freelancer saved to your bookmarks!', 'success');
      } else {
        $scope.savedIds = $scope.savedIds.filter(function (id) { return id !== freelancerId; });
        $rootScope.showToast('Freelancer removed from bookmarks.', 'info');
      }
    });
  };

  $scope.applyFilters = function () {
    $scope.loadFreelancers();
  };

  $scope.resetFilters = function () {
    $scope.filters = {
      search: '',
      category: 'All',
      skill: '',
      minRate: '',
      maxRate: '',
      minRating: '',
      availability: 'All',
      experience: ''
    };
    $scope.loadFreelancers();
  };

  $scope.loadFreelancers();
  $scope.checkSaved();
}]);
