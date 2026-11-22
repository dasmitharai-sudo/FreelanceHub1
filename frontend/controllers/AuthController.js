angular.module('freelanceHubApp')
.controller('AuthController', ['$scope', '$location', '$routeParams', 'AuthService', '$rootScope', function ($scope, $location, $routeParams, AuthService, $rootScope) {
  $scope.activeTab = 'client'; // 'client' | 'freelancer' for registration
  $scope.loginData = { email: '', password: '' };
  $scope.forgotData = { email: '' };
  $scope.resetData = { password: '', confirmPassword: '' };
  $scope.resetToken = $routeParams.token || '';
  $scope.isSubmitting = false;
  $scope.errorMessage = '';
  $scope.successMessage = '';

  // Registration model
  $scope.registerData = {
    name: '',
    email: '',
    password: '',
    phone: '',
    location: 'India',
    role: 'client',
    // Freelancer fields
    title: '',
    categories: [],
    skills: '',
    hourlyRate: 500,
    experience: 2,
    // Client fields
    companyName: ''
  };

  // Toggle category for freelancer multi-category selection
  $scope.toggleCategory = function (catName) {
    var idx = $scope.registerData.categories.indexOf(catName);
    if (idx > -1) {
      $scope.registerData.categories.splice(idx, 1);
    } else {
      $scope.registerData.categories.push(catName);
    }
  };

  $scope.isCategorySelected = function (catName) {
    return $scope.registerData.categories.indexOf(catName) > -1;
  };

  // Demo Login Quick-Fill Helper for academic evaluation
  $scope.fillDemoCredentials = function (role) {
    if (role === 'admin') {
      $scope.loginData.email = 'admin@freelancehub.com';
      $scope.loginData.password = 'admin123';
    } else if (role === 'client') {
      $scope.loginData.email = 'client@freelancehub.com';
      $scope.loginData.password = 'client123';
    } else if (role === 'freelancer') {
      $scope.loginData.email = 'freelancer@freelancehub.com';
      $scope.loginData.password = 'freelancer123';
    }
  };

  // Perform Login
  $scope.doLogin = function () {
    $scope.isSubmitting = true;
    $scope.errorMessage = '';

    AuthService.login($scope.loginData)
      .then(function (res) {
        $scope.isSubmitting = false;
        $rootScope.showToast('Welcome back, ' + res.user.name + '!', 'success');
        
        // Redirect to appropriate dashboard based on user role
        if (res.user.role === 'admin') {
          $location.path('/admin-dashboard');
        } else if (res.user.role === 'freelancer') {
          $location.path('/freelancer-dashboard');
        } else {
          $location.path('/client-dashboard');
        }
      })
      .catch(function (err) {
        $scope.isSubmitting = false;
        $scope.errorMessage = err.data && err.data.message ? err.data.message : 'Login failed. Please verify your credentials.';
      });
  };

  // Perform Registration
  $scope.doRegister = function () {
    $scope.isSubmitting = true;
    $scope.errorMessage = '';

    $scope.registerData.role = $scope.activeTab;

    if ($scope.activeTab === 'freelancer' && $scope.registerData.categories.length === 0) {
      $scope.errorMessage = 'Please select at least one professional category.';
      $scope.isSubmitting = false;
      return;
    }

    var formData = new FormData();
    formData.append('name', $scope.registerData.name);
    formData.append('email', $scope.registerData.email);
    formData.append('password', $scope.registerData.password);
    formData.append('phone', $scope.registerData.phone);
    formData.append('location', $scope.registerData.location);
    formData.append('role', $scope.registerData.role);

    if ($scope.activeTab === 'freelancer') {
      formData.append('title', $scope.registerData.title);
      formData.append('categories', $scope.registerData.categories.join(','));
      formData.append('skills', $scope.registerData.skills);
      formData.append('hourlyRate', $scope.registerData.hourlyRate);
      formData.append('experience', $scope.registerData.experience);
    } else {
      formData.append('companyName', $scope.registerData.companyName);
    }

    // Avatar file if chosen
    var avatarInput = document.getElementById('registerAvatar');
    if (avatarInput && avatarInput.files && avatarInput.files[0]) {
      formData.append('avatar', avatarInput.files[0]);
    }

    AuthService.register(formData)
      .then(function (res) {
        $scope.isSubmitting = false;
        $rootScope.showToast('Account created successfully! Welcome to FreelanceHub.', 'success');
        
        if (res.user.role === 'freelancer') {
          $location.path('/freelancer-dashboard');
        } else {
          $location.path('/client-dashboard');
        }
      })
      .catch(function (err) {
        $scope.isSubmitting = false;
        $scope.errorMessage = err.data && err.data.message ? err.data.message : 'Registration failed. Please check inputs.';
      });
  };

  // Forgot Password
  $scope.doForgotPassword = function () {
    $scope.isSubmitting = true;
    $scope.errorMessage = '';
    $scope.successMessage = '';

    AuthService.forgotPassword($scope.forgotData.email)
      .then(function (res) {
        $scope.isSubmitting = false;
        $scope.successMessage = 'Reset token generated! For demo purposes, you can directly reset with token: ' + res.resetToken;
        $scope.demoResetToken = res.resetToken;
      })
      .catch(function (err) {
        $scope.isSubmitting = false;
        $scope.errorMessage = err.data && err.data.message ? err.data.message : 'Error generating reset token.';
      });
  };

  // Reset Password
  $scope.doResetPassword = function () {
    if ($scope.resetData.password !== $scope.resetData.confirmPassword) {
      $scope.errorMessage = 'Passwords do not match.';
      return;
    }

    $scope.isSubmitting = true;
    AuthService.resetPassword($scope.resetToken, $scope.resetData.password)
      .then(function (res) {
        $scope.isSubmitting = false;
        $rootScope.showToast('Password reset successfully. You are now logged in.', 'success');
        $location.path('/');
      })
      .catch(function (err) {
        $scope.isSubmitting = false;
        $scope.errorMessage = err.data && err.data.message ? err.data.message : 'Invalid or expired token.';
      });
  };
}]);
