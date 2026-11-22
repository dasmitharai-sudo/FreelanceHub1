angular.module('freelanceHubApp')
.controller('WorkspaceController', ['$scope', '$routeParams', '$location', 'DataService', '$rootScope', function ($scope, $routeParams, $location, DataService, $rootScope) {
  $scope.projectId = $routeParams.projectId;
  $scope.project = null;
  $scope.isLoading = true;
  $scope.activeTab = 'overview'; // 'overview' | 'milestones' | 'submission' | 'chat'

  // Submission model (Freelancer)
  $scope.submissionData = {
    workDescription: ''
  };

  // Revision notes model (Client)
  $scope.revisionNotes = '';

  // New milestone model (Client)
  $scope.newMilestone = {
    title: '',
    amount: '',
    dueDate: ''
  };

  // Workspace Chat model
  $scope.messages = [];
  $scope.chatInput = '';

  // Review Modal Model
  $scope.reviewData = {
    rating: 5,
    comment: ''
  };

  // Dispute Model
  $scope.disputeData = {
    reason: '',
    description: ''
  };

  $scope.loadWorkspace = function () {
    DataService.getProject($scope.projectId).then(function (res) {
      if (res.success) {
        $scope.project = res.data;
        $scope.loadChat();
      }
      $scope.isLoading = false;
    }).catch(function () {
      $scope.isLoading = false;
      $rootScope.showToast('Workspace project not found.', 'danger');
      $location.path('/projects');
    });
  };

  // Load chat messages for this project
  $scope.loadChat = function () {
    if (!$scope.project) return;
    var contactId = $rootScope.currentUser._id === $scope.project.client._id
      ? ($scope.project.hiredFreelancer ? $scope.project.hiredFreelancer._id : null)
      : $scope.project.client._id;

    if (contactId) {
      DataService.getMessages(contactId, { projectId: $scope.project._id }).then(function (res) {
        if (res.success) {
          $scope.messages = res.data;
        }
      });
    }
  };

  // Send message in workspace
  $scope.sendMessage = function () {
    if (!$scope.chatInput.trim()) return;

    var recipientId = $rootScope.currentUser._id === $scope.project.client._id
      ? $scope.project.hiredFreelancer._id
      : $scope.project.client._id;

    var formData = new FormData();
    formData.append('recipientId', recipientId);
    formData.append('projectId', $scope.project._id);
    formData.append('text', $scope.chatInput);

    var fileInput = document.getElementById('chatAttachment');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append('attachment', fileInput.files[0]);
    }

    DataService.sendMessage(formData).then(function (res) {
      $scope.chatInput = '';
      if (fileInput) fileInput.value = '';
      $scope.loadChat();
    });
  };

  // Submit Completed Work (Freelancer)
  $scope.submitWork = function () {
    if (!$scope.submissionData.workDescription) {
      $rootScope.showToast('Please provide a description of the completed work.', 'warning');
      return;
    }

    var formData = new FormData();
    formData.append('workDescription', $scope.submissionData.workDescription);

    var fileInput = document.getElementById('workFile');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append('workFile', fileInput.files[0]);
    }

    DataService.submitProjectWork($scope.project._id, formData).then(function (res) {
      $rootScope.showToast('Completed work submitted for client review!', 'success');
      $scope.loadWorkspace();
      $scope.activeTab = 'overview';
    }).catch(function (err) {
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error submitting work.', 'danger');
    });
  };

  // Review Submission (Client: Approve or Request Revision)
  $scope.reviewSubmission = function (action) {
    if (action === 'revision' && !$scope.revisionNotes) {
      $rootScope.showToast('Please provide revision instructions.', 'warning');
      return;
    }

    var confirmMsg = action === 'approve'
      ? 'Approve the submitted work? Escrow funds will be released to the freelancer.'
      : 'Send revision request to the freelancer?';

    if (confirm(confirmMsg)) {
      DataService.reviewProjectSubmission($scope.project._id, action, $scope.revisionNotes).then(function (res) {
        if (action === 'approve') {
          $rootScope.showToast('Project completed! Payment released to freelancer wallet.', 'success');
          // Open review modal
          $('#workspaceReviewModal').modal('show');
        } else {
          $rootScope.showToast('Revision request sent to freelancer.', 'info');
        }
        $scope.loadWorkspace();
      }).catch(function (err) {
        $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error reviewing work.', 'danger');
      });
    }
  };

  // Add Milestone
  $scope.addMilestone = function () {
    if (!$scope.newMilestone.title || !$scope.newMilestone.amount) return;

    DataService.addMilestone($scope.project._id, $scope.newMilestone).then(function (res) {
      $rootScope.showToast('Milestone added!', 'success');
      $scope.newMilestone = { title: '', amount: '', dueDate: '' };
      $scope.loadWorkspace();
    });
  };

  // Release Milestone Payment
  $scope.releaseMilestone = function (milestoneId, milestoneTitle) {
    if (confirm('Release milestone payment for "' + milestoneTitle + '"?')) {
      DataService.releaseMilestone($scope.project._id, milestoneId).then(function () {
        $rootScope.showToast('Milestone funds released to freelancer wallet!', 'success');
        $scope.loadWorkspace();
      });
    }
  };

  // Submit Review after Completion
  $scope.submitReview = function () {
    DataService.createReview({
      projectId: $scope.project._id,
      rating: $scope.reviewData.rating,
      comment: $scope.reviewData.comment
    }).then(function () {
      $('#workspaceReviewModal').modal('hide');
      $rootScope.showToast('Thank you! Your review has been submitted.', 'success');
    }).catch(function (err) {
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error submitting review.', 'danger');
    });
  };

  // Raise Dispute
  $scope.submitDispute = function () {
    var againstUserId = $rootScope.currentUser._id === $scope.project.client._id
      ? $scope.project.hiredFreelancer._id
      : $scope.project.client._id;

    DataService.createDispute({
      projectId: $scope.project._id,
      againstUserId: againstUserId,
      reason: $scope.disputeData.reason,
      description: $scope.disputeData.description
    }).then(function () {
      $('#workspaceDisputeModal').modal('hide');
      $rootScope.showToast('Dispute ticket raised. An administrator will review and arbitrate.', 'info');
    });
  };

  $scope.loadWorkspace();
}]);
