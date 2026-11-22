angular.module('freelanceHubApp')
.factory('AuthService', ['$http', '$q', '$window', '$rootScope', function ($http, $q, $window, $rootScope) {
  var TOKEN_KEY = 'fh_auth_token';
  var USER_KEY = 'fh_user_data';

  var auth = {
    token: $window.localStorage.getItem(TOKEN_KEY),
    currentUser: null
  };

  try {
    var storedUser = $window.localStorage.getItem(USER_KEY);
    if (storedUser) {
      auth.currentUser = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error('Error parsing stored user data', e);
  }

  return {
    getToken: function () {
      return auth.token || $window.localStorage.getItem(TOKEN_KEY);
    },

    setToken: function (token) {
      auth.token = token;
      if (token) {
        $window.localStorage.setItem(TOKEN_KEY, token);
      } else {
        $window.localStorage.removeItem(TOKEN_KEY);
      }
    },

    getUser: function () {
      return auth.currentUser;
    },

    setUser: function (user) {
      auth.currentUser = user;
      if (user) {
        $window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        $window.localStorage.removeItem(USER_KEY);
      }
      $rootScope.currentUser = user;
      $rootScope.isLoggedIn = !!user;
    },

    isAuthenticated: function () {
      return !!this.getToken() && !!this.getUser();
    },

    hasRole: function (role) {
      var user = this.getUser();
      return user && user.role === role;
    },

    login: function (credentials) {
      var self = this;
      return $http.post('/api/auth/login', credentials).then(function (res) {
        if (res.data.success && res.data.token) {
          self.setToken(res.data.token);
          self.setUser(res.data.user);
          $rootScope.$broadcast('auth:login-success', res.data);
        }
        return res.data;
      });
    },

    register: function (formData) {
      var self = this;
      // Use multipart headers if formData is FormData
      var isFormData = formData instanceof FormData;
      return $http.post('/api/auth/register', formData, {
        transformRequest: angular.identity,
        headers: isFormData ? { 'Content-Type': undefined } : {}
      }).then(function (res) {
        if (res.data.success && res.data.token) {
          self.setToken(res.data.token);
          self.setUser(res.data.user);
          $rootScope.$broadcast('auth:login-success', res.data);
        }
        return res.data;
      });
    },

    getMe: function () {
      var self = this;
      return $http.get('/api/auth/me').then(function (res) {
        if (res.data.success) {
          self.setUser(res.data.user);
        }
        return res.data;
      });
    },

    updateDetails: function (formData) {
      var self = this;
      var isFormData = formData instanceof FormData;
      return $http.put('/api/auth/updatedetails', formData, {
        transformRequest: isFormData ? angular.identity : function (data) {
          return JSON.stringify(data);
        },
        headers: isFormData ? { 'Content-Type': undefined } : { 'Content-Type': 'application/json' }
      }).then(function (res) {
        if (res.data && res.data.success && res.data.user) {
          self.setUser(res.data.user);
          $rootScope.$broadcast('auth:user-updated', res.data.user);
        }
        return res.data;
      });
    },

    updatePassword: function (currentPassword, newPassword) {
      var self = this;
      return $http.put('/api/auth/updatepassword', {
        currentPassword: currentPassword,
        newPassword: newPassword
      }).then(function (res) {
        if (res.data && res.data.token && res.data.user) {
          self.setToken(res.data.token);
          self.setUser(res.data.user);
        }
        return res.data;
      });
    },

    removeProfilePicture: function () {
      return this.updateDetails({ removeAvatar: true });
    },

    updateFreelancerProfile: function (profileData) {
      return $http.put('/api/auth/freelancer-profile', profileData);
    },

    addPortfolioItem: function (formData) {
      return $http.post('/api/auth/portfolio', formData, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
      });
    },

    toggleSaveFreelancer: function (freelancerId) {
      return $http.post('/api/auth/save-freelancer/' + freelancerId);
    },

    forgotPassword: function (email) {
      return $http.post('/api/auth/forgotpassword', { email: email });
    },

    resetPassword: function (token, password) {
      var self = this;
      return $http.put('/api/auth/resetpassword/' + token, { password: password }).then(function (res) {
        if (res.data.success && res.data.token) {
          self.setToken(res.data.token);
          self.setUser(res.data.user);
        }
        return res.data;
      });
    },

    logout: function () {
      this.setToken(null);
      this.setUser(null);
      $rootScope.$broadcast('auth:logout');
    }
  };
}]);
