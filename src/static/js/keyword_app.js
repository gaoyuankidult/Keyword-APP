function Keyword(id, text, exploitation, exploration){
	this.id = id;
	this.text = text;
	this.exploitation = exploitation;
	this.exploration = exploration;
	this.weight = Math.round(( this.exploitation / ( this.exploitation + this.exploration ) * 100 ));
	this.selected = false;
}

function Person(name){
	this.name = name;
	this.selected = false;
}

var KeywordApp = angular.module("KeywordApp", []);

KeywordApp.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

KeywordApp.controller("KeywordController", ["$scope", function($scope){

	$scope.keyword_suggestions = [];
	$scope.show_keyword_suggestions = false;
	$scope.keyword_suggestions_count = 150;

	$scope.current_keywords = [];

	$scope.persons = [];
	$scope.current_person = null;

	$scope.toggle_keyword_suggestions = function(){
		$scope.show_keyword_suggestions = !$scope.show_keyword_suggestions;
	}

	$scope.load_more_keyword_suggestions = function(){
		$scope.keyword_suggestions_count += 150;
	}

	$scope.toggle_keyword_suggestion_selection = function(keyword){
		if(!keyword.selected){
			keyword.selected = true;
		}else{
			keyword.selected = !keyword.selected;
		}
	}

	$scope.show_person = function(person){
		_views.person_view.fadeOut(500);
		_views.keywords_view.fadeOut(500, function(){

			if($scope.current_person){
				$scope.current_person.selected = false;
			}

			person.selected = true;
			$scope.current_person = person;
			$scope.$apply();

			_views.person_view.fadeIn(500);
		});
	}

	$scope.hide_person = function(){
		_views.person_view.fadeOut(500, function(){

			$scope.current_person.selected = false;
			$scope.current_person = null;

			$scope.$apply();

			_views.keywords_view.fadeIn(500);
		});
	}

	$scope.next = function(){
		_views.keywords_view.fadeOut(500);
		_views.people_view.animate({
			width: "0%"
		}, 500, function(){
			/*
				$.post("/", {}).done(function(data){
					_initialize_keywords(data.keywords);
				});
			*/
			_views.keywords_view.fadeIn(500);
			_views.people_view.animate({
				width: "30%"
			});
		});
	}

	$scope.end = function(){
		_views.keywords_view.fadeOut(500);
		_views.person_view.fadeOut(500);
		_views.people_view.animate({
			width: "0%"
		}, 600, function(){
			_reset_variables();
			_views.search_view.slideDown(500);
		});
	}

	$scope.search = function(){
		//$scope.current_keywords = [];
		_views.search_view.slideUp("slow", function(){
			_views.keyword_suggestions_view.hide();

			var post_params = { search_word: $scope.search_word, keywords: _get_selected_keyword_suggestions() };
			$.post("/search", post_params).done(function(data){
				console.log(data);
				//_initialize_keywords(data.keywords);
			});
			
			$(".remove-keyword").tooltip();
			$(".keyword-knob").knob();
			_views.people_view.animate({
				width: "30%"
			}, 500);
			
			_views.keywords_view.fadeIn(500);
		});
	}

	$scope.remove_keyword = function(keyword){
		var index = 0;
		$scope.current_keywords.forEach(function(k){
			if(k.id == keyword.id){
				$(".keyword-box[data-keywordId='" + k.id + "']").fadeOut(300, function(){
					$scope.current_keywords.splice(index, 1);
				});

				return;
			}
			index++;
		});
	}

	var _views = {
		keywords_view: $("#keywords-container"),
		person_view: $("#person-container"),
		people_view: $("#people-container"),
		search_view: $("#search-container"),
		keyword_suggestions_view: $(".keyword-suggestions-list")
	}

	var _initialize_keywords = function(keywords){
		$scope.current_keywords = [];

		keywords.keywords.forEach(function(keyword){
			$scope.current_keywords.push(new Keyword(keyword.text, keyword.exploitation, keyword.exploration));
		});
	}

	var _reset_variables = function(){
		$scope.current_keywords = [];
		$scope.keyword_suggestions = [];
		$scope.show_keyword_suggestions = false;
		$scope.keyword_suggestions_count = 150;
		$scope.persons = [];
		$scope.current_person = null;
		$scope.$apply();
	}

	var _get_selected_keyword_suggestions = function(){
		var selected = [];

		$scope.keyword_suggestions.forEach(function(keyword){
			if(keyword.selected){
				selected.push(keyword.text);
			}
		});
		return selected;
	}

	var _get_keyword_suggestions = function(){
		console.log("Getting keyword suggestions");
		
		$scope.keyword_suggestions = [];

		$.get("/search", function(data){
			data.keywords.forEach(function(keyword){
				$scope.keyword_suggestions.push(new Keyword(keyword));
			});
			$scope.$apply();
		});
	}

	for(var i=0; i<200; i++){
		if(i < 20){
			$scope.current_keywords.push(new Keyword(i, "keyword", Math.random(), Math.random()));
		}
		if(i < 20){
			person = new Person("Kalle Ilves");
			$scope.persons.push(person);
		}
		keyword = new Keyword(i, "keyword", Math.random(), Math.random());
		keyword.selected = false;
		$scope.keyword_suggestions.push(keyword);
	}
	
	_get_keyword_suggestions();
	

}]);

$(document).ready(function(){
	$("#next-iteration").tooltip();
	$("#end-search").tooltip();
	$("#suggest-keywords-trigger").bind("click", function(){
		$(".keyword-suggestions-list").slideToggle();
	});
});
