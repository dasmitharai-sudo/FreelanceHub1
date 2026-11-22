angular.module('freelanceHubApp')
.controller('ProjectController', ['$scope', '$routeParams', '$location', 'DataService', '$rootScope', function ($scope, $routeParams, $location, DataService, $rootScope) {
  $scope.projects = [];
  $scope.project = null;
  $scope.myProposal = null;
  $scope.allProposals = [];
  $scope.isLoading = true;
  $scope.isSubmitting = false;

  $scope.filters = {
    search: $routeParams.search || '',
    category: $routeParams.category || 'All',
    paymentType: 'All',
    minBudget: '',
    maxBudget: ''
  };

  // Post Project Model
  $scope.newProject = {
    title: '',
    description: '',
    category: '',
    skills: '',
    budget: 5000,
    deadline: '',
    paymentType: 'fixed',
    milestones: []
  };

  $scope.milestoneInput = { title: '', amount: 1000 };

  // Apply / Submit Proposal Model
  $scope.proposalInput = {
    bidAmount: 5000,
    deliveryDays: 7,
    coverLetter: ''
  };

  // Add Milestone to new project form
  $scope.addMilestoneField = function () {
    if (!$scope.milestoneInput.title || !$scope.milestoneInput.amount) return;
    $scope.newProject.milestones.push({
      title: $scope.milestoneInput.title,
      amount: Number($scope.milestoneInput.amount),
      status: 'Pending'
    });
    $scope.milestoneInput = { title: '', amount: 1000 };
  };

  $scope.removeMilestoneField = function (index) {
    $scope.newProject.milestones.splice(index, 1);
  };

  // Load Projects List
  $scope.loadProjects = function () {
    $scope.isLoading = true;
    var params = {};
    if ($scope.filters.search) params.search = $scope.filters.search;
    if ($scope.filters.category && $scope.filters.category !== 'All') params.category = $scope.filters.category;
    if ($scope.filters.paymentType && $scope.filters.paymentType !== 'All') params.paymentType = $scope.filters.paymentType;
    if ($scope.filters.minBudget) params.minBudget = $scope.filters.minBudget;
    if ($scope.filters.maxBudget) params.maxBudget = $scope.filters.maxBudget;

    DataService.getProjects(params).then(function (res) {
      if (res.success) {
        $scope.projects = res.data;
      }
      $scope.isLoading = false;
    }).catch(function () {
      $scope.isLoading = false;
    });
  };

  // Load Single Project Detail
  $scope.loadProjectDetail = function () {
    if (!$routeParams.id) return;
    $scope.isLoading = true;
    DataService.getProject($routeParams.id).then(function (res) {
      if (res.success) {
        $scope.project = res.data;
        $scope.myProposal = res.myProposal;
        $scope.allProposals = res.allProposals || [];
        $scope.proposalInput.bidAmount = res.data.budget;
      }
      $scope.isLoading = false;
    }).catch(function () {
      $scope.isLoading = false;
      $rootScope.showToast('Project not found.', 'danger');
      $location.path('/projects');
    });
  };

  // Post Project (Client)
  $scope.postProject = function () {
    if (!$scope.newProject.title || !$scope.newProject.description || !$scope.newProject.category) {
      $rootScope.showToast('Please complete all required project fields.', 'warning');
      return;
    }

    $scope.isSubmitting = true;
    var formData = new FormData();
    formData.append('title', $scope.newProject.title);
    formData.append('description', $scope.newProject.description);
    formData.append('category', $scope.newProject.category);
    formData.append('skills', $scope.newProject.skills);
    formData.append('budget', $scope.newProject.budget);
    formData.append('deadline', $scope.newProject.deadline || new Date(Date.now() + 10 * 86400000).toISOString());
    formData.append('paymentType', $scope.newProject.paymentType);

    if ($scope.newProject.milestones.length > 0) {
      formData.append('milestones', JSON.stringify($scope.newProject.milestones));
    }

    var fileInput = document.getElementById('projectFiles');
    if (fileInput && fileInput.files) {
      for (var i = 0; i < fileInput.files.length; i++) {
        formData.append('attachments', fileInput.files[i]);
      }
    }

    DataService.createProject(formData).then(function (res) {
      $scope.isSubmitting = false;
      $rootScope.showToast('Project posted successfully! Freelancers can now submit proposals.', 'success');
      $location.path('/projects/' + res.data._id);
    }).catch(function (err) {
      $scope.isSubmitting = false;
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error posting project.', 'danger');
    });
  };

  // Submit Proposal (Freelancer)
  $scope.submitProposal = function () {
    if (!$scope.proposalInput.coverLetter || !$scope.proposalInput.bidAmount) {
      $rootScope.showToast('Please provide your bid and proposal letter.', 'warning');
      return;
    }

    $scope.isSubmitting = true;
    DataService.applyForProject({
      projectId: $scope.project._id,
      bidAmount: $scope.proposalInput.bidAmount,
      deliveryDays: $scope.proposalInput.deliveryDays,
      coverLetter: $scope.proposalInput.coverLetter
    }).then(function (res) {
      $scope.isSubmitting = false;
      $scope.myProposal = res.data;
      $rootScope.showToast('Proposal submitted successfully!', 'success');
      $scope.loadProjectDetail();
    }).catch(function (err) {
      $scope.isSubmitting = false;
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error submitting proposal.', 'danger');
    });
  };

  // Accept Proposal & Hire Freelancer (Client)
  $scope.acceptProposal = function (proposalId) {
    if (confirm('Accept this proposal and hire the freelancer? Funds will be placed in simulated escrow.')) {
      DataService.acceptProposal(proposalId).then(function (res) {
        $rootScope.showToast('Freelancer hired! Opening Project Workspace...', 'success');
        $location.path('/workspace/' + res.project._id);
      }).catch(function (err) {
        $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error accepting proposal.', 'danger');
      });
    }
  };

  // Reject Proposal (Client)
  $scope.rejectProposal = function (proposalId) {
    DataService.rejectProposal(proposalId).then(function () {
      $rootScope.showToast('Proposal rejected.', 'info');
      $scope.loadProjectDetail();
    });
  };

  // Withdraw Proposal (Freelancer)
  $scope.withdrawProposal = function (proposalId) {
    if (confirm('Withdraw your proposal?')) {
      DataService.withdrawProposal(proposalId).then(function () {
        $rootScope.showToast('Proposal withdrawn.', 'info');
        $scope.myProposal = null;
        $scope.loadProjectDetail();
      });
    }
  };

  if ($routeParams.id) {
    $scope.loadProjectDetail();
  } else {
    $scope.loadProjects();
  }
}]);
