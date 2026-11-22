// FreelanceHub - Main AngularJS Application
var app = angular.module('freelanceHubApp', ['ngRoute', 'ngAnimate']);

// Setup HTTP Interceptor for JWT authentication
app.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push(['$q', '$window', '$location', '$rootScope', function ($q, $window, $location, $rootScope) {
    return {
      request: function (config) {
        var token = $window.localStorage.getItem('fh_auth_token');
        if (token && config.url.indexOf('/api/') === 0) {
          config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
      },
      responseError: function (rejection) {
        if (rejection.status === 401 && rejection.config.url.indexOf('/api/auth/login') === -1) {
          // Token expired or invalid
          $window.localStorage.removeItem('fh_auth_token');
          $window.localStorage.removeItem('fh_user_data');
          $rootScope.currentUser = null;
          $rootScope.isLoggedIn = false;
          if ($location.path().indexOf('/login') === -1 && $location.path() !== '/') {
            $location.path('/login');
          }
        }
        return $q.reject(rejection);
      }
    };
  }]);
}]);

// Routing Configuration
app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  $locationProvider.hashPrefix('!');

  $routeProvider
    .when('/', {
      templateUrl: 'views/home.html',
      controller: 'HomeController'
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'AuthController'
    })
    .when('/register', {
      templateUrl: 'views/register.html',
      controller: 'AuthController'
    })
    .when('/forgot-password', {
      templateUrl: 'views/forgot-password.html',
      controller: 'AuthController'
    })
    .when('/reset-password/:token', {
      templateUrl: 'views/reset-password.html',
      controller: 'AuthController'
    })
    .when('/services', {
      templateUrl: 'views/services.html',
      controller: 'ServicesController'
    })
    .when('/services/:id', {
      templateUrl: 'views/service-detail.html',
      controller: 'ServiceDetailController'
    })
    .when('/create-service', {
      templateUrl: 'views/create-service.html',
      controller: 'ServicesController',
      requireAuth: true,
      requiredRole: 'freelancer'
    })
    .when('/freelancers', {
      templateUrl: 'views/freelancers.html',
      controller: 'FreelancersController'
    })
    .when('/freelancers/:id', {
      templateUrl: 'views/freelancer-profile.html',
      controller: 'FreelancerDetailController'
    })
    .when('/projects', {
      templateUrl: 'views/projects.html',
      controller: 'ProjectController'
    })
    .when('/projects/:id', {
      templateUrl: 'views/project-detail.html',
      controller: 'ProjectController'
    })
    .when('/post-project', {
      templateUrl: 'views/post-project.html',
      controller: 'ProjectController',
      requireAuth: true,
      requiredRole: 'client'
    })
    .when('/client-dashboard', {
      templateUrl: 'views/client-dashboard.html',
      controller: 'ClientDashboardController',
      requireAuth: true,
      requiredRole: 'client'
    })
    .when('/freelancer-dashboard', {
      templateUrl: 'views/freelancer-dashboard.html',
      controller: 'FreelancerDashboardController',
      requireAuth: true,
      requiredRole: 'freelancer'
    })
    .when('/admin-dashboard', {
      templateUrl: 'views/admin-dashboard.html',
      controller: 'AdminDashboardController',
      requireAuth: true,
      requiredRole: 'admin'
    })
    .when('/workspace/:projectId', {
      templateUrl: 'views/workspace.html',
      controller: 'WorkspaceController',
      requireAuth: true
    })
    .when('/orders/:id', {
      templateUrl: 'views/order-detail.html',
      controller: 'OrderDetailController',
      requireAuth: true
    })
    .when('/messages', {
      templateUrl: 'views/messages.html',
      controller: 'MessagesController',
      requireAuth: true
    })
    .when('/budget-estimator', {
      templateUrl: 'views/budget-estimator.html',
      controller: 'BudgetEstimatorController'
    })
    .when('/compare-services', {
      templateUrl: 'views/compare-services.html',
      controller: 'ServiceCompareController'
    })
    .when('/how-it-works', {
      templateUrl: 'views/how-it-works.html',
      controller: 'HomeController'
    })
    .when('/profile-settings', {
      templateUrl: 'views/profile-settings.html',
      controller: 'ProfileSettingsController',
      requireAuth: true
    })
    .when('/about', {
      templateUrl: 'views/about.html',
      controller: 'HomeController'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);

// Application Run Block
app.run(['$rootScope', '$location', 'AuthService', 'DataService', function ($rootScope, $location, AuthService, DataService) {
  $rootScope.currentUser = AuthService.getUser();
  $rootScope.isLoggedIn = AuthService.isAuthenticated();
  $rootScope.toasts = [];
  $rootScope.categories = [];
  $rootScope.unreadNotificationsCount = 0;
  $rootScope.notificationsList = [];

  // Toast notification helper
  $rootScope.showToast = function (message, type) {
    var id = Date.now();
    $rootScope.toasts.push({
      id: id,
      message: message,
      type: type || 'info' // success, danger, warning, info
    });
    setTimeout(function () {
      $rootScope.$apply(function () {
        $rootScope.toasts = $rootScope.toasts.filter(function (t) { return t.id !== id; });
      });
    }, 4500);
  };

  // Logout helper
  $rootScope.logout = function () {
    AuthService.logout();
    $rootScope.showToast('You have been logged out successfully.', 'info');
    $location.path('/');
  };

  // Helper to format currency
  $rootScope.formatCurrency = function (val) {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  // Helper to fetch notifications
  $rootScope.loadNotifications = function () {
    if ($rootScope.isLoggedIn) {
      DataService.getNotifications().then(function (res) {
        if (res.success) {
          $rootScope.notificationsList = res.data;
          $rootScope.unreadNotificationsCount = res.unreadCount;
        }
      });
    }
  };

  $rootScope.markAllNotificationsRead = function () {
    DataService.markNotificationRead('all').then(function () {
      $rootScope.unreadNotificationsCount = 0;
      $rootScope.notificationsList.forEach(function (n) { n.isRead = true; });
    });
  };

  // Initial user validation & fetch
  if ($rootScope.isLoggedIn) {
    AuthService.getMe().catch(function () {
      AuthService.logout();
    });
    $rootScope.loadNotifications();
  }

  // Load global categories
  DataService.getCategories().then(function (res) {
    if (res.success) {
      $rootScope.categories = res.data;
    }
  });

  // Authentication & Role Route Guard
  $rootScope.$on('$routeChangeStart', function (event, next) {
    if (next && next.$$route) {
      if (next.$$route.requireAuth && !AuthService.isAuthenticated()) {
        event.preventDefault();
        $rootScope.showToast('Please login to access this page.', 'warning');
        $location.path('/login');
        return;
      }

      if (next.$$route.requiredRole) {
        var user = AuthService.getUser();
        if (!user || (user.role !== next.$$route.requiredRole && user.role !== 'admin')) {
          event.preventDefault();
          $rootScope.showToast('Access restricted: unauthorized role.', 'danger');
          $location.path('/');
          return;
        }
      }
    }
  });
}]);
