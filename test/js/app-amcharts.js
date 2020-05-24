am4core.ready(function() {
    // Themes begin
    am4core.useTheme(am4themes_animated);
    // Themes end

    var continents = {
        AF: 0,
        AN: 1,
        AS: 2,
        EU: 3,
        NA: 4,
        OC: 5,
        SA: 6,
    };

    // Create map instance
    var chart = am4core.create("viewDiv", am4maps.MapChart);
    // chart.homeGeoPoint = { longitude: 0, latitude: 0 };
    chart.background.fill = am4core.color("#222426");
    chart.background.fillOpacity = 1;
    chart.background.opacity = 1;
    chart.deltaLongitude = -8;
    chart.projection = new am4maps.projections.Miller();

    //Create Illinois county map
    var illinoisCountySeries = chart.series.push(new am4maps.MapPolygonSeries());
    illinoisCountySeries.geodata = ilCounty;
    illinoisCountySeries.useGeodata = true;

    var illinoisCountyPolygon = illinoisCountySeries.mapPolygons.template;
    illinoisCountyPolygon.tooltipText = "{name}: {value} :{id}";
    illinoisCountyPolygon.nonScalingStroke = true;
    illinoisCountyPolygon.strokeOpacity = 0.1;
    // illinoisCountyPolygon.fill = am4core.color("#363636");
    illinoisCountyPolygon.propertyFields.fill = "fill";

    hs = illinoisCountyPolygon.states.create("hover");
    hs.properties.fill = chart.colors.getIndex(1);

    illinoisCountySeries.heatRules.push({
        "property": "fill",
        "target": illinoisCountySeries.mapPolygons.template,
        "min": am4core.color("#ffffff"),
        "max": am4core.color("#AAAA00")
    });

    illinoisCountyPolygon.events.on("hit", function(event) {
        console.log(event.target.dataItem);
    });

    illinoisCountySeries.data = [{
        "id": "15",
        "name": "United States",
        "value": 100,
        "fill": am4core.color("#F05C5C")
    }, {
        "id": "103",
        "name": "France",
        "value": 50,
        "fill": am4core.color("#5C5CFF")
    }];

    // Zoom control
    chart.zoomControl = new am4maps.ZoomControl();
    chart.deltaLongitude = -10;

    var homeButton = new am4core.Button();
    homeButton.events.on("hit", resetMap);

    homeButton.icon = new am4core.Sprite();
    homeButton.padding(7, 5, 7, 5);
    homeButton.width = 30;
    homeButton.icon.path =
        "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8";
    homeButton.marginBottom = 10;
    homeButton.parent = chart.zoomControl;
    homeButton.insertBefore(chart.zoomControl.plusButton);

    function resetMap() {
        worldSeries.show();
        countrySeries.hide();
        chart.goHome();
    }

}); // end am4core.ready()