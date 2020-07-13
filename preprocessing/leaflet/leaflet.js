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
      position: 'bottomleft',
      showTicks: false
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
        console.log(e);
        updateChart(e.target.feature);
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

  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////// Handle side panel ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    setListview();

    function setListview() {

    }
    
    ///////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////// Handle chart update //////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////


    var tooltip = null;
    var hitTest = null;
    var hoverover_callback = null;
    var activeAnimationLayerView = null;
    var hitGraphic = null;

    function updateChart(graphic) {

        Chart.defaults.global.defaultFontSize = 12;
        Chart.defaults.global.defaultFontColor = '#777';

        var datasetList = [];

        var CasesArrayStr = (graphic.properties.cases_ts).split(",");
        var CasesArray = CasesArrayStr.map(Number);

        // Fix negative numbers of increased cases 

        for (k = CasesArray.length - 1; k > 0; k--) {
            if (CasesArray[k - 1] > CasesArray[k]) {
                CasesArray[k - 1] = CasesArray[k];
            }
        }

        var IncreasedCases = [];
        for (i = 1; i < CasesArray.length; i++) {
            IncreasedCases.push(CasesArray[i] - CasesArray[i - 1])
        };
        IncreasedCases.unshift(0);

        var ExtendedCasesArray = CasesArray.slice(0);
        ExtendedCasesArray.unshift(0, 0, 0, 0, 0, 0, 0);

        var ExtendedIncreasedCases = IncreasedCases.slice(0);
        ExtendedIncreasedCases.unshift(0, 0, 0, 0, 0, 0, 0);

        var firstCaseIndex = ExtendedCasesArray.findIndex(val => val > 0);
        SlicedCasesArray = ExtendedCasesArray.slice(firstCaseIndex);
        SlicedIncreasedCases = ExtendedIncreasedCases.slice(firstCaseIndex);

        if (graphic.properties.deaths_ts != undefined) {
            var DeathsArrayStr = (graphic.properties.deaths_ts).split(",");
            var DeathsArray = DeathsArrayStr.map(Number);

            // Fix negative numbers of increased cases 

            for (k = DeathsArray.length - 1; k > 0; k--) {
                if (DeathsArray[k - 1] > DeathsArray[k]) {
                    DeathsArray[k - 1] = DeathsArray[k];
                }
            }

            var IncreasedDeaths = [];
            for (i = 1; i < DeathsArray.length; i++) {
                IncreasedDeaths.push(DeathsArray[i] - DeathsArray[i - 1])
            };
            IncreasedDeaths.unshift(0);

            var ExtendedDeathsArray = DeathsArray.slice(0);
            ExtendedDeathsArray.unshift(0, 0, 0, 0, 0, 0, 0);

            var ExtendedIncreasedDeaths = IncreasedDeaths.slice(0);
            ExtendedIncreasedDeaths.unshift(0, 0, 0, 0, 0, 0, 0);

            SlicedDeathsArray = ExtendedDeathsArray.slice(firstCaseIndex);
            SlicedIncreasedDeaths = ExtendedIncreasedDeaths.slice(firstCaseIndex);
        }

        var LabelDates = [];
        if (graphic.properties.dt_start == "2020-03-17") {
            var LabelDate = new Date(2020, 2, 9);
        } else if (graphic.properties.dt_start == "2020-01-11") {
            var LabelDate = new Date(2020, 0, 3);
        } else {
            var LabelDate = new Date(2020, 0, 13);
        }

        for (i = 0; i < ExtendedCasesArray.length; i++) {
            LabelDate.setDate(LabelDate.getDate() + 1);
            LabelDates.push(LabelDate.toLocaleDateString());
        }

        SlicedLabelDates = LabelDates.slice(firstCaseIndex);

        const verticalLinePlugin = {
            getLinePosition: function(chart, pointIndex) {
                const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
                const data = meta.data;
                return data[pointIndex]._model.x;
            },
            renderVerticalLine: function(chartInstance, pointIndex) {
                const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
                const scale = chartInstance.scales['y-axis-0'];
                const context = chartInstance.chart.ctx;

                // render vertical line
                context.beginPath();
                context.strokeStyle = '#ffffff';
                context.setLineDash([10, 5]);
                context.moveTo(lineLeftOffset, scale.top);
                context.lineTo(lineLeftOffset, scale.bottom);
                context.stroke();

                // write label
                context.fillStyle = "#ffffff";
                context.textAlign = 'right';
                //context.fillText('Current Day ', lineLeftOffset, (scale.bottom - scale.top) / 2 + scale.top);
            },

            afterDatasetsDraw: function(chart, easing) {
                if (chart.config.lineAtIndex) {
                    chart.config.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
                }
            }
        };

        Chart.plugins.register(verticalLinePlugin);

        dic1 = {
            data: SlicedCasesArray,
            label: "Total Cases ", 
            borderColor: "#ffab24",
            pointStyle: "circle",
            fill: false,
            hidden: true
        };
        dic2 = {
            data: SlicedIncreasedCases,
            label: "Daily Cases ", 
            borderColor: "#f25100",
            pointStyle: "circle",
            fill: false,
            hidden: false
        };

        if (graphic.properties.deaths_ts != undefined) {
            dic3 = {
                data: SlicedDeathsArray,
                label: "Total Deaths ", 
                borderColor: "#a10025",
                pointStyle: "circle",
                fill: false,
                hidden: true
            };
            dic4 = {
                data: SlicedIncreasedDeaths,
                label: "Daily Deaths ", 
                borderColor: "#6a28c7",
                pointStyle: "circle",
                fill: false,
                hidden: true
            };
        }

        if (graphic.properties.cases_ts != undefined) {
            datasetList.push(dic1)
            datasetList.push(dic2)
        }

        if (graphic.properties.deaths_ts != undefined) {
            datasetList.push(dic3)
            datasetList.push(dic4)
        }

        if (window.bar != undefined) {
            window.bar.destroy();
        }

        window.bar = new Chart(myChart, {
            type: 'line',
            data: {
                labels: SlicedLabelDates,
                datasets: datasetList
            },
            options: {
                title: {
                    display: false,
                    text: 'COVID19 Time Series',
                    fontSize: 15
                },
                legend: {
                    position: 'top',
                    fullWidth: true,
                    labels: {
                        fontSize: 12
                    }
                },
                fontSize: 12,
                responsive: true,
                maintainAspectRatio: false
            },
            //lineAtIndex: [slider.values[0]-firstCaseIndex],
            animation: {
                duration: 0
            },
            responsiveAnimationDuration: 0
        });

        // Prevent the animation of redrawing the chart
        window.bar.update(0);

    }