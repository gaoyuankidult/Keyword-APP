var ChartApp = angular.module("ChartApp", []);

ChartApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

ChartApp.service("Interface", function(){
    var initialize_canvas = function(){
        $("#chart-canvas").remove();
        $("#chart-holder").append("<canvas id='chart-canvas'></canvas>");
        $("#chart-canvas").attr({
            width: $("#chart-container").width() - 40,
            height: $("#chart-container").height() - 110
        });
        
        return $("#chart-canvas").get(0).getContext("2d")
    }

    return {
        initialize_canvas: initialize_canvas
    }
});

ChartApp.service("Visualization", function(){

    function draw_line(x, y, xx, yy, context){
        context.beginPath();
        context.strokeStyle = "rgb(230,230,230)";
        context.moveTo(x,y);
        context.lineTo(xx, yy);
        context.stroke();
    }
    
    function draw_axis(ctx, step, size){
        for(var x=0; x<=size; x+=step){
            draw_line(x, 0, x, size, ctx);
        }

        for(var y=0; y<=size + step; y+=step){
            draw_line(0, y, size, y, ctx);
        }
    }

    function min_max_val(matrix){
        var max_val = Number.NEGATIVE_INFINITY;
        var min_val = Number.POSITIVE_INFINITY;

        for(y=0; y<matrix.length; y++){
            for(var x=0; x<matrix[0].length; x++){
                if(matrix[y][x].value > max_val){
                    max_val = matrix[y][x].value;
                }
                if(matrix[y][x].value < min_val){
                 min_val = matrix[y][x].value;
                }
            }
        }

        return { max: max_val, min: min_val };
    }
    
    function get_label_font_size(articles_count){
        if(articles_count <= 6){
            return 0.9;
        }else{
            return (articles_count - 42) / -40;
        }
    }

    function visualize_large(matrix){
        var ctx = $("#article-relation-canvas")[0].getContext("2d");

        $("#article-relation-canvas").attr({
            height: 600,
            width: 600
        });

var min_max = min_max_val(matrix);
        var block_height = 600 / matrix.length;
        var block_width = 600 / matrix[0].length;
        var opacity_scale = min_max.max - min_max.min;

console.log(opacity_scale)

        for(var y=0; y<matrix.length; y++){
            for(var x=0; x<matrix[0].length; x++){
            	if(y <= x){
                	ctx.fillStyle = "rgba(0,151,207," + ( (matrix[y][x].value - min_max.min) / opacity_scale ) + ")";
                	ctx.fillRect(x*block_width, y*block_height, block_width, block_height);
            	}
            }
        }

        $("#small-visualization-container").hide();
        $("#large-visualization-container").show();
    }

    function visualize_small(matrix){
    	var label_margin_x = 35;
        var label_margin_y = 50;
     	var min_max = min_max_val(matrix);
        var scale_size = min_max.max - min_max.min;
        var draw_width = 730;
        var scale_y = draw_width / ( matrix.length - 1 );
        var scale_x = draw_width / ( matrix[0].length - 1);
        var ctx = $("#coordination-canvas")[0].getContext("2d");
        
        $("#coordination-canvas").attr({
            height: draw_width,
            width: draw_width
        });

        var articles = [];
        var labels = [];
        var label_font_size = get_label_font_size(matrix.length);

        for(y=0; y<matrix.length; y++){
            labels.push({
                x: 730 + label_margin_x,
                y: y * scale_y - 10,
                width: 130,
                font_size: label_font_size,
                text: matrix[0][y].title
            });
        	
            for(var x=0; x<matrix[0].length; x++){
            	if(y == 0){
                    labels.push({
                        x: x * scale_x - ( scale_x / 2 ),
                        y: -label_margin_y,
                        width: scale_x,
                        font_size: label_font_size,
                        text: matrix[0][x].title
                    });   
                }
                if(y <= x){
	                var size = Math.max(( matrix[y][x].value - min_max.min ) / scale_size * 60, 10);
	                articles.push({
	                    x: x * scale_x - size / 2,
	                    y: y * scale_y - size / 2,
	                    size: size,
	                    title: matrix[y][x].title,
	                    abstract: matrix[y][x].abstract,
	                    author: matrix[y][x].author,
	                    id: matrix[y][x].id,
	                    row_parent: matrix[0][y]
	                });
                }
            }
        }

	draw_axis(ctx, scale_x, 730);

        $("#large-visualization-container").hide();
        $("#small-visualization-container").show();
    
        setTimeout(function(){
            $(".article-ball").removeClass("animated bounceIn");
        }, 1000);

        return {
           articles: articles,
           labels: labels
        };
    }

    return {
        visualize_large: visualize_large,
        visualize_small: visualize_small
    };
});

ChartApp.controller("ChartController", ["$scope", "Visualization", "Interface", function($scope, Visualization, Interface){
    Chart.defaults.global.tooltipTemplate = "<%= label %>";

    var _article_id_to_topic_model = {};
    var _topic_model_to_data = {};

    $scope.charts = [];
    $scope.current_chart = $scope.charts[0];
    $scope.active_article = null;

    $scope.switch_to_chart = function(chart){
        var ind = chart.index
        $("#chart-container").fadeOut(500, function(){
            $scope.current_chart = $scope.charts[ind];

            var ctx = $("#chart-canvas").get(0).getContext("2d");
            var chart = new Chart(ctx).Bar($scope.current_chart);
            $("#chart-container").fadeIn(500);

            $scope.$apply();
        });
    }
    $scope.switch_to_chart = function(chart){
        var ind = chart.index

        $(".vertical-nav > li > ul").slideUp(500);

        $("#article-relation-container").hide();
        $("#chart-container").fadeOut(500, function(){
            $scope.current_chart = $scope.charts[ind];

            $("#chart-canvas").show();
            $("#article-relation-container").hide();

            var ctx = Interface.initialize_canvas();
            var chart = new Chart(ctx).Bar($scope.current_chart);
            
            $("#chart-container").fadeIn(500);

            $scope.$apply();
        });
    }

    $scope.switch_to_article_relation_chart = function(){
        $(".article-relation-chart-options").slideDown(500);

        $("#chart-container").fadeOut(500, function(){
            $("#chart-canvas").hide();
            $("#article-relation-container").show();

            $scope.current_chart = {
                heading: "Keyword relations"
            }
            $("#chart-container").fadeIn(500);

            $scope.$apply();
        });
    }

    $scope.check_all_articles = function(){
        $scope.articles.forEach(function(article){
            article.selected = true;
        });

        $scope.$apply();
    }
    
    $scope.un_check_all_articles = function(){
    	$scope.articles.forEach(function(article){
    		article.selected = false;	
    	});
    	
    	$scope.$apply();
    }

    $scope.display_article_relation_visualization = function(){
    	$scope.active_article = null;
    	
        var selected_articles = $.grep($scope.articles, function(article){
            return article.selected;
        });
        
        $.post("/article_matrix", JSON.stringify({ articles: $.map(selected_articles, function(article){ return article.id }) }))
        .done(function(data){
            if(selected_articles.length <= 15){
            	var visualization_data = Visualization.visualize_small(data.matrix)
            	
            	_article_id_to_topic_model = data.topic_model_relation;
            	_topic_model_to_data = data.topic_data;
            	console.log("ARTICLE ID TO TOPIC MODEL: " + JSON.stringify(_article_id_to_topic_model))
            	console.log("TOPIC MODEL TO DATA: " + JSON.stringify(_topic_model_to_data))
            	
                $scope.visualized_articles = visualization_data.articles;
                $scope.visualized_articles_labels = visualization_data.labels;
                
                console.log("ARTICLES: " + JSON.stringify($scope.visualized_articles));
                $scope.active_article = $scope.visualized_articles[0];
                _set_topic_model();
                $scope.$apply();
                
                $(".article-ball").popover();
            }else{
                Visualization.visualize_large(data.matrix);
            }
        });
    }
    
    $scope.hide_article_information = function(){
        $scope.visualized_articles.forEach(function(a){
            a.active = false;
        });

        $scope.active_article = null;

        $scope.$apply();
    }

    $scope.show_article_information = function(article){
        $scope.visualized_articles.forEach(function(a){
            a.active = false;
        });

        article.active = true;
        $scope.active_article = article;
        _set_topic_model();
        
        $scope.$apply();
    }
    
    var _set_topic_model = function(){
    	$scope.active_article.topic_model_keywords = _topic_model_to_data[_article_id_to_topic_model[$scope.active_article.id.toString()]];
	$scope.active_article.row_parent.topic_model_keywords = _topic_model_to_data[_article_id_to_topic_model[$scope.active_article.row_parent.id.toString()]];
    }
    
    var _fetch_charts = function(callback){

        var skeleton = [
            {
                index: 0,
                heading: "People and keyword weights",
                labels: [],
                datasets: [
                    {
                        label: "People and keyword weights",
                        fillColor: "rgba(0,151,207,0.2)",
                        strokeColor: "rgba(0,151,207,1)",
                        pointColor: "rgba(0,151,207,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(0,151,207,1)",
                        data: []
                    }
                ]
            },
            {
                index: 1,
                heading: "People and keyword counts",
                labels: [],
                datasets: [
                    {
                        label: "People and keyword counts",
                        fillColor: "rgba(0,151,207,0.2)",
                        strokeColor: "rgba(0,151,207,1)",
                        pointColor: "rgba(0,151,207,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(0,151,207,1)",
                        data: []
                    }
                ]   
            }
        ];

        $.get("/charts_data", function(data){
            console.log(data);
            
            $scope.articles = data.articles
            charts = data.charts;
            
            for(var i=0; i<charts.length; i++){
                skeleton[i].labels = charts[i].persons;
                skeleton[i].datasets[0].data = charts[i].data;
            }

            console.log(JSON.stringify($scope.charts));

            $scope.charts = skeleton;

            callback();
        })
    }

    _fetch_charts(function(){
	    $scope.current_chart = $scope.charts[0];
            $scope.$apply();
    	
    	    $(".vertical-nav > li:first-child > a").addClass("selected-true");

	    $(".vertical-nav > li > a").bind("click", function(){
	    	console.log("TRIGGERED BY: " + $(this).html());
	        $(".vertical-nav > li > a").removeClass("selected-true");
	        console.log("SELECTED: " + $(this).length)
	        $(this).addClass("selected-true");
	    });
	    
            var ctx = Interface.initialize_canvas();
            var chart = new Chart(ctx).Bar($scope.current_chart);
    
            $("#chart-container").fadeIn(500);
            $("#chart-nav-container").animate({
                width: "20%"
            }, 500); 
        });

}]);
