var KeywordApp = angular.module("KeywordApp", []);

KeywordApp.config(function($interpolateProvider) {
  	$interpolateProvider.startSymbol('{[{');
  	$interpolateProvider.endSymbol('}]}');
});

KeywordApp.service("Visualization", function(){
	var container_dimensions = {
		width: $("#article-relation-visualization").width(),
		height: $("#article-relation-visualization").height()
	}
	
	var base_size = 60;
	var base_distance = 200;
	
	var middle = {
		x: container_dimensions.width / 2,
		y: container_dimensions.height / 2 
	}

	var rotate_vector = function(vector, angle){
		return {
			x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
			y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle)
		}
	}

	var shuffle = function(o){
	    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	    return o;
	};

	var move_to_desired_location = function(selector){
		$(".popover").hide();

		$(selector).each(function(index){
			var _this = $(this);

			$(this).transit({
				top: _this.attr("data-desiredTop"),
				left: _this.attr("data-desiredLeft"),
				opacity: 1
			}, 1000);
		});
	}

	var change_the_middle = function(article, related, callback){
		$("#article-relation-visualization .article-ball-grey").transit({
			top: middle.y - base_size / 2,
			left: middle.x - base_size / 2,
			opacity: 0
		}, 1000);

		setTimeout(function(){
			callback(visualize_related_articles(article, related));
		}, 1000);
	}

	var visualize_related_articles = function(article, related){
		$("#article-relation-layer").fadeIn(500);

		var rotate_iterator = ( 2 * Math.PI ) / 10;

		var articles = {};
		articles.around = [];
		articles.middle = {
			title: article.title,
			abstract: article.abstract,
			author: article.author,
			id: article.id,
			x: middle.x - base_size / 2,
			y: middle.y - base_size / 2
		};

		var location_vector = {
			x: 1, 
			y: 1
		}
		
		related = shuffle(related);

		related.forEach(function(a){
			var distance = a.distance;
			
			articles.around.push({
				title: a.title,
				abstract: a.abstract,
				author: a.author,
				id: a.id,
				init_x: middle.x - base_size / 2,
				init_y: middle.y - base_size / 2,
				x: middle.x + location_vector.x * Math.max(base_size / 2, distance * base_distance) - base_size / 2,
				y: middle.y + location_vector.y * Math.max(base_size / 2, distance * base_distance) - base_size / 2
			});

			location_vector = rotate_vector(location_vector, rotate_iterator);
		});

		return articles;
	}

	return {
		visualize_related_articles: visualize_related_articles,
		move_to_desired_location: move_to_desired_location,
		change_the_middle: change_the_middle
	}
});

KeywordApp.controller("KeywordController", ["$scope", "$sce", "Visualization", function($scope, $sce, Visualization){

	$scope.keyword_suggestions = [];
	$scope.show_keyword_suggestions = false;
	$scope.keyword_suggestions_count = 100;

	$scope.current_keywords = [];

	$scope.current_persons = [];

	$scope.current_article = null;

	var _views = {
		keywords_view: $("#keywords-container"),
		person_view: $("#person-container"),
		people_view: $("#people-container"),
		search_view: $("#search-container"),
		keyword_suggestions_view: $(".keyword-suggestions-list"),
		keywords_view_layer: $("#keywords-display-layer"),
		article_highlight_view: $("#article-highlight-display"),
		article_relation_layer: $("#article-relation-layer"),
		current_related_article: $("#current-related-article")
	}
	
	
	$scope.bring_article_to_middle = function(article){
		$.post("/related_articles", JSON.stringify({ id: article.id })).done(function(data){
			Visualization.change_the_middle(article, data.related_articles, function(articles){
				$scope.related_articles = articles;
				$scope.$apply();
	
				Visualization.move_to_desired_location($("#article-relation-visualization .article-ball-grey"));
			});
		});
	}

	$scope.show_related_articles = function(article){
		console.log("ARTICLE ID: " + article.id);
		$scope.related_articles = [];
		$.post("/related_articles", JSON.stringify({ id: article.id })).done(function(data){
			console.log(JSON.stringify(data.related_articles));
			$scope.related_articles = Visualization.visualize_related_articles(article, data.related_articles);
			$scope.$apply();

			Visualization.move_to_desired_location($("#article-relation-visualization .article-ball-grey"));
		});
	}

	$scope.set_current_related_article = function(article){
		$scope.current_related_article = article;
		_views.current_related_article.addClass("bring-right");
	}

	$scope.un_set_current_related_article = function(){
		_views.current_related_article.removeClass("bring-right");
	}

	$scope.hide_related_articles = function(){
		_views.article_relation_layer.fadeOut(500);
	}

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
				$scope.current_persons = [];
				$scope.current_keywords = [];

				_initialize_keywords(data.keywords);
				_initialize_persons(data.persons);

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
	
	$scope.remove_person = function(person){
		$.post("/remove_person", JSON.stringify({ id: person.id })).done(function(data){
			$scope.current_persons = $.grep($scope.current_persons, function(p){ return p.id != person.id });
			$scope.$apply();
		});
	}

	$scope.filter_removed_keywords = function(keyword){
		return !keyword.removed;
	}

	$scope.toggle_person_selection = function(person){
		$scope.current_persons.forEach(function(p){
			if(p.id != person.id){
				p.selected = false;
			}
		});

		person.selected = !person.selected;
	}

	$scope.highlight_article = function(article, person){
		keywords = {};
		$scope.current_keywords.forEach(function(keyword){
			keywords[keyword.text] = keyword;
		});

		article.highlighted_abstract = $sce.trustAsHtml(_highlight_abstract_keywords(article.abstract, keywords));
		$scope.current_article = article;

		_views.article_highlight_view.show();
		_views.keywords_view_layer.hide();
		_views.keywords_view_layer.stop().fadeIn(500);
		_views.article_highlight_view.addClass("animated bounceInUp");
	}

	$scope.un_highlight_article = function(){
		$(".keyword-box").removeClass("keyword-box-active");

		_views.article_highlight_view.hide();
		_views.keywords_view_layer.show();
		_views.keywords_view_layer.stop().fadeOut(500);	
		_views.article_highlight_view.removeClass("animated bounceInUp");

		$scope.current_article.highlighted_abstract = $scope.current_article.abstract;
		$scope.current_article = null;

	}

	$scope.search = function(){
		_views.search_view.slideUp("slow", function(){
			_views.keyword_suggestions_view.hide();

			var post_params = { search_word: ( $scope.search_word || "" ), keywords: _get_selected_keyword_suggestions() };

			/*var keywords = _keyword_dummy_data();
			var persons = _person_dummy_data();

			_initialize_keywords(keywords);
			_initialize_persons(persons);
			
			_views.people_view.animate({
				width: "30%"
			}, 500);
			
			_views.keywords_view.fadeIn(500);*/

			$.post("/search", JSON.stringify(post_params)).done(function(data){
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
		keyword.removed = true;
		$scope.$apply();
	}

	$scope.highlight_keywords_persons = function(keyword){
		$(".vertical-nav > li > a").removeClass("selected-true");

		var persons = _get_persons_related_to_keyword(keyword.id);
		console.log("COUNT:" + persons.length)
		persons.forEach(function(person){
			$(".vertical-nav > li > a[data-personId='" + person.id + "']").addClass("selected-true");
		});
	}

	$scope.un_highlight_keywords_persons = function(){
		$(".vertical-nav > li > a").removeClass("selected-true");
		$(".vertical-nav > li").has("ul:visible").find("> a").addClass("selected-true");
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

/*		$scope.keyword_suggestions = _keyword_suggestion_dummy_data();

		$scope.$apply();
		callback();
*/

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

		data.forEach(function(keyword){
			$scope.current_keywords.push(new Keyword(keyword.id, keyword.text, keyword.exploitation, keyword.exploration));
		});

		$scope.$apply();

		$scope.current_keywords.forEach(function(keyword){
			$(".keyword-box[data-keywordId='" + keyword.id + "'] .keyword-knob").knob({
				change: function(value){
					keyword.weight = value;
				}
			});
		});

		$(".remove-keyword").tooltip();

	}

	var _initialize_persons = function(data){
		$scope.current_persons = [];

		data.forEach(function(person){
			var articles = [];
			person.articles.forEach(function(article){
				articles.push(new Article(article.title, article.abstract, article.id));	
			});
			
			$scope.current_persons.push(new Person(person.id, person.name, person.keywords, articles));
		});

		$scope.$apply();
	}

	var _get_keyword_feedback = function(){
		var feedback = {};
		feedback.keywords = [];
		feedback.removed = [];
		$scope.current_keywords.forEach(function(keyword){
			if(!keyword.removed){
				feedback.keywords.push({
					id: keyword.id,
					text: keyword.text,
					weight: keyword.weight / 100
				});
			}else{
				feedback.removed.push(keyword.id);
			}
		});

		return JSON.stringify(feedback);
	}

	var _get_removed_keywords = function(){
		var removed = $.grep($scope.current_keywords, function(keyword){
			return keyword.removed;
		});

		removed = $.map(removed, function(keyword){
			return keyword.id;
		})

		return removed;
	}

	var _highlight_abstract_keywords = function(abstract, keywords){
		var words = abstract.split(" ");
		for(var i=0; i<words.length; i++){
			if(keywords[words[i].toLowerCase()]){
				$(".keyword-box[data-keywordId='" + keywords[words[i].toLowerCase()].id + "']").addClass("keyword-box-active");
				words[i] = "<span class='highlighted-keyword'>" + words[i] + "</span>";
			}
		}

		return words.join(" ");
	}

	_get_persons_related_to_keyword = function(keyword_id){
		var id = keyword_id;

		console.log(id);
		return $.grep($scope.current_persons, function(person){
			console.log(person.keywords.indexOf(id) >= 0);
			return $.inArray(id, person.keywords) >= 0;
		});
	}

	var _get_selected_keyword_suggestions = function(){
		var selected = $.grep($scope.keyword_suggestions, function(keyword){
			return keyword.selected;
		});

		return selected;
	}

	/*****************
	*	DUMMY DATA   *
	******************/

	_keyword_suggestion_dummy_data = function(){
		var suggestions = [];

		for(var i=0; i<200; i++){
			var txt = "keywordkeyword";
			var k = new Keyword();
			k.text = txt.substring(2, Math.floor(Math.random() * txt.length) + 4);
			suggestions.push(k);
		}

		return suggestions;
	}

	_keyword_dummy_data = function(){
		var keywords = [];

		for(var i=0; i<10; i++){
			var txt = "lorem";
			var k = new Keyword(i, txt, Math.random(), Math.random());
			keywords.push(k);
		}

		return keywords;	
	}

	_person_dummy_data = function(){
		var persons = [];

		for(var i=0; i<10; i++){
			var articles = [];
			for(var n=0; n<10; n++){
				articles.push(
				new Article( "Lorem ipsum dolor sit amet", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas suscipit lorem turpis, nec volutpat justo sagittis non. Vestibulum tortor enim, viverra ac sem in, placerat posuere diam. Ut vel velit imperdiet, fringilla libero a, placerat velit. Duis et accumsan libero. Duis ante diam, euismod a elementum molestie, ultrices sed justo. Quisque aliquam elementum consectetur. Vivamus mi orci, sodales sed venenatis et, sollicitudin id sapien."));
			}
			var p = new Person(i, "Kalle Ilves", [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)], articles);
			persons.push(p);
		}

		return persons;
	}

	_get_keyword_suggestions(function(){ _views.search_view.slideDown(500); $("#search-field").focus() });

}]);

$(document).ready(function(){

	$(".vertical-nav .toggle-navigation").live("click", function(){
		$(".vertical-nav .toggle-navigation").not(this).removeClass("selected-true");
		$(".vertical-nav .toggle-navigation").not(this).parent("li").find("ul").slideUp();
		$(this).toggleClass("selected-true")
		$(this).parent("li").find("ul").slideToggle();
	});

	$("#next-iteration").tooltip();
	$("#end-search").tooltip();
	$("#suggest-keywords-trigger").bind("click", function(){
		$(".keyword-suggestions-list").slideToggle();
	});
});
