angular.module('freelanceHubApp')
.controller('FreelancerDashboardController', ['$scope', '$location', 'DataService', 'AuthService', 'PaymentService', '$rootScope', function ($scope, $location, DataService, AuthService, PaymentService, $rootScope) {
  $scope.activeTab = 'overview'; // 'overview' | 'services' | 'orders' | 'proposals' | 'wallet' | 'profile'
  $scope.profile = null;
  $scope.wallet = null;
  $scope.transactions = [];
  $scope.withdrawals = [];
  $scope.myServices = [];
  $scope.myOrders = [];
  $scope.myProposals = [];
  $scope.availableProjects = [];
  $scope.isLoading = true;

  // Withdrawal form model
  $scope.withdrawForm = {
    amount: 500,
    method: 'UPI',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  };

  // Profile Edit Model
  $scope.profileForm = {
    title: '',
    hourlyRate: 500,
    experience: 2,
    availability: 'Available',
    bio: '',
    skillsStr: '',
    categories: []
  };

  // Portfolio add model
  $scope.newPortfolio = {
    title: '',
    description: '',
    link: ''
  };

  $scope.loadDashboardData = function () {
    $scope.isLoading = true;

    // Load Profile & User
    AuthService.getMe().then(function (res) {
      if (res.success) {
        $scope.profile = res.freelancerProfile;
        $scope.wallet = res.wallet;

        if ($scope.profile) {
          $scope.profileForm.title = $scope.profile.title || '';
          $scope.profileForm.hourlyRate = $scope.profile.hourlyRate || 500;
          $scope.profileForm.experience = $scope.profile.experience || 1;
          $scope.profileForm.availability = $scope.profile.availability || 'Available';
          $scope.profileForm.bio = $scope.profile.bio || '';
          $scope.profileForm.skillsStr = ($scope.profile.skills || []).join(', ');
          $scope.profileForm.categories = angular.copy($scope.profile.categories || []);
        }
      }
    });

    // Load Wallet Details & Transactions
    PaymentService.getWallet().then(function (res) {
      if (res.success) {
        $scope.wallet = res.wallet;
        $scope.transactions = res.transactions;
        $scope.withdrawals = res.withdrawals;
      }
    });

    // Load My Services
    DataService.getFreelancerServices($rootScope.currentUser._id).then(function (res) {
      if (res.success) {
        $scope.myServices = res.data;
      }
    });

    // Load My Orders
    DataService.getMyOrders().then(function (res) {
      if (res.success) {
        $scope.myOrders = res.data;
      }
    });

    // Load My Proposals
    DataService.getMyProposals().then(function (res) {
      if (res.success) {
        $scope.myProposals = res.data;
      }
    });

    // Load New Project Opportunities
    DataService.getProjects({ status: 'Pending' }).then(function (res) {
      if (res.success) {
        $scope.availableProjects = res.data.slice(0, 5);
      }
      $scope.isLoading = false;
    });
  };

  $scope.setTab = function (tab) {
    $scope.activeTab = tab;
  };

  // Toggle Category selection
  $scope.toggleCategory = function (cat) {
    var idx = $scope.profileForm.categories.indexOf(cat);
    if (idx > -1) {
      $scope.profileForm.categories.splice(idx, 1);
    } else {
      $scope.profileForm.categories.push(cat);
    }
  };

  // Update Freelancer Profile
  $scope.updateProfile = function () {
    var payload = {
      title: $scope.profileForm.title,
      hourlyRate: $scope.profileForm.hourlyRate,
      experience: $scope.profileForm.experience,
      availability: $scope.profileForm.availability,
      bio: $scope.profileForm.bio,
      skills: $scope.profileForm.skillsStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      categories: $scope.profileForm.categories
    };

    AuthService.updateFreelancerProfile(payload).then(function (res) {
      $scope.profile = res.data.freelancerProfile;
      $rootScope.showToast('Profile updated! Completion: ' + $scope.profile.profileCompletion + '%', 'success');
    }).catch(function () {
      $rootScope.showToast('Error updating profile.', 'danger');
    });
  };

  // Add Portfolio Item
  $scope.addPortfolioItem = function () {
    if (!$scope.newPortfolio.title) return;

    var formData = new FormData();
    formData.append('title', $scope.newPortfolio.title);
    formData.append('description', $scope.newPortfolio.description);
    formData.append('link', $scope.newPortfolio.link);

    var imgInput = document.getElementById('portfolioImg');
    if (imgInput && imgInput.files && imgInput.files[0]) {
      formData.append('image', imgInput.files[0]);
    }

    AuthService.addPortfolioItem(formData).then(function (res) {
      $rootScope.showToast('Portfolio item added!', 'success');
      $scope.profile.portfolio = res.data.portfolio;
      $scope.profile.profileCompletion = res.data.completion;
      $scope.newPortfolio = { title: '', description: '', link: '' };
      if (imgInput) imgInput.value = '';
    });
  };

  // Request Withdrawal
  $scope.requestWithdrawal = function () {
    var amount = Number($scope.withdrawForm.amount);
    if (!amount || amount < 100) {
      $rootScope.showToast('Minimum withdrawal amount is ₹100.', 'warning');
      return;
    }

    if (!$scope.wallet || $scope.wallet.availableBalance < amount) {
      $rootScope.showToast('Insufficient available wallet balance.', 'danger');
      return;
    }

    var accountDetails = $scope.withdrawForm.method === 'UPI'
      ? { upiId: $scope.withdrawForm.upiId }
      : {
          bankName: $scope.withdrawForm.bankName,
          accountNumber: $scope.withdrawForm.accountNumber,
          ifscCode: $scope.withdrawForm.ifscCode,
          accountHolderName: $scope.withdrawForm.accountHolderName
        };

    PaymentService.requestWithdrawal({
      amount: amount,
      method: $scope.withdrawForm.method,
      accountDetails: accountDetails
    }).then(function (res) {
      $rootScope.showToast('Withdrawal request submitted! Admin will process payout.', 'success');
      $scope.loadDashboardData();
    }).catch(function (err) {
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error submitting withdrawal.', 'danger');
    });
  };

  // Delete Service Listing
  $scope.deleteService = function (id) {
    if (confirm('Are you sure you want to delete this service listing?')) {
      DataService.deleteService(id).then(function () {
        $rootScope.showToast('Service deleted.', 'info');
        $scope.loadDashboardData();
      });
    }
  };

  $scope.loadDashboardData();
}]);
