angular.module('freelanceHubApp')
.controller('ServiceDetailController', ['$scope', '$routeParams', '$location', 'DataService', 'PaymentService', '$rootScope', function ($scope, $routeParams, $location, DataService, PaymentService, $rootScope) {
  $scope.service = null;
  $scope.freelancerProfile = null;
  $scope.reviews = [];
  $scope.relatedServices = [];
  $scope.selectedPackageType = 'basic'; // 'basic' | 'standard' | 'premium'
  $scope.orderRequirements = '';
  $scope.isLoading = true;
  $scope.isOrdering = false;

  $scope.loadService = function () {
    DataService.getService($routeParams.id).then(function (res) {
      if (res.success) {
        $scope.service = res.data;
        $scope.freelancerProfile = res.freelancerProfile;
        $scope.reviews = res.reviews;
        $scope.relatedServices = res.relatedServices;
      }
      $scope.isLoading = false;
    }).catch(function (err) {
      $scope.isLoading = false;
      $rootScope.showToast('Service not found or inactive.', 'danger');
      $location.path('/services');
    });
  };

  $scope.setPackage = function (pkgType) {
    $scope.selectedPackageType = pkgType;
  };

  $scope.getSelectedPackage = function () {
    if (!$scope.service || !$scope.service.packages) return null;
    return $scope.service.packages[$scope.selectedPackageType];
  };

  // Direct Service Purchase Checkout (Fiverr-style)
  $scope.proceedToCheckout = function () {
    if (!$rootScope.isLoggedIn) {
      $rootScope.showToast('Please login as a client to purchase this service.', 'warning');
      $location.path('/login');
      return;
    }

    if ($rootScope.currentUser.role === 'freelancer' && $scope.service.freelancer._id === $rootScope.currentUser._id) {
      $rootScope.showToast('You cannot purchase your own service.', 'warning');
      return;
    }

    var selectedPkg = $scope.getSelectedPackage();
    if (!selectedPkg) return;

    $scope.isOrdering = true;

    // Trigger Razorpay Test Checkout
    PaymentService.processCheckout({
      amount: selectedPkg.price,
      itemName: $scope.service.title + ' (' + selectedPkg.name + ')'
    }).then(function (paymentRes) {
      // Payment verified, now create order on backend
      var orderPayload = {
        serviceId: $scope.service._id,
        packageType: $scope.selectedPackageType,
        requirements: $scope.orderRequirements || 'Standard project requirements',
        razorpayPaymentId: paymentRes.razorpayPaymentId,
        razorpayOrderId: paymentRes.razorpayOrderId,
        razorpaySignature: paymentRes.razorpaySignature
      };

      DataService.createOrder(orderPayload).then(function (res) {
        $scope.isOrdering = false;
        $rootScope.showToast('Order placed successfully! Funds are held in escrow.', 'success');
        $location.path('/orders/' + res.data._id);
      }).catch(function (err) {
        $scope.isOrdering = false;
        $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error creating order.', 'danger');
      });
    }).catch(function (err) {
      $scope.isOrdering = false;
      $rootScope.showToast(typeof err === 'string' ? err : 'Checkout cancelled.', 'info');
    });
  };

  $scope.loadService();
}]);
