angular.module('freelanceHubApp')
.controller('AdminDashboardController', ['$scope', 'DataService', '$rootScope', function ($scope, DataService, $rootScope) {
  $scope.activeTab = 'stats'; // 'stats' | 'users' | 'categories' | 'projects' | 'orders' | 'transactions' | 'withdrawals' | 'disputes' | 'settings'
  $scope.stats = {};
  $scope.users = [];
  $scope.categories = [];
  $scope.projects = [];
  $scope.orders = [];
  $scope.transactions = [];
  $scope.withdrawals = [];
  $scope.disputes = [];
  $scope.isLoading = true;

  // New Category Model
  $scope.newCategory = {
    name: '',
    icon: 'bi-briefcase',
    description: ''
  };

  // Commission Edit Model
  $scope.commissionPercent = 10;

  // Withdrawal Remarks Model
  $scope.selectedWithdrawal = null;
  $scope.withdrawalRemarks = '';

  // Dispute Resolution Model
  $scope.selectedDispute = null;
  $scope.disputeResolutionNotes = '';

  $scope.loadAllAdminData = function () {
    $scope.isLoading = true;

    // Load Stats
    DataService.getAdminStats().then(function (res) {
      if (res.success) {
        $scope.stats = res.stats;
        $scope.commissionPercent = res.stats.commissionPercent;
      }
    });

    // Load Users
    DataService.getAdminUsers().then(function (res) {
      if (res.success) {
        $scope.users = res.data;
      }
    });

    // Load Categories
    DataService.getCategories().then(function (res) {
      if (res.success) {
        $scope.categories = res.data;
      }
    });

    // Load Projects
    DataService.getProjects({ status: '' }).then(function (res) {
      if (res.success) {
        $scope.projects = res.data;
      }
    });

    // Load Orders
    DataService.getMyOrders().then(function (res) {
      if (res.success) {
        $scope.orders = res.data;
      }
    });

    // Load Transactions
    DataService.getAllTransactions().then(function (res) {
      if (res.success) {
        $scope.transactions = res.data;
      }
    });

    // Load Withdrawals
    DataService.getWithdrawalRequests().then(function (res) {
      if (res.success) {
        $scope.withdrawals = res.data;
      }
    });

    // Load Disputes
    DataService.getDisputes().then(function (res) {
      if (res.success) {
        $scope.disputes = res.data;
      }
      $scope.isLoading = false;
    });
  };

  $scope.setTab = function (tab) {
    $scope.activeTab = tab;
  };

  // Toggle User Status (Active / Suspended)
  $scope.toggleUserStatus = function (user) {
    var action = user.status === 'active' ? 'suspend' : 'activate';
    if (confirm('Are you sure you want to ' + action + ' account for ' + user.name + '?')) {
      DataService.toggleUserStatus(user._id).then(function (res) {
        user.status = res.data.status;
        $rootScope.showToast(res.message, 'info');
      });
    }
  };

  // Toggle Verified Freelancer Badge
  $scope.toggleVerifyFreelancer = function (user) {
    DataService.toggleVerifyFreelancer(user._id).then(function (res) {
      user.isVerified = res.data.isVerified;
      $rootScope.showToast(res.message, 'success');
    });
  };

  // Create Category
  $scope.addCategory = function () {
    if (!$scope.newCategory.name) return;

    DataService.createCategory($scope.newCategory).then(function (res) {
      $rootScope.showToast('Category "' + res.data.name + '" added successfully!', 'success');
      $scope.newCategory = { name: '', icon: 'bi-briefcase', description: '' };
      $scope.loadAllAdminData();
    }).catch(function (err) {
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error adding category.', 'danger');
    });
  };

  // Delete Category
  $scope.deleteCategory = function (id, name) {
    if (confirm('Delete category "' + name + '"?')) {
      DataService.deleteCategory(id).then(function () {
        $rootScope.showToast('Category removed.', 'info');
        $scope.loadAllAdminData();
      });
    }
  };

  // Update Commission
  $scope.updateCommission = function () {
    DataService.updateCommission($scope.commissionPercent).then(function (res) {
      $rootScope.showToast(res.message, 'success');
    }).catch(function (err) {
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error updating commission.', 'danger');
    });
  };

  // Process Withdrawal (Approve or Reject)
  $scope.processWithdrawal = function (id, status, remarks) {
    DataService.updateWithdrawalStatus(id, { status: status, remarks: remarks }).then(function (res) {
      $rootScope.showToast(res.message, 'success');
      $scope.loadAllAdminData();
    }).catch(function (err) {
      $rootScope.showToast(err.data && err.data.message ? err.data.message : 'Error processing withdrawal.', 'danger');
    });
  };

  // Resolve Dispute
  $scope.resolveDispute = function (id, status, notes) {
    DataService.resolveDispute(id, { status: status, resolutionNotes: notes }).then(function (res) {
      $rootScope.showToast(res.message, 'success');
      $scope.loadAllAdminData();
    });
  };

  $scope.loadAllAdminData();
}]);
