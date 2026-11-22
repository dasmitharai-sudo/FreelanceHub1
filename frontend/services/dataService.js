angular.module('freelanceHubApp')
.factory('DataService', ['$http', function ($http) {
  return {
    // Categories
    getCategories: function () {
      return $http.get('/api/categories').then(function (res) { return res.data; });
    },
    getCategoryBySlug: function (slug) {
      return $http.get('/api/categories/' + slug).then(function (res) { return res.data; });
    },

    // Services (Fiverr-style)
    getServices: function (params) {
      return $http.get('/api/services', { params: params }).then(function (res) { return res.data; });
    },
    getService: function (id) {
      return $http.get('/api/services/' + id).then(function (res) { return res.data; });
    },
    createService: function (formData) {
      var isFormData = formData instanceof FormData;
      return $http.post('/api/services', formData, {
        transformRequest: angular.identity,
        headers: isFormData ? { 'Content-Type': undefined } : {}
      }).then(function (res) { return res.data; });
    },
    updateService: function (id, formData) {
      var isFormData = formData instanceof FormData;
      return $http.put('/api/services/' + id, formData, {
        transformRequest: angular.identity,
        headers: isFormData ? { 'Content-Type': undefined } : {}
      }).then(function (res) { return res.data; });
    },
    deleteService: function (id) {
      return $http.delete('/api/services/' + id).then(function (res) { return res.data; });
    },
    compareServices: function (ids) {
      return $http.get('/api/services/compare?ids=' + ids).then(function (res) { return res.data; });
    },
    getFreelancerServices: function (userId) {
      return $http.get('/api/services/freelancer/' + userId).then(function (res) { return res.data; });
    },

    // Freelancers
    getFreelancers: function (params) {
      return $http.get('/api/freelancers', { params: params }).then(function (res) { return res.data; });
    },
    getFreelancer: function (id) {
      return $http.get('/api/freelancers/' + id).then(function (res) { return res.data; });
    },

    // Projects (Upwork-style)
    getProjects: function (params) {
      return $http.get('/api/projects', { params: params }).then(function (res) { return res.data; });
    },
    getProject: function (id) {
      return $http.get('/api/projects/' + id).then(function (res) { return res.data; });
    },
    createProject: function (formData) {
      var isFormData = formData instanceof FormData;
      return $http.post('/api/projects', formData, {
        transformRequest: angular.identity,
        headers: isFormData ? { 'Content-Type': undefined } : {}
      }).then(function (res) { return res.data; });
    },
    updateProject: function (id, data) {
      return $http.put('/api/projects/' + id, data).then(function (res) { return res.data; });
    },
    submitProjectWork: function (id, formData) {
      return $http.post('/api/projects/' + id + '/submit-work', formData, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
      }).then(function (res) { return res.data; });
    },
    reviewProjectSubmission: function (id, action, revisionNotes) {
      return $http.post('/api/projects/' + id + '/review-submission', {
        action: action,
        revisionNotes: revisionNotes
      }).then(function (res) { return res.data; });
    },
    addMilestone: function (id, milestone) {
      return $http.post('/api/projects/' + id + '/milestones', milestone).then(function (res) { return res.data; });
    },
    releaseMilestone: function (id, milestoneId) {
      return $http.put('/api/projects/' + id + '/milestones/' + milestoneId + '/release').then(function (res) { return res.data; });
    },

    // Proposals
    applyForProject: function (data) {
      return $http.post('/api/proposals', data).then(function (res) { return res.data; });
    },
    getMyProposals: function () {
      return $http.get('/api/proposals/my-proposals').then(function (res) { return res.data; });
    },
    getProjectProposals: function (projectId) {
      return $http.get('/api/proposals/project/' + projectId).then(function (res) { return res.data; });
    },
    acceptProposal: function (id) {
      return $http.post('/api/proposals/' + id + '/accept').then(function (res) { return res.data; });
    },
    rejectProposal: function (id) {
      return $http.post('/api/proposals/' + id + '/reject').then(function (res) { return res.data; });
    },
    withdrawProposal: function (id) {
      return $http.delete('/api/proposals/' + id).then(function (res) { return res.data; });
    },

    // Orders (Fiverr-style direct purchases)
    createOrder: function (orderData) {
      return $http.post('/api/orders', orderData).then(function (res) { return res.data; });
    },
    getMyOrders: function (params) {
      return $http.get('/api/orders/my-orders', { params: params }).then(function (res) { return res.data; });
    },
    getOrder: function (id) {
      return $http.get('/api/orders/' + id).then(function (res) { return res.data; });
    },
    deliverOrder: function (id, formData) {
      return $http.post('/api/orders/' + id + '/deliver', formData, {
        transformRequest: angular.identity,
        headers: { 'Content-Type': undefined }
      }).then(function (res) { return res.data; });
    },
    requestOrderRevision: function (id, revisionNotes) {
      return $http.post('/api/orders/' + id + '/revision', { revisionNotes: revisionNotes }).then(function (res) { return res.data; });
    },
    approveOrder: function (id) {
      return $http.post('/api/orders/' + id + '/approve').then(function (res) { return res.data; });
    },

    // Reviews & Ratings
    createReview: function (data) {
      return $http.post('/api/reviews', data).then(function (res) { return res.data; });
    },
    getFreelancerReviews: function (id) {
      return $http.get('/api/reviews/freelancer/' + id).then(function (res) { return res.data; });
    },

    // Notifications
    getNotifications: function () {
      return $http.get('/api/notifications').then(function (res) { return res.data; });
    },
    markNotificationRead: function (id) {
      return $http.put('/api/notifications/' + id + '/read').then(function (res) { return res.data; });
    },

    // Chat
    getConversations: function () {
      return $http.get('/api/chat/conversations').then(function (res) { return res.data; });
    },
    getMessages: function (contactId, params) {
      return $http.get('/api/chat/messages/' + contactId, { params: params }).then(function (res) { return res.data; });
    },
    sendMessage: function (formData) {
      var isFormData = formData instanceof FormData;
      return $http.post('/api/chat/messages', formData, {
        transformRequest: angular.identity,
        headers: isFormData ? { 'Content-Type': undefined } : {}
      }).then(function (res) { return res.data; });
    },

    // Smart Match & Budget Estimator
    smartMatch: function (criteria) {
      return $http.post('/api/smart-match', criteria).then(function (res) { return res.data; });
    },
    estimateBudget: function (data) {
      return $http.post('/api/budget-estimator', data).then(function (res) { return res.data; });
    },

    // Disputes
    createDispute: function (data) {
      return $http.post('/api/disputes', data).then(function (res) { return res.data; });
    },

    // Admin APIs
    getAdminStats: function () {
      return $http.get('/api/admin/stats').then(function (res) { return res.data; });
    },
    getAdminUsers: function (params) {
      return $http.get('/api/admin/users', { params: params }).then(function (res) { return res.data; });
    },
    toggleUserStatus: function (id) {
      return $http.put('/api/admin/users/' + id + '/status').then(function (res) { return res.data; });
    },
    toggleVerifyFreelancer: function (id) {
      return $http.put('/api/admin/users/' + id + '/verify').then(function (res) { return res.data; });
    },
    getAllTransactions: function () {
      return $http.get('/api/admin/transactions').then(function (res) { return res.data; });
    },
    getWithdrawalRequests: function () {
      return $http.get('/api/admin/withdrawals').then(function (res) { return res.data; });
    },
    updateWithdrawalStatus: function (id, data) {
      return $http.put('/api/admin/withdrawals/' + id, data).then(function (res) { return res.data; });
    },
    updateCommission: function (percent) {
      return $http.put('/api/admin/commission', { percent: percent }).then(function (res) { return res.data; });
    },
    getDisputes: function () {
      return $http.get('/api/admin/disputes').then(function (res) { return res.data; });
    },
    resolveDispute: function (id, data) {
      return $http.put('/api/admin/disputes/' + id + '/resolve', data).then(function (res) { return res.data; });
    },
    createCategory: function (cat) {
      return $http.post('/api/categories', cat).then(function (res) { return res.data; });
    },
    updateCategory: function (id, cat) {
      return $http.put('/api/categories/' + id, cat).then(function (res) { return res.data; });
    },
    deleteCategory: function (id) {
      return $http.delete('/api/categories/' + id).then(function (res) { return res.data; });
    }
  };
}]);
