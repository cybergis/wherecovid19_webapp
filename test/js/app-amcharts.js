// Themes begin
am4core.useTheme(am4themes_animated);
am4core.useTheme(am4themes_dark);
// Themes end

am4core.ready(function () {

  var usa = false;
  // Create map instance
  var chart = am4core.create("viewDiv", am4maps.MapChart);
  // chart.homeGeoPoint = { longitude: 0, latitude: 0 };
  chart.background.fill = am4core.color("#303030");
  chart.background.fillOpacity = 1;
  chart.background.opacity = 1;
  chart.projection = new am4maps.projections.Projection();
  chart.backgroundSeries.events.on("hit", resetMap);


  // Zoom control
  chart.zoomControl = new am4maps.ZoomControl();
  chart.zoomControl.align = "right";
  chart.zoomControl.valign = "top";

  var homeButton = new am4core.Button();
  homeButton.events.on("hit", resetMap);

  homeButton.icon = new am4core.Sprite();
  homeButton.padding(7, 5, 7, 5);
  homeButton.width = 30;
  homeButton.icon.path =
    "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8";
  homeButton.marginTop = 10;
  homeButton.parent = chart.zoomControl;
  homeButton.insertAfter(chart.zoomControl.minusButton);

  //Define layers map
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  /////////////////////////World///////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  // Create map polygon series for world map
  var worldSeries = chart.series.push(new am4maps.MapPolygonSeries());
  worldSeries.id = "world";
  worldSeries.useGeodata = true;
  worldSeries.geodata = am4geodata_worldLow; // Use series data to set custom zoom points for countries
  worldSeries.exclude = ["AQ"];
  worldSeries.events.on("shown", function (ev) {
    // if(usa == true){
      chart.projection = new am4maps.projections.Miller();
      chart.projection = new am4maps.projections.Miller();
      chart.deltaLongitude = -10;
    // }
  });

  var worldPolygon = worldSeries.mapPolygons.template;
  worldPolygon.tooltipText = "{name} {id}";
  worldPolygon.nonScalingStroke = true;
  worldPolygon.stroke = am4core.color("#FFFFFF");
  worldPolygon.strokeOpacity = 0.1;
  worldPolygon.fill = am4core.color("#363636");

  var hs = worldPolygon.states.create("hover");
  hs.properties.fill = chart.colors.getIndex(1);

  // Set up click events
  worldPolygon.events.on("hit", function (ev) {
    ev.target.series.chart.zoomToMapObject(ev.target);
    var map = ev.target.dataItem.dataContext.map;
    console.log(map);
    if (map) {
      ev.target.isHover = false;
      countrySeries.geodataSource.url =
        "https://www.amcharts.com/lib/4/geodata/json/" + map + ".json";
      countrySeries.geodataSource.load();
      if(map == "usaLow") {usa = true;}
      else {usa=false;}
    }
  });

  // Set up data for countries
  var data = [];
  for (var id in am4geodata_data_countries2) {
    if (am4geodata_data_countries2.hasOwnProperty(id)) {
      var country = am4geodata_data_countries2[id];

      if(!country.maps[0]){
      console.log(id +" : "+country.maps);
      }

      if (country.maps.length) {
        data.push({
          id: id,
          //color: chart.colors.getIndex(continents[country.continent_code]),
          map: country.maps[0],
        });
      }
    }
  }
  worldSeries.data = data;

  // Create country specific series (but hide it for now)
  var countrySeries = chart.series.push(new am4maps.MapPolygonSeries());
  countrySeries.useGeodata = true;
  countrySeries.id = "countries";
  countrySeries.hide();
  countrySeries.geodataSource.events.on("done", function (ev) {
    worldSeries.hide();
    countrySeries.show();
    if(usa == true) {
      chart.projection = new am4maps.projections.AlbersUsa();
    } else {
      // chart.projection = new am4maps.projections.Miller();
    }
  });

  countrySeries.data = [{
    "id": "NZ",
    "zoomLevel": 12,
    "zoomGeoPoint": {
      "latitude": -41,
      "longitude": 173
    }
  }, {
    "id": "RU",
    "zoomLevel": 2.5,
    "zoomGeoPoint": {
      "latitude": 62,
      "longitude": 96
    }
  }];
  
  countrySeries.dataFields.zoomLevel = "zoomLevel";
  countrySeries.dataFields.zoomGeoPoint = "zoomGeoPoint";

  var countryPolygon = countrySeries.mapPolygons.template;
  countryPolygon.tooltipText = "{name}";
  countryPolygon.stroke = am4core.color("#FFFFFF");
  countryPolygon.strokeOpacity = 0.1;
  countryPolygon.nonScalingStroke = true;
  countryPolygon.fill = am4core.color("#363636");

  var hs = countryPolygon.states.create("hover");
  hs.properties.fill = chart.colors.getIndex(10);

  // Create country specific series (but hide it for now)
  var ILcountySeries = chart.series.push(new am4maps.MapPolygonSeries());
  ILcountySeries.hide();
  // ILcountySeries.geodataSource.url =
  //       "https://www.amcharts.com/lib/4/geodata/json/region/usa/ilLow.json";
  ILcountySeries.useGeodata = true;
  ILcountySeries.data = [
    {
      id: "17015",
      value: 1545345,
      fill: "#00FF00",
    },
  ];

  var ILcountyPolygon = ILcountySeries.mapPolygons.template;
  ILcountyPolygon.tooltipText = "{name} : {value}";
  ILcountyPolygon.nonScalingStroke = true;
  ILcountyPolygon.stroke = am4core.color("#FFFFFF");
  ILcountyPolygon.strokeOpacity = 0.1;
  ILcountyPolygon.fill = am4core.color("#363636");
  ILcountyPolygon.propertyFields.fill = "fill";
  countrySeries.hide();

  function resetMap() {
    worldSeries.show();
    countrySeries.hide();
    chart.goHome();
  }
}); // end am4core.ready()
