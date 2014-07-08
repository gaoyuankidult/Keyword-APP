var ChartApp = angular.module("ChartApp", []);

ChartApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});

ChartApp.controller("ChartController", ["$scope", function($scope){
    Chart.defaults.global.tooltipTemplate = "<%= label %>";

    $scope.charts = [
    	{
            index: 0,
            heading: "People and keyword weights",
            labels: ["Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves"],
            datasets: [
                {
                    label: "People and keyword weights",
                    fillColor: "rgba(0,151,207,0.2)",
                    strokeColor: "rgba(0,151,207,1)",
                    pointColor: "rgba(0,151,207,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(0,151,207,1)",
                    data: [28, 48, 40, 19, 86, 27, 90, 24, 55, 10, 49, 12, 94, 56, 24]
                }
            ]
        },
        {
            index: 1,
            heading: "People and keyword counts",
            labels: ["Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves", "Kalle Ilves"],
            datasets: [
                {
                    label: "People and keyword counts",
                    fillColor: "rgba(0,151,207,0.2)",
                    strokeColor: "rgba(0,151,207,1)",
                    pointColor: "rgba(0,151,207,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(0,151,207,1)",
                    data: [28, 48, 40, 19, 86, 27, 90, 24, 55, 10, 49, 12, 94, 56, 24]
                }
            ]   
        }
    ];

    $scope.current_chart = $scope.charts[0];

    (function(){
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
    })();

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

        $.get("/charts", function(data){
            for(var i=0; i<data.length; i++){
                skeleton[i].labels = data[i].persons;
                skeleton[i].datasets[0].data = data[i].data;
            }

            $scope.charts = skeleton;
            $scope.$apply();

            callback();
        })
    }



}]);

$(document).bind("ready", function(){
    $(".vertical-nav > li:first-child > a").addClass("selected-true");

    $(".vertical-nav > li > a").click(function(){
        $(".vertical-nav > li > a").removeClass("selected-true");
        $(this).addClass("selected-true");
    })
});