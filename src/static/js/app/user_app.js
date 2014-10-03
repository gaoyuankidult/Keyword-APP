var UserApp = angular.module('UserApp', []);

UserApp.controller('PaperController', ['$scope', '$http', function($scope, $http){
	$http({
		method: 'GET',
		url: '/user_papers'
	}).success(function(papers){
		$scope.papers = papers.files;
	});
}]);