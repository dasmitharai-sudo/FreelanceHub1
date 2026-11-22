angular.module('freelanceHubApp')
.controller('ProfileSettingsController', [
  '$scope',
  '$rootScope',
  '$location',
  'AuthService',
  'DataService',
  function ($scope, $rootScope, $location, AuthService, DataService) {
    if (!AuthService.isAuthenticated()) {
      $location.path('/login');
      return;
    }

    $scope.user = angular.copy($rootScope.currentUser || {});
    $scope.isSavingName = false;
    $scope.isEditingName = false;
    $scope.editNameVal = $scope.user.name || '';

    $scope.avatarFile = null;
    $scope.avatarPreview = null;
    $scope.isUploadingAvatar = false;
    $scope.showRemoveConfirm = false;
    $scope.isRemovingAvatar = false;

    // Account Form
    $scope.accountForm = {
      email: $scope.user.email || '',
      phone: $scope.user.phone || '',
      location: $scope.user.location || 'India',
      companyName: '',
      website: '',
      title: '',
      bio: '',
      hourlyRate: 500
    };
    $scope.isSavingAccount = false;

    // Password Form
    $scope.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    $scope.showPasswords = {
      current: false,
      new: false,
      confirm: false
    };
    $scope.isChangingPassword = false;

    // Fetch complete user profile data
    $scope.loadFullProfile = function () {
      AuthService.getMe().then(function (res) {
        if (res.success && res.user) {
          $scope.user = angular.copy(res.user);
          $scope.editNameVal = res.user.name;
          $scope.accountForm.email = res.user.email;
          $scope.accountForm.phone = res.user.phone || '';
          $scope.accountForm.location = res.user.location || 'India';

          if (res.freelancerProfile) {
            $scope.accountForm.title = res.freelancerProfile.title || '';
            $scope.accountForm.bio = res.freelancerProfile.bio || '';
            $scope.accountForm.hourlyRate = res.freelancerProfile.hourlyRate || 500;
          }

          if (res.clientProfile) {
            $scope.accountForm.companyName = res.clientProfile.companyName || '';
            $scope.accountForm.website = res.clientProfile.website || '';
          }
        }
      });
    };

    $scope.loadFullProfile();

    // Check if avatar is default
    $scope.isDefaultAvatar = function () {
      if (!$scope.user || !$scope.user.avatar) return true;
      return $scope.user.avatar.indexOf('default-avatar.png') > -1;
    };

    // ==========================================
    // 1. EDIT NAME (Inline with Edit/Save/Cancel)
    // ==========================================
    $scope.startEditName = function () {
      $scope.editNameVal = $scope.user.name;
      $scope.isEditingName = true;
    };

    $scope.cancelEditName = function () {
      $scope.editNameVal = $scope.user.name;
      $scope.isEditingName = false;
    };

    $scope.saveName = function () {
      if (!$scope.editNameVal || !$scope.editNameVal.trim()) {
        $rootScope.showToast('Please enter a valid name.', 'warning');
        return;
      }

      $scope.isSavingName = true;
      AuthService.updateDetails({ name: $scope.editNameVal.trim() })
        .then(function (res) {
          $scope.isSavingName = false;
          if (res.success) {
            $scope.user.name = res.user.name;
            $rootScope.currentUser.name = res.user.name;
            $scope.isEditingName = false;
            $rootScope.showToast('Name updated successfully throughout the application!', 'success');
          } else {
            $rootScope.showToast(res.message || 'Failed to update name.', 'danger');
          }
        })
        .catch(function (err) {
          $scope.isSavingName = false;
          var msg = (err.data && err.data.message) ? err.data.message : 'Error updating name.';
          $rootScope.showToast(msg, 'danger');
        });
    };

    // ==========================================
    // 2. PROFILE PICTURE MANAGEMENT
    // ==========================================
    $scope.triggerFileInput = function () {
      var fileInput = document.getElementById('profilePicInput');
      if (fileInput) fileInput.click();
    };

    $scope.onAvatarSelected = function (element) {
      if (element.files && element.files[0]) {
        var file = element.files[0];
        if (!file.type.match('image.*')) {
          $rootScope.showToast('Please select a valid image file (JPG, PNG, GIF, WEBP).', 'warning');
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          $rootScope.showToast('Image file size must be under 5MB.', 'warning');
          return;
        }

        $scope.avatarFile = file;
        var reader = new FileReader();
        reader.onload = function (e) {
          $scope.$apply(function () {
            $scope.avatarPreview = e.target.result;
          });
        };
        reader.readAsDataURL(file);
      }
    };

    $scope.cancelAvatarPreview = function () {
      $scope.avatarFile = null;
      $scope.avatarPreview = null;
      var fileInput = document.getElementById('profilePicInput');
      if (fileInput) fileInput.value = '';
    };

    $scope.saveAvatar = function () {
      if (!$scope.avatarFile) return;

      $scope.isUploadingAvatar = true;
      var formData = new FormData();
      formData.append('avatar', $scope.avatarFile);

      AuthService.updateDetails(formData)
        .then(function (res) {
          $scope.isUploadingAvatar = false;
          if (res.success) {
            $scope.user.avatar = res.user.avatar;
            $rootScope.currentUser.avatar = res.user.avatar;
            $scope.cancelAvatarPreview();
            $rootScope.showToast('Profile picture updated successfully!', 'success');
          } else {
            $rootScope.showToast(res.message || 'Failed to upload picture.', 'danger');
          }
        })
        .catch(function (err) {
          $scope.isUploadingAvatar = false;
          var msg = (err.data && err.data.message) ? err.data.message : 'Error uploading profile picture.';
          $rootScope.showToast(msg, 'danger');
        });
    };

    // Remove Profile Picture with Confirmation
    $scope.promptRemoveAvatar = function () {
      if ($scope.isDefaultAvatar()) {
        $rootScope.showToast('You are already using the default avatar.', 'info');
        return;
      }
      $scope.showRemoveConfirm = true;
    };

    $scope.cancelRemoveAvatar = function () {
      $scope.showRemoveConfirm = false;
    };

    $scope.executeRemoveAvatar = function () {
      $scope.isRemovingAvatar = true;
      AuthService.removeProfilePicture()
        .then(function (res) {
          $scope.isRemovingAvatar = false;
          $scope.showRemoveConfirm = false;
          if (res.success) {
            $scope.user.avatar = res.user.avatar;
            $rootScope.currentUser.avatar = res.user.avatar;
            $rootScope.showToast('Profile picture removed. Default avatar restored.', 'success');
          } else {
            $rootScope.showToast(res.message || 'Failed to remove picture.', 'danger');
          }
        })
        .catch(function (err) {
          $scope.isRemovingAvatar = false;
          $scope.showRemoveConfirm = false;
          var msg = (err.data && err.data.message) ? err.data.message : 'Error removing picture.';
          $rootScope.showToast(msg, 'danger');
        });
    };

    // ==========================================
    // 3. ADDITIONAL SETTINGS: ACCOUNT INFORMATION
    // ==========================================
    $scope.saveAccountDetails = function () {
      if (!$scope.accountForm.email) {
        $rootScope.showToast('Email address is required.', 'warning');
        return;
      }

      var emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test($scope.accountForm.email)) {
        $rootScope.showToast('Please enter a valid email address (e.g., user@example.com).', 'warning');
        return;
      }

      $scope.isSavingAccount = true;
      var payload = {
        email: $scope.accountForm.email,
        phone: $scope.accountForm.phone,
        location: $scope.accountForm.location,
        companyName: $scope.accountForm.companyName,
        website: $scope.accountForm.website,
        title: $scope.accountForm.title,
        bio: $scope.accountForm.bio,
        hourlyRate: $scope.accountForm.hourlyRate
      };

      AuthService.updateDetails(payload)
        .then(function (res) {
          $scope.isSavingAccount = false;
          if (res.success) {
            $scope.user.email = res.user.email;
            $scope.user.phone = res.user.phone;
            $scope.user.location = res.user.location;
            $rootScope.currentUser.email = res.user.email;
            $rootScope.showToast('Account information saved successfully!', 'success');
          } else {
            $rootScope.showToast(res.message || 'Failed to save account details.', 'danger');
          }
        })
        .catch(function (err) {
          $scope.isSavingAccount = false;
          var msg = (err.data && err.data.message) ? err.data.message : 'Error saving account settings.';
          $rootScope.showToast(msg, 'danger');
        });
    };

    // ==========================================
    // 4. CHANGE PASSWORD
    // ==========================================
    $scope.togglePasswordVisibility = function (field) {
      $scope.showPasswords[field] = !$scope.showPasswords[field];
    };

    $scope.changePassword = function () {
      if (!$scope.passwordForm.currentPassword) {
        $rootScope.showToast('Please enter your current password.', 'warning');
        return;
      }

      if (!$scope.passwordForm.newPassword || $scope.passwordForm.newPassword.length < 6) {
        $rootScope.showToast('New password must be at least 6 characters.', 'warning');
        return;
      }

      if ($scope.passwordForm.newPassword !== $scope.passwordForm.confirmPassword) {
        $rootScope.showToast('New password and confirm password do not match.', 'warning');
        return;
      }

      $scope.isChangingPassword = true;
      AuthService.updatePassword(
        $scope.passwordForm.currentPassword,
        $scope.passwordForm.newPassword
      )
        .then(function (res) {
          $scope.isChangingPassword = false;
          if (res.success) {
            $scope.passwordForm.currentPassword = '';
            $scope.passwordForm.newPassword = '';
            $scope.passwordForm.confirmPassword = '';
            $rootScope.showToast('Password changed successfully!', 'success');
          } else {
            $rootScope.showToast(res.message || 'Failed to update password.', 'danger');
          }
        })
        .catch(function (err) {
          $scope.isChangingPassword = false;
          var msg = (err.data && err.data.message) ? err.data.message : 'Incorrect current password or error updating.';
          $rootScope.showToast(msg, 'danger');
        });
    };
  }
]);
