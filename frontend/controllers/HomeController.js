angular.module('freelanceHubApp')
.controller('HomeController', ['$scope', '$location', 'DataService', function ($scope, $location, DataService) {
  $scope.searchQuery = '';
  $scope.searchCategory = '';
  $scope.searchType = 'services'; // 'services' | 'freelancers'

  // Curated categories as requested for the hero section
  $scope.heroCategories = [
    'Graphic Designing',
    'Photography',
    'Content Writing',
    'Video Editing',
    'Web Development',
    'Education and Tutoring',
    'Digital Marketing',
    'Beauty and Fashion',
    'Music and Entertainment',
    'Architecture and Interior Design',
    'Translation',
    'Data Entry',
    'Event Management',
    'Other Services'
  ];

  // Execute Hero Search
  $scope.doSearch = function () {
    var target = $scope.searchType === 'freelancers' ? '/freelancers' : '/services';
    var params = {};
    if ($scope.searchQuery && $scope.searchQuery.trim()) {
      params.search = $scope.searchQuery.trim();
    }
    if ($scope.searchCategory && $scope.searchCategory.trim()) {
      params.category = $scope.searchCategory.trim();
    }

    $location.path(target).search(params);
  };
}]);
