angular.module('freelanceHubApp')
.controller('MessagesController', ['$scope', '$routeParams', 'DataService', '$rootScope', function ($scope, $routeParams, DataService, $rootScope) {
  $scope.conversations = [];
  $scope.activeContact = null;
  $scope.messages = [];
  $scope.chatInput = '';
  $scope.isLoading = true;

  $scope.loadConversations = function () {
    $scope.isLoading = true;
    DataService.getConversations().then(function (res) {
      if (res.success) {
        $scope.conversations = res.data;
        if ($routeParams.contactId) {
          $scope.selectContactById($routeParams.contactId);
        } else if ($scope.conversations.length > 0) {
          $scope.selectContact($scope.conversations[0].contact);
        }
      }
      $scope.isLoading = false;
    }).catch(function () {
      $scope.isLoading = false;
    });
  };

  $scope.selectContactById = function (contactId) {
    // Check if in conversations list
    var found = $scope.conversations.find(function (c) {
      return c.contact._id === contactId;
    });

    if (found) {
      $scope.selectContact(found.contact);
    } else {
      // Direct message with new contact
      DataService.getFreelancers().then(function (fRes) {
        var userMatch = fRes.data.find(function (f) { return f.user._id === contactId; });
        if (userMatch) {
          $scope.activeContact = userMatch.user;
          $scope.loadMessages();
        }
      });
    }
  };

  $scope.selectContact = function (contact) {
    $scope.activeContact = contact;
    $scope.loadMessages();
  };

  $scope.loadMessages = function () {
    if (!$scope.activeContact) return;
    DataService.getMessages($scope.activeContact._id).then(function (res) {
      if (res.success) {
        $scope.messages = res.data;
      }
    });
  };

  $scope.sendMessage = function () {
    if (!$scope.chatInput.trim() || !$scope.activeContact) return;

    var formData = new FormData();
    formData.append('recipientId', $scope.activeContact._id);
    formData.append('text', $scope.chatInput);

    var fileInput = document.getElementById('msgAttachment');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append('attachment', fileInput.files[0]);
    }

    DataService.sendMessage(formData).then(function (res) {
      $scope.chatInput = '';
      if (fileInput) fileInput.value = '';
      $scope.messages.push(res.data);
    });
  };

  $scope.loadConversations();
}]);
