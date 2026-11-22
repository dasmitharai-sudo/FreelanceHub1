angular.module('freelanceHubApp')
.controller('OrderDetailController', ['$scope', '$routeParams', '$location', 'DataService', '$rootScope', function ($scope, $routeParams, $location, DataService, $rootScope) {
  $scope.orderId = $routeParams.id;
  $scope.order = null;
  $scope.isLoading = true;

  // Freelancer delivery model
  $scope.deliveryData = { message: '' };

  // Client revision notes model
  $scope.revisionNotes = '';

  // Review model
  $scope.reviewData = { rating: 5, comment: '' };

  // Dispute model
  $scope.disputeData = { reason: '', description: '' };

  $scope.loadOrder = function () {
    DataService.getOrder($scope.orderId).then(function (res) {
      if (res.success) {
        $scope.order = res.data;
      }
      $scope.isLoading = false;
    }).catch(function () {
      $scope.isLoading = false;
      $rootScope.showToast('Order not found or unauthorized access.', 'danger');
      $location.path('/services');
    });
  };

  // Freelancer submits delivery
  $scope.deliverOrder = function () {
    var formData = new FormData();
    formData.append('message', $scope.deliveryData.message);

    var fileInput = document.getElementById('orderDeliveryFile');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append('deliveryFile', fileInput.files[0]);
    }

    DataService.deliverOrder($scope.order._id, formData).then(function (res) {
      $rootScope.showToast('Work delivered successfully! Waiting for client review.', 'success');
      $scope.loadOrder();
    }).catch(function (err) {
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error submitting delivery.', 'danger');
    });
  };

  // Client requests revision
  $scope.requestRevision = function () {
    if (!$scope.revisionNotes) {
      $rootScope.showToast('Please specify what changes are needed.', 'warning');
      return;
    }

    DataService.requestOrderRevision($scope.order._id, $scope.revisionNotes).then(function () {
      $rootScope.showToast('Revision request sent to the freelancer.', 'info');
      $scope.loadOrder();
    });
  };

  // Client approves delivery & releases escrow funds
  $scope.approveOrder = function () {
    if (confirm('Approve delivery and release escrow payment to the freelancer?')) {
      DataService.approveOrder($scope.order._id).then(function (res) {
        $rootScope.showToast('Order completed! Escrow funds released.', 'success');
        $scope.loadOrder();
        $('#orderReviewModal').modal('show');
      }).catch(function (err) {
        $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error approving order.', 'danger');
      });
    }
  };

  // Submit review
  $scope.submitReview = function () {
    DataService.createReview({
      orderId: $scope.order._id,
      rating: $scope.reviewData.rating,
      comment: $scope.reviewData.comment
    }).then(function () {
      $('#orderReviewModal').modal('hide');
      $rootScope.showToast('Thank you for rating your experience!', 'success');
    }).catch(function (err) {
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error submitting review.', 'danger');
    });
  };

  // Raise dispute
  $scope.submitDispute = function () {
    var againstUserId = $rootScope.currentUser._id === $scope.order.client._id
      ? $scope.order.freelancer._id
      : $scope.order.client._id;

    DataService.createDispute({
      orderId: $scope.order._id,
      againstUserId: againstUserId,
      reason: $scope.disputeData.reason,
      description: $scope.disputeData.description
    }).then(function () {
      $('#orderDisputeModal').modal('hide');
      $rootScope.showToast('Dispute opened. FreelanceHub admin will arbitrate.', 'info');
    });
  };

  $scope.loadOrder();
}]);
