angular.module('freelanceHubApp')
.controller('BudgetEstimatorController', ['$scope', '$location', 'DataService', function ($scope, $location, DataService) {
  $scope.estimator = {
    category: 'Web Development',
    complexity: 'medium',
    durationDays: 7,
    experienceRequired: 'intermediate'
  };

  $scope.estimateResult = null;
  $scope.matchedFreelancers = [];
  $scope.isCalculating = false;

  $scope.calculateEstimate = function () {
    $scope.isCalculating = true;
    DataService.estimateBudget($scope.estimator).then(function (res) {
      if (res.success) {
        $scope.estimateResult = res.data;
        // Also fetch matched freelancers
        $scope.findMatchedTalent();
      }
      $scope.isCalculating = false;
    });
  };

  $scope.findMatchedTalent = function () {
    DataService.smartMatch({
      category: $scope.estimator.category,
      maxBudget: $scope.estimateResult.estimatedHourlyRate,
      experienceLevel: $scope.estimator.experienceRequired
    }).then(function (res) {
      if (res.success) {
        $scope.matchedFreelancers = res.data;
      }
    });
  };

  $scope.postProjectWithEstimate = function () {
    $location.path('/post-project').search({
      category: $scope.estimator.category,
      budget: $scope.estimateResult ? $scope.estimateResult.estimatedTotal : 5000
    });
  };

  $scope.calculateEstimate();
}]);
