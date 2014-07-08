var ChartApp = angular.module("ChartApp", []);

ChartApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

ChartApp.controller("ChartController", ["$scope", function($scope){
    Chart.defaults.global.tooltipTemplate = "<%= label %>";

    $scope.charts = [];
    $scope.current_chart = $scope.charts[0];

    $scope.switch_to_chart = function(chart){
        var ind = chart.index
        $("#chart-container").fadeOut(500, function(){
            $scope.current_chart = $scope.charts[ind];

            var ctx = $("#chart-canvas").get(0).getContext("2d");
            var chart = new Chart(ctx).Line($scope.current_chart);
            $("#chart-container").fadeIn(500);

            $scope.$apply();
        });
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
            for(var i=0; i<data.length; i++){
                skeleton[i].labels = data[i].persons;
                skeleton[i].datasets[0].data = data[i].data;
            }

            console.log(JSON.stringify($scope.charts))

            $scope.charts = skeleton;
            $scope.current_chart = $scope.charts[0];
            $scope.$apply();

            callback();
        })
    }

    _fetch_charts(function(){
           $("#chart-canvas").attr({
                width: $("#chart-container").width() - 40,
                height: $("#chart-container").height() - 110
            });
    
            var ctx = $("#chart-canvas").get(0).getContext("2d");
            var chart = new Chart(ctx).Line($scope.current_chart);
    
            $("#chart-container").fadeIn(500);
            $("#chart-nav-container").animate({
                width: "20%"
            }, 500); 
        });

}]);

$(document).bind("ready", function(){
    $(".vertical-nav > li:first-child > a").addClass("selected-true");

    $(".vertical-nav > li > a").click(function(){
        $(".vertical-nav > li > a").removeClass("selected-true");
        $(this).addClass("selected-true");
    })
});
