function Keyword(id, text, exploitation, exploration){
	this.id = id;
	this.text = text;
	this.exploitation = exploitation;
	this.exploration = exploration;
	this.weight = Math.round(( this.exploitation / ( this.exploitation + this.exploration ) * 100 ));
	this.selected = false;
}

function Person(id, name, keywords){
	this.id = id;
	this.name = name;
	this.keywords = keywords || [];
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
	$scope.keyword_suggestions_count = 100;

	$scope.current_keywords = [];

	$scope.current_persons = [];
	$scope.selected_person = null;

	$scope.highlight_persons_keywords = function(person){
		person.keywords.forEach(function(keyword){
			$(".keyword-box[data-keywordId='" + keyword + "']").addClass("keyword-box-active");
		});

		_views.keywords_view_layer.hide();
		_views.keywords_view_layer.stop().fadeIn(500);
	}

	$scope.un_highlight_persons_keywords = function(){
		$(".keyword-box").removeClass("keyword-box-active");

		_views.keywords_view_layer.show();
		_views.keywords_view_layer.stop().fadeOut(500);
	};

	$scope.toggle_keyword_suggestions = function(){
		$scope.show_keyword_suggestions = !$scope.show_keyword_suggestions;
	}

	$scope.load_more_keyword_suggestions = function(){
		$scope.keyword_suggestions_count += 100;
	}

	$scope.toggle_keyword_suggestion_selection = function(keyword){
		keyword.selected = !keyword.selected;
	}

	$scope.show_person = function(person){
		/*_views.keywords_view_layer.fadeOut(500);
		_views.person_view.fadeOut(500);
		_views.keywords_view.fadeOut(500, function(){

			if($scope.selected_person){
				$scope.selected_person.selected = false;
			}

			person.selected = true;
			$scope.selected_person = person;
			$scope.$apply();

			_views.person_view.fadeIn(500);
		});*/
	}

	$scope.hide_person = function(){
		_views.person_view.fadeOut(500, function(){

			$scope.selected_person.selected = false;
			$scope.selected_person = null;

			$scope.$apply();

			_views.keywords_view.fadeIn(500);
		});
	}

	$scope.next = function(){
		_views.keywords_view.fadeOut(500);
		_views.people_view.animate({
			width: "0%"
		}, 500, function(){
			$.post("/next", _get_keyword_feedback()).done(function(data){
				_initialize_keywords(data.keywords);
				_initialize_persons(data.persons);

				$scope.$apply();

				$(".remove-keyword").tooltip();
				$(".keyword-knob").knob();

				_views.keywords_view.fadeIn(500);
				_views.people_view.animate({
					width: "30%"
				});
			}).fail(function(){
				alert("Something went wrong!")
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

			_get_keyword_suggestions(function(){
				_views.search_view.slideDown(500);
				$("#search-field").focus();
			});
		});
	}

	$scope.search = function(){
		_views.search_view.slideUp("slow", function(){
			_views.keyword_suggestions_view.hide();

			var post_params = { search_word: $scope.search_word || "", keywords: _get_selected_keyword_suggestions() };

			$.post("/search", JSON.stringify(post_params)).done(function(data){
				console.log(data);
				_initialize_keywords(data.keywords);
				_initialize_persons(data.persons);

				$(".remove-keyword").tooltip();
				$(".keyword-knob").knob();
				
				_views.people_view.animate({
					width: "30%"
				}, 500);
				
				_views.keywords_view.fadeIn(500);
			}).fail(function(){
				alert("Something went wrong!")
			});
		});
	}

	$scope.remove_keyword = function(keyword){
		var index = 0;
		$scope.current_keywords.forEach(function(k){
			if(k.id == keyword.id){
				$scope.current_keywords.splice(index, 1);
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
		keyword_suggestions_view: $(".keyword-suggestions-list"),
		keywords_view_layer: $("#keywords-display-layer")
	}

	var _reset_variables = function(){
		$scope.search_word = "";
		$scope.current_keywords = [];
		$scope.keyword_suggestions = [];
		$scope.show_keyword_suggestions = false;
		$scope.keyword_suggestions_count = 150;
		$scope.persons = [];
		$scope.current_person = null;
		$scope.$apply();
	}

	var _get_keyword_suggestions = function(callback){

		$scope.keyword_suggestions = [];
		
		callback();

		$.get("/search", function(data){
			data.keywords.forEach(function(keyword){
				var k = new Keyword();
				k.text = keyword;
				$scope.keyword_suggestions.push(k);
			});

			$scope.$apply();

			callback();
		});
	}

	var _initialize_keywords = function(data){
		$scope.current_keywords = [];

		var id = 0;
		data.forEach(function(keyword){
			$scope.current_keywords.push(new Keyword(id++, keyword.text, keyword.exploitation, keyword.exploration));
		});

		$scope.$apply();
	}

	var _initialize_persons = function(data){
		$scope.current_persons = [];

		var id=0;
		data.forEach(function(person){
			$scope.current_persons.push(new Person(id++, person.name, person.keywords));
		});

		$scope.$apply();
	}

	var _get_keyword_feedback = function(){
		var feedback = {};
		feedback.keywords = [];
		$scope.current_keywords.forEach(function(keyword){
			feedback.keywords.push({
				text: keyword.text,
				weight: keyword.weight / 100
			});
		});

		return JSON.stringify(feedback);
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

	_get_keyword_suggestions(function(){ _views.search_view.slideDown(500); $("#search-field").focus() });

}]);

$(document).ready(function(){
	$("#next-iteration").tooltip();
	$("#end-search").tooltip();
	$("#suggest-keywords-trigger").bind("click", function(){
		$(".keyword-suggestions-list").slideToggle();
	});
});
