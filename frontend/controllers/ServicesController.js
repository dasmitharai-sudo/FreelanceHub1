angular.module('freelanceHubApp')
.controller('ServicesController', ['$scope', '$location', '$routeParams', 'DataService', '$rootScope', function ($scope, $location, $routeParams, DataService, $rootScope) {
  $scope.services = [];
  $scope.isLoading = true;
  $scope.filters = {
    search: $routeParams.search || '',
    category: $routeParams.category || 'All',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    deliveryDays: '',
    sort: 'newest'
  };

  // Model for Creating a Service (Freelancer)
  $scope.newService = {
    title: '',
    category: '',
    description: '',
    deliveryDays: 3,
    requiredInfo: 'Please share your project specifications, assets, and target delivery requirements.',
    packages: {
      basic: {
        name: 'Basic Package',
        description: 'Starter tier with core essentials and standard delivery.',
        price: 999,
        deliveryDays: 3,
        revisions: 1,
        features: ['Core Deliverable', 'Standard Delivery']
      },
      standard: {
        name: 'Standard Package',
        description: 'Enhanced features, faster turnaround, and additional assets.',
        price: 2499,
        deliveryDays: 5,
        revisions: 3,
        features: ['Enhanced Deliverable', 'Source Files', 'Priority Support']
      },
      premium: {
        name: 'Premium VIP Package',
        description: 'Complete high-tier production with all commercial licenses, fastest delivery, and unlimited support.',
        price: 5999,
        deliveryDays: 7,
        revisions: 5,
        features: ['VIP Full Deliverable', 'Source Files', 'Commercial Rights', 'Dedicated Support']
      }
    }
  };

  $scope.loadServices = function () {
    $scope.isLoading = true;
    var params = {};
    if ($scope.filters.search) params.search = $scope.filters.search;
    if ($scope.filters.category && $scope.filters.category !== 'All') params.category = $scope.filters.category;
    if ($scope.filters.minPrice) params.minPrice = $scope.filters.minPrice;
    if ($scope.filters.maxPrice) params.maxPrice = $scope.filters.maxPrice;
    if ($scope.filters.minRating) params.minRating = $scope.filters.minRating;
    if ($scope.filters.deliveryDays) params.deliveryDays = $scope.filters.deliveryDays;
    if ($scope.filters.sort) params.sort = $scope.filters.sort;

    DataService.getServices(params).then(function (res) {
      if (res.success) {
        $scope.services = res.data;
      }
      $scope.isLoading = false;
    }).catch(function () {
      $scope.isLoading = false;
    });
  };

  $scope.applyFilters = function () {
    $scope.loadServices();
  };

  $scope.resetFilters = function () {
    $scope.filters = {
      search: '',
      category: 'All',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      deliveryDays: '',
      sort: 'newest'
    };
    $scope.loadServices();
  };

  // Submit New Service Listing
  $scope.createServiceListing = function () {
    $scope.isSubmitting = true;
    var formData = new FormData();
    formData.append('title', $scope.newService.title);
    formData.append('category', $scope.newService.category);
    formData.append('description', $scope.newService.description);
    formData.append('deliveryDays', $scope.newService.deliveryDays);
    formData.append('requiredInfo', $scope.newService.requiredInfo);
    formData.append('packages', JSON.stringify($scope.newService.packages));

    var imgInput = document.getElementById('serviceImages');
    if (imgInput && imgInput.files && imgInput.files.length > 0) {
      for (var i = 0; i < imgInput.files.length; i++) {
        formData.append('images', imgInput.files[i]);
      }
    }

    DataService.createService(formData).then(function (res) {
      $scope.isSubmitting = false;
      $rootScope.showToast('Service listing published successfully!', 'success');
      $location.path('/services/' + res.data._id);
    }).catch(function (err) {
      $scope.isSubmitting = false;
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error publishing service.', 'danger');
    });
  };

  // Delete Service
  $scope.deleteService = function (id) {
    if (confirm('Are you sure you want to remove this service listing?')) {
      DataService.deleteService(id).then(function () {
        $rootScope.showToast('Service removed successfully.', 'info');
        $scope.loadServices();
      });
    }
  };

  $scope.loadServices();
}]);
