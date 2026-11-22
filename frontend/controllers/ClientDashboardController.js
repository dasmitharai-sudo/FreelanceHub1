angular.module('freelanceHubApp')
.controller('ClientDashboardController', ['$scope', '$location', 'DataService', 'AuthService', '$rootScope', function ($scope, $location, DataService, AuthService, $rootScope) {
  $scope.activeTab = 'overview'; // 'overview' | 'orders' | 'projects' | 'saved' | 'payments' | 'profile'
  $scope.orders = [];
  $scope.projects = [];
  $scope.savedFreelancers = [];
  $scope.transactions = [];
  $scope.clientProfile = null;
  $scope.isLoading = true;

  // Profile edit model
  $scope.profileForm = {
    name: '',
    phone: '',
    location: '',
    companyName: '',
    website: '',
    bio: ''
  };

  $scope.loadDashboardData = function () {
    $scope.isLoading = true;

    // Load Client Info & Profile
    AuthService.getMe().then(function (res) {
      if (res.success) {
        $scope.clientProfile = res.clientProfile;
        $scope.profileForm.name = res.user.name;
        $scope.profileForm.phone = res.user.phone || '';
        $scope.profileForm.location = res.user.location || '';
        if (res.clientProfile) {
          $scope.profileForm.companyName = res.clientProfile.companyName || '';
          $scope.profileForm.website = res.clientProfile.website || '';
          $scope.profileForm.bio = res.clientProfile.bio || '';
          $scope.savedFreelancers = res.clientProfile.savedFreelancers || [];
        }
      }
    });

    // Load My Orders
    DataService.getMyOrders().then(function (res) {
      if (res.success) {
        $scope.orders = res.data;
      }
    });

    // Load My Projects
    DataService.getProjects().then(function (res) {
      if (res.success) {
        // Filter projects posted by this client
        $scope.projects = res.data.filter(function (p) {
          return p.client && p.client._id === $rootScope.currentUser._id;
        });
      }
      $scope.isLoading = false;
    });
  };

  $scope.setTab = function (tab) {
    $scope.activeTab = tab;
  };

  // Update Client Profile
  $scope.updateProfile = function () {
    var formData = new FormData();
    formData.append('name', $scope.profileForm.name);
    formData.append('phone', $scope.profileForm.phone);
    formData.append('location', $scope.profileForm.location);

    var avatarInput = document.getElementById('clientAvatarUpload');
    if (avatarInput && avatarInput.files && avatarInput.files[0]) {
      formData.append('avatar', avatarInput.files[0]);
    }

    AuthService.updateDetails(formData).then(function (res) {
      $rootScope.showToast('Profile updated successfully!', 'success');
      if (res && res.user) {
        $scope.profileForm.name = res.user.name;
        $rootScope.currentUser.name = res.user.name;
        $rootScope.currentUser.avatar = res.user.avatar;
      }
    }).catch(function (err) {
      $rootScope.showToast('Error updating profile.', 'danger');
    });
  };

  $scope.removeSaved = function (id) {
    AuthService.toggleSaveFreelancer(id).then(function () {
      $scope.savedFreelancers = $scope.savedFreelancers.filter(function (f) {
        var fid = typeof f === 'object' ? f._id : f;
        return fid !== id;
      });
      $rootScope.showToast('Freelancer removed from bookmarks.', 'info');
    });
  };

  $scope.loadDashboardData();
}]);
