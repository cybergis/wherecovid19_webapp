  function getColorFor(d) {
    return d > 100000 ? '#800026' :
    d > 50000 ? '#BD0026' :
    d > 10000 ? '#E31A1C' :
    d > 5000 ? '#FC4E2A' :
    d > 1000 ? '#FD8D3C' :
    d > 100 ? '#FEB24C' :
    d > 10 ? '#FED976' :
    '#FFEDA0';
  }

  function getAccColor(d) {
    return d > 0.9 ? '#800026' :
    d > 0.8 ? '#BD0026' :
    d > 0.6 ? '#E31A1C' :
    d > 0.4 ? '#FC4E2A' :
    d > 0.3 ? '#FD8D3C' :
    d > 0.2 ? '#FEB24C' :
    d > 0.1 ? '#FED976' :
    '#FFEDA0';
  }
  
  var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, 
      attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  });

  var map = L.map('map', {layers: [osm, Stadia_AlidadeSmoothDark], center: new L.LatLng(37,-96), zoom: 4 });
  var timeline;
  var timelineControl;
  var index = 0;
  const DayInMilSec = 60*60*24*1000;
  
  function splitStr(str,num) {
  var newStr = str.split(",")
  return parseInt(newStr[num])
  }
  
  var styleFunc = function(_data){
    return {
      stroke: false,
      color: getColorFor(splitStr(_data.properties.cases_ts, index)),
      fillOpacity: 0.5
    }
  }
  
  var styleAccI = function(_data){
    return {
      stroke: false,
      color: getAccColor(_data.properties.hospital_i),
      fillOpacity: 0.5
    }
  }

  var styleAccV = function(_data){
    return {
      stroke: false,
      color: getAccColor(_data.properties.hospital_v),
      fillOpacity: 0.5
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////// Add Timeline ///////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////
  
  var slider = L.timelineSliderControl({
      formatOutput: function(date){
        return new Date(date).toLocaleDateString();
      },
      steps:150,
      position: 'bottomleft'
    });
    map.addControl(slider);

  var us_states_ts = L.timeline(us_states,{style: styleFunc,
      waitToUpdateMap: true, onEachFeature: onEachFeature});
  us_states_ts.addTo(map);
  
  us_states_ts.on('change', function(){
    index = Math.floor((this.time-this.start)/DayInMilSec);
    this.setStyle(styleFunc);		 
      });

  var us_counties_ts = L.timeline(us_counties,{style: styleFunc,
      waitToUpdateMap: true, onEachFeature: onEachFeature});
  us_counties_ts.addTo(map);
  
  us_counties_ts.on('change', function(){
    index = Math.floor((this.time-this.start)/DayInMilSec);
    this.setStyle(styleFunc);		 
      });

  var world_ts = L.timeline(world,{style: styleFunc,
      waitToUpdateMap: true, onEachFeature: onEachFeature});
  world_ts.addTo(map);
  
  world_ts.on('change', function(){
    index = Math.floor((this.time-this.start)/DayInMilSec);
    this.setStyle(styleFunc);		 
      });

  var chicago_acc_i_ts = L.timeline(chicago_acc_i,{style: styleAccI,
      waitToUpdateMap: true,});
  chicago_acc_i_ts.addTo(map);
  
  chicago_acc_i_ts.on('change', function(){
    index = Math.floor((this.time-this.start)/DayInMilSec);
    this.setStyle(styleAccI);		 
      });

  var chicago_acc_v_ts = L.timeline(chicago_acc_v,{style: styleAccV,
      waitToUpdateMap: true,});
  chicago_acc_v_ts.addTo(map);
  
  chicago_acc_v_ts.on('change', function(){
    index = Math.floor((this.time-this.start)/DayInMilSec);
    this.setStyle(styleAccV);		 
      });

  var illinois_acc_i_ts = L.timeline(illinois_acc_i,{style: styleAccI,
      waitToUpdateMap: true,});
  illinois_acc_i_ts.addTo(map);
  
  illinois_acc_i_ts.on('change', function(){
    index = Math.floor((this.time-this.start)/DayInMilSec);
    this.setStyle(styleAccI);		 
      });

  var illinois_acc_v_ts = L.timeline(illinois_acc_v,{style: styleAccV,
      waitToUpdateMap: true,});
  illinois_acc_v_ts.addTo(map);
  
  illinois_acc_v_ts.on('change', function(){
    index = Math.floor((this.time-this.start)/DayInMilSec);
    this.setStyle(styleAccV);		 
      });
  
  // slider.addTimelines(us_counties_ts);
  slider.addTimelines(us_counties_ts, us_states_ts, world_ts, 
  chicago_acc_i_ts, chicago_acc_v_ts, illinois_acc_i_ts, illinois_acc_v_ts);

  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////// Create Legend ///////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  var legend = L.control({position: 'bottomright'});

  legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
          grades = [10,100,1000,5000,10000,50000,100000],
          labels = [];

      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
          div.innerHTML +=
              '<i style="background:' + getColorFor(grades[i] + 1) + '"></i> ' +
              grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+') +'<br>';
      }

      return div;
  };

  legend.addTo(map);

  ///////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////// Create Popup ///////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

    function onEachFeature(feature, layer) {
        if (feature.properties) {
            layer.bindPopup(" " +feature.properties.NAME + " "  + "<br>Total cases : " + feature.properties.today_case + " ");
            layer.on({click: onMapClick});
        }
    };   
    // Need to make it changable with time (use index of cases_ts)

  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Highlight when clicking /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

    var highlight = {
        'color': '#00fbff',
        'weight': 2,
        'opacity': 0.5
    };

    function onMapClick(e) {
        e.target.setStyle(highlight);
    };

    // Need to cancel highlight when select another feature


  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Add base maps and overlay maps //////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////// 

  var baseMaps = {
    "OSM": osm,
    "Dark Mode": Stadia_AlidadeSmoothDark,
  };

  var groupedOverlays = {
      "Illinois":{
          "Accessibility (ICU Beds-Chicago)": chicago_acc_i_ts,
          "Accessibility (Ventilators-Chicago)": chicago_acc_v_ts,
          "Accessibility (ICU Beds-State)": illinois_acc_i_ts,
          "Accessibility (Ventilators-State)": illinois_acc_v_ts
      },
      "US":{
          "US States": us_states_ts,
          "US Counties": us_counties_ts,
      },
      "World":{
          "World": world_ts,
      }
  };

  var options = {
  // Make the "Landmarks" group exclusive (use radio inputs)
  exclusiveGroups: ["Illinois","US","World"],
  // Show a checkbox next to non-exclusive group labels for toggling all
  groupCheckboxes: true
  };

  // Use the custom grouped layer control, not "L.control.layers"
  var layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, options);
  map.addControl(layerControl);

  // L.control.layers(baseMaps).addTo(map);
  // L.control.layers(overlayMaps).addTo(map);