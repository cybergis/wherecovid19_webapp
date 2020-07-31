///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Get User Location ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

var userLat;
var userLng;
var userState;
var userCountry;

function getLocation() {
  return new Promise((resolve, reject) => {
    //Get the latitude and the longitude;
    function successFunction(position) {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;
      // userLat = '36.2048';
      // userLng = '138.2529';
      // userLat = '36.7783';
      // userLng = '-119.4179';
      // $.ajax({
      //     url: 'http://api.geonames.org/countrySubdivision?lat='+userLat+'&lng='+userLng+'&username=register2020',
      //     type: 'GET',
      //     dataType: 'xml',
      //     success: function(res) {
      //         userState = res.getElementsByTagName("adminName1")[0].childNodes[0].nodeValue;
      //         userCountry = res.getElementsByTagName("countryName")[0].childNodes[0].nodeValue;
      //         resolve();
      //     }
      // });
      resolve();
    }

    function errorFunction() {
      alert("Geocoder failed!");
    }

    navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
  });
}

///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// Set up Basemaps /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

// var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
//     maxZoom: 20,
//     attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
// });

var CartoDB_DarkMatter = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }
);

///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// Load GeoJSON File ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

function loadJson(json_url) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: json_url,
      type: "GET",
      dataType: "json",
      success: function (data) {
        console.log(json_url);
        resolve(data);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
}

var promise_user = getLocation();
var promise = loadJson("preprocessing/classes.json");
var promise0 = loadJson("preprocessing/worldwide/who_world_data.geojson");
var promise1 = loadJson("preprocessing/nyt_states_data.geojson");
var promise2 = loadJson("preprocessing/nyt_counties_data.geojson");
var promise3 = loadJson("preprocessing/illinois/dph_county_data.geojson");
var promise4 = loadJson("preprocessing/illinois/Illinois_ACC_i.geojson");
var promise5 = loadJson("preprocessing/illinois/Illinois_ACC_v.geojson");
var promise6 = loadJson("preprocessing/illinois/Chicago_ACC_i.geojson");
var promise7 = loadJson("preprocessing/illinois/Chicago_ACC_v.geojson");
var promise8 = loadJson("preprocessing/illinois/vulnerability.geojson");
var promise9 = loadJson("preprocessing/illinois/dph_zipcode_data.geojson");

Promise.allSettled([
  promise,
  promise0,
  promise1,
  promise2,
  promise3,
  promise4,
  promise5,
  promise6,
  promise7,
  promise8,
  promise9,
  promise_user,
]).then((values) => {
  //console.log(values[0].value);
  colorClass = values[0].value;
  world = values[1].value;
  us_states = values[2].value;
  us_counties = values[3].value;
  illinois_counties = values[4].value;
  illinois_acc_i = values[5].value;
  illinois_acc_v = values[6].value;
  chicago_acc_i = values[7].value;
  chicago_acc_v = values[8].value;
  illinois_vulnerability = values[9].value;
  illinois_zipcode = values[10].value;

  main();
  console.log("---------------------------------------------");
  console.log("done");
});

var map = L.map("map", {
  layers: [osm, CartoDB_DarkMatter],
  center: new L.LatLng(40, -89),
  zoom: 7,
  //Remove Zoom Control from the map
  zoomControl: false,
  //Disable snap to zoom level
  zoomSnap: 0,
  //Remove the attribution from the right hand side
  //We will add it back later to the left side
  attributionControl: false,
});

// Add the attribution of the base mapo to the left side
L.control
  .attribution({
    position: "bottomleft",
  })
  .addTo(map);

function main() {
  ///////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Define Color Scheme ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  function splitStrInt(str, num) {
    var newStr = str.split(",");
    return parseInt(newStr[num]);
  }

  function splitStrFloat(str, num) {
    var newStr = str.split(",");
    return parseFloat(newStr[num]);
  }

  // var bins = colorClass.vulnerability.case.nolog.NaturalBreaks.bins.split(",").map(function(item) {
  //     return parseFloat(parseFloat(item).toFixed(2));
  // });

  function getColorFor(_num, _bins) {
    return _num > _bins[5]
      ? "#800026"
      : _num > _bins[4]
      ? "#BD0026"
      : _num > _bins[3]
      ? "#E31A1C"
      : _num > _bins[2]
      ? "#FC4E2A"
      : _num > _bins[1]
      ? "#FD8D3C"
      : _num > _bins[0]
      ? "#FEB24C"
      : _num > 0
      ? "#FFEDA0"
      : "#000000";
  }

  function getAccColor(d) {
    return d > 4
      ? "#08519c"
      : d > 3
      ? "#3182bd"
      : d > 2
      ? "#6baed6"
      : d > 1
      ? "#9ecae1"
      : d > 0
      ? "#c6dbef"
      : "#eff3ff";
  }

  function getVulColor(_num, _bins) {
    return _num > _bins[5]
      ? "#301934"
      : _num > _bins[4]
      ? "#8c0002"
      : _num > _bins[3]
      ? "#d7191c"
      : _num > _bins[2]
      ? "#fdaf61"
      : _num > _bins[1]
      ? "#ffffbf"
      : _num > _bins[0]
      ? "#a5d96a"
      : "#199640";
  }

  function getChangeColor(d) {
    return d > 0.5
      ? "#d7191c"
      : d > 0.1
      ? "#fd9861"
      : d > -0.1
      ? "#ffffbf"
      : d > -0.5
      ? "#a5d96a"
      : "#199640";
  }

  var styleFunc = function (_data) {
    return {
      stroke: true,
      weight: 1,
      color: "gray",
      fillColor: getColorFor(
        (100000 * splitStrInt(_data.properties.cases_ts, index)) /
          _data.properties.population,
        bins
      ),
      fillOpacity: 0.5,
    };
  };

  var styleAcc = function (_data) {
    return {
      stroke: false,
      //color:  "gray",
      fillColor: getAccColor(_data.properties.category),
      fillOpacity: 0.5,
    };
  };

  var styleVul = function (_data) {
    return {
      stroke: true,
      weight: 0.8,
      color: "gray",
      fillColor: getVulColor(
        splitStrFloat(_data.properties.cases_ts, index),
        bins
      ),
      fillOpacity: 0.5,
    };
  };

  var styleChange = function (_data) {
    return {
      stroke: true,
      weight: 1,
      color: "gray",
      fillColor: getChangeColor(
        splitStrFloat(_data.properties.change_ts, index),
        bins
      ),
      fillOpacity: 0.5,
    };
  };

  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////// Setup Timeline //////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  var index = 0;
  const DayInMilSec = 60 * 60 * 24 * 1000;

  var slider = L.timelineSliderControl({
    formatOutput: function (date) {
      return new Date(date).toLocaleDateString("en-US", { timeZone: "UTC" });
    },
    steps: 150,
    position: "topleft",
    showTicks: false,
  });
  map.addControl(slider);

  var illinois_counties_ts = L.timeline(illinois_counties, {
    style: styleFunc,
    waitToUpdateMap: true,
    onEachFeature: onEachFeature_illinois_counties,
    drawOnSetTime: true,
  });
  //illinois_counties_ts.addTo(map);

  illinois_counties_ts.on("add", function () {
    bins = colorClass.dph_illinois.case_per_100k_capita.nolog.NaturalBreaks.bins
      .split(",")
      .map(function (item) {
        return parseInt(item, 10);
      });
  });

  illinois_counties_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleFunc);
  });

  var illinois_change_ts = L.timeline(illinois_counties, {
    style: styleChange,
    waitToUpdateMap: true,
  });
  //illinois_change_ts.addTo(map);

  illinois_change_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleChange);
  });

  var us_states_ts = L.timeline(us_states, {
    style: styleFunc,
    waitToUpdateMap: true,
    onEachFeature: onEachFeature_us_states,
  });
  //us_states_ts.addTo(map);

  us_states_ts.on("add", function () {
    bins = colorClass.state.case_per_100k_capita.nolog.NaturalBreaks.bins
      .split(",")
      .map(function (item) {
        return parseInt(item, 10);
      });
  });

  us_states_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleFunc);
  });

  var us_states_change_ts = L.timeline(us_states, {
    style: styleChange,
    waitToUpdateMap: true,
  });
  //us_states_change_ts.addTo(map);

  us_states_change_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleChange);
  });

  var us_counties_ts = L.timeline(us_counties, {
    style: styleFunc,
    waitToUpdateMap: true,
    onEachFeature: onEachFeature_us_counties,
  });
  //us_counties_ts.addTo(map);

  us_counties_ts.on("add", function () {
    bins = colorClass.county.case_per_100k_capita.nolog.NaturalBreaks.bins
      .split(",")
      .map(function (item) {
        return parseInt(item, 10);
      });
  });

  us_counties_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleFunc);
  });

  var us_counties_change_ts = L.timeline(us_counties, {
    style: styleChange,
    waitToUpdateMap: true,
  });
  //us_counties_change_ts.addTo(map);

  us_counties_change_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleChange);
  });

  var world_ts = L.timeline(world, {
    style: styleFunc,
    waitToUpdateMap: true,
    onEachFeature: onEachFeature_world,
  });
  //world_ts.addTo(map);

  world_ts.on("add", function () {
    bins = colorClass.who_world.case_per_100k_capita.nolog.NaturalBreaks.bins
      .split(",")
      .map(function (item) {
        return parseInt(item, 10);
      });
  });

  world_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleFunc);
  });

  var world_change_ts = L.timeline(world, {
    style: styleChange,
    waitToUpdateMap: true,
  });
  //world_change_ts.addTo(map);

  world_change_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleChange);
  });

  var chicago_acc_i_ts = L.timeline(chicago_acc_i, {
    style: styleAcc,
    waitToUpdateMap: true,
  });
  //chicago_acc_i_ts.addTo(map);

  chicago_acc_i_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleAcc);
  });

  var chicago_acc_v_ts = L.timeline(chicago_acc_v, {
    style: styleAcc,
    waitToUpdateMap: true,
  });
  //chicago_acc_v_ts.addTo(map);

  chicago_acc_v_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleAcc);
  });

  var illinois_acc_i_ts = L.timeline(illinois_acc_i, {
    style: styleAcc,
    waitToUpdateMap: true,
  });
  //illinois_acc_i_ts.addTo(map);

  illinois_acc_i_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleAcc);
  });

  var illinois_acc_v_ts = L.timeline(illinois_acc_v, {
    style: styleAcc,
    waitToUpdateMap: true,
  });
  //illinois_acc_v_ts.addTo(map);

  illinois_acc_v_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleAcc);
  });

  var illinois_vul_ts = L.timeline(illinois_vulnerability, {
    style: styleVul,
    waitToUpdateMap: true,
  });
  //illinois_vul_ts.addTo(map);

  illinois_vul_ts.on("add", function () {
    bins = colorClass.vulnerability.case.nolog.NaturalBreaks.bins
      .split(",")
      .map(function (item) {
        return parseFloat(parseFloat(item).toFixed(2));
      });
  });

  illinois_vul_ts.on("change", function () {
    index = Math.floor((this.time - this.start) / DayInMilSec);
    this.setStyle(styleVul);
  });

  var activeAnimationLayer;
  var bins;
  var legend;

  var boundaryIllinois = [
    [-90.54179687500002, 42.43051037801457],
    [-90.54179687500002, 37.30787664699351],
    [-87.50957031250002, 37.30787664699351],
    [-87.50957031250002, 42.43051037801457],
  ];

  var boundaryUS = [
    [-127.52638302724817, 49.02551219307651],
    [-127.52638302724817, 25.148115576371765],
    [-66.35450802724817, 25.148115576371765],
    [-66.35450802724817, 49.02551219307651],
  ];

  // if (userState == 'Illinois')
  if (
    userLat < boundaryIllinois[0][1] &&
    userLat > boundaryIllinois[1][1] &&
    userLng < boundaryIllinois[2][0] &&
    userLng > boundaryIllinois[0][0]
  ) {
    illinois_counties_ts.addTo(map);
    activeAnimationLayer = illinois_counties_ts;
    bins = colorClass.dph_illinois.case_per_100k_capita.nolog.NaturalBreaks.bins
      .split(",")
      .map(function (item) {
        return parseInt(item, 10);
      });
    refreshLegend(illinois_counties_ts);
    map.setView([userLat, userLng], 9);
  } else if (
    userLat < boundaryUS[0][1] &&
    userLat > boundaryUS[1][1] &&
    userLng < boundaryUS[2][0] &&
    userLng > boundaryUS[0][0]
  ) {
    us_counties_ts.addTo(map);
    activeAnimationLayer = us_counties_ts;
    bins = colorClass.county.case_per_100k_capita.nolog.NaturalBreaks.bins
      .split(",")
      .map(function (item) {
        return parseInt(item, 10);
      });
    refreshLegend(us_counties_ts);
    map.setView([userLat, userLng], 6);
  } else {
    world_ts.addTo(map);
    activeAnimationLayer = world_ts;
    bins = colorClass.who_world.case_per_100k_capita.nolog.NaturalBreaks.bins
      .split(",")
      .map(function (item) {
        return parseInt(item, 10);
      });
    refreshLegend(world_ts);
    map.setView([userLat, userLng], 4);
  }

  // var activeAnimationLayer = illinois_vul_ts;
  slider.addTimelines(activeAnimationLayer);

  // Get the most recent map
  slider.setTime(slider.end);

  var animationLayerList = [
    illinois_counties_ts,
    illinois_change_ts,
    chicago_acc_i_ts,
    chicago_acc_v_ts,
    illinois_acc_i_ts,
    illinois_acc_v_ts,
    illinois_vul_ts,
    us_counties_ts,
    us_counties_change_ts,
    us_states_ts,
    us_states_change_ts,
    world_ts,
    world_change_ts,
  ];

  // var illinois_zipcode_static = L.geoJSON(illinois_zipcode,{style: styleFunc});

  var hiv_layer = L.esri.dynamicMapLayer({
    url:
      "https://dev.rmms.illinois.edu/iepa/rest/services/wherecovid19/HIV_Map/MapServer",
  });

  var svi_layer = L.esri.dynamicMapLayer({
    url:
      "https://dev.rmms.illinois.edu/iepa/rest/services/wherecovid19/SVI_2018/MapServer",
  });

  var testing_sites = L.esri.dynamicMapLayer({
    url:
      "https://dev.rmms.illinois.edu/iepa/rest/services/wherecovid19/Testing_Sites/MapServer",
  });

  function onOverlayAdd(e) {
    // Remove the chart if it exists
    document.getElementById("myChart").classList.add("d-none");
    document.getElementById("myChart").classList.remove("d-block");

    // Remove all previous timelines and the slider itself
    slider.removeTimelines(activeAnimationLayer);
    slider.remove();
    map.removeControl(legend);

    // Add back slider with right timeline and legend if it's animation layer
    animationLayerList.forEach(function (layer) {
      if (e.layer == layer) {
        slider.addTo(map);
        slider.addTimelines(e.layer);
        slider.setTime(slider.end);
        activeAnimationLayer = e.layer;
      }
    });

    refreshLegend(e.layer);
    //console.log(e);
    if (
      e.name == "Accessibility (ICU Beds-Chicago)" ||
      e.name == "Accessibility (Ventilators-Chicago)"
    ) {
      map.setView([41.87, -87.62], 10);
    } else if (e.group.name == "Illinois") {
      map.setView([40, -89], 7);
    } else if (e.group.name == "US") {
      map.setView([37, -96], 4);
    } else if (e.group.name == "World") {
      map.setView([0, 0], 2);
    }
    // timelineList.push(e.layer);
  }

  map.on("overlayadd", onOverlayAdd);
  // map.on('overlayremove', onOverlayRemove);

  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////// Create Legend ///////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  function refreshLegend(_layer) {
    if (legend != null) {
      map.removeControl(legend);
    }

    legend = L.control({ position: "bottomright" });

    binsAcc = ["low", "", "", "", "", "high"];
    binsChange = [
      "-50%",
      "-10%~-50%",
      "Steady (-10%~10%)",
      "+10%~+50%",
      "+50%",
    ];

    legend.onAdd = function (map) {
      var div = L.DomUtil.create("div", "info legend");

      label1 = ["<strong> Cases per 100k Population </strong>"];
      label2 = ["<strong> Vulnerability </strong>"];
      label3 = ["<strong> Accessibility </strong>"];
      label4 = ["<strong> Density </strong>"];
      label5 = ["<strong> Social Vulnerability Index </strong>"];
      label6 = ["<strong> Weekly Change Rate of New Cases </strong>"];

      // Changing the grades using unshift somehow also changes bins?
      //grades.unshift(0);
      var legendContent = "";

      // loop through our density intervals and generate a label with a colored square for each interval
      if (
        _layer == illinois_counties_ts ||
        _layer == us_counties_ts ||
        _layer == us_states_ts ||
        _layer == world_ts
      ) {
        grades = bins;
        for (var i = 0; i < grades.length; i++) {
          legendContent +=
            '<i style="background:' +
            getColorFor(grades[i] + 0.000001, bins) +
            '"></i> ' +
            grades[i] +
            (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+") +
            "<br>";
        }
        label1.push(legendContent);
        div.innerHTML = label1.join("<br><br><br>");
      } else if (_layer == illinois_vul_ts) {
        grades = bins;
        for (var i = 0; i < grades.length; i++) {
          legendContent +=
            '<i style="background:' +
            getVulColor(grades[i] + 0.000001, bins) +
            '"></i> ' +
            grades[i] +
            (grades[i + 1] ? "&ndash;" + grades[i + 1] + "<br>" : "+") +
            "<br>";
        }
        label2.push(legendContent);
        div.innerHTML = label2.join("<br><br><br>");
      } else if (
        _layer == chicago_acc_i_ts ||
        _layer == chicago_acc_v_ts ||
        _layer == illinois_acc_i_ts ||
        _layer == illinois_acc_v_ts
      ) {
        grades = binsAcc;
        for (var i = 0; i < grades.length; i++) {
          legendContent +=
            '<i style="background:' +
            getAccColor(i - 0.1) +
            '"></i> ' +
            grades[i] +
            (grades[i + 1] != undefined ? "<br>" : "") +
            "<br>";
        }
        label3.push(legendContent);
        div.innerHTML = label3.join("<br><br><br>");
      } else if (_layer == hiv_layer) {
        grades = binsAcc;
        for (var i = 0; i < grades.length; i++) {
          legendContent +=
            '<i style="background:' +
            getAccColor(i - 0.1) +
            '"></i> ' +
            grades[i] +
            (grades[i + 1] != undefined ? "<br>" : "") +
            "<br>";
        }
        label4.push(legendContent);
        div.innerHTML = label4.join("<br><br><br>");
      } else if (_layer == svi_layer) {
        grades = binsAcc;
        for (var i = 0; i < grades.length; i++) {
          legendContent +=
            '<i style="background:' +
            getAccColor(i - 0.1) +
            '"></i> ' +
            grades[i] +
            (grades[i + 1] != undefined ? "<br>" : "") +
            "<br>";
        }
        label5.push(legendContent);
        div.innerHTML = label5.join("<br><br><br>");
      } else if (
        _layer == illinois_change_ts ||
        _layer == us_counties_change_ts ||
        _layer == us_states_change_ts ||
        _layer == world_change_ts
      ) {
        grades = binsChange;
        var binsChangeValue = [-1, -0.4, 0, 0.4, 1];
        for (var i = 0; i < grades.length; i++) {
          legendContent +=
            '<i style="background:' +
            getChangeColor(binsChangeValue[i]) +
            '"></i> ' +
            grades[i] +
            (grades[i + 1] != undefined ? "<br>" : "") +
            "<br>";
        }
        label6.push(legendContent);
        div.innerHTML = label6.join("<br><br><br>");
      }

      return div;
    };

    legend.addTo(map);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////// Create Popup ///////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  function createPopup(_feature, _layer) {
    if (_feature.properties.state_name != undefined) {
      var popupName =
        _feature.properties.NAME + ", " + _feature.properties.state_name;
    } else {
      var popupName = _feature.properties.NAME;
    }
    _layer.bindPopup(
      '<form id="popup-form">\
        <label id="name">' +
        popupName +
        '</label>\
        <table class="popup-table">\
            <tr class="popup-table-row">\
            <th class="popup-table-header">Total Cases:</th>\
            <td id="total_cases" class="popup-table-data">' +
        _feature.properties.today_case +
        '</td>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header">Total Deaths:</th>\
            <td id="total_deaths" class="popup-table-data">' +
        _feature.properties.today_death +
        '</td>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header">Population:</th>\
            <td id="population" class="popup-table-data">' +
        _feature.properties.population +
        '</td>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header">First Date of Confirmed Cases</th>\
            <td id="first_date_case" class="popup-table-data">' +
        _feature.properties.dt_first_case +
        '</td>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header">First Date of Deaths</th>\
            <td id="first_date_death" class="popup-table-data">' +
        _feature.properties.dt_first_death +
        "</td>\
            </tr>\
        </table>\
        </form>"
    );
  }

  function onEachFeature_illinois_counties(feature, layer) {
    if (feature.properties) {
      createPopup(feature, layer);
      layer.on("click", function (e) {
        index = Math.floor(
          (illinois_counties_ts.time - illinois_counties_ts.start) / DayInMilSec
        );
        illinois_counties_ts.setStyle(styleFunc);
        onMapClick(e);
      });
    }
  }

  function onEachFeature_us_counties(feature, layer) {
    if (feature.properties) {
      createPopup(feature, layer);
      layer.on("click", function (e) {
        index = Math.floor(
          (us_counties_ts.time - us_counties_ts.start) / DayInMilSec
        );
        us_counties_ts.setStyle(styleFunc);
        onMapClick(e);
      });
    }
  }
  // Need to make it changable with time (use index of cases_ts)

  function onEachFeature_us_states(feature, layer) {
    if (feature.properties) {
      createPopup(feature, layer);
      layer.on("click", function (e) {
        index = Math.floor(
          (us_states_ts.time - us_states_ts.start) / DayInMilSec
        );
        us_states_ts.setStyle(styleFunc);
        onMapClick(e);
      });
    }
  }

  function onEachFeature_world(feature, layer) {
    if (feature.properties) {
      createPopup(feature, layer);
      layer.on("click", function (e) {
        index = Math.floor((world_ts.time - world_ts.start) / DayInMilSec);
        world_ts.setStyle(styleFunc);
        onMapClick(e);
      });
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Highlight when clicking /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  var highlight = {
    //'color': '#00fbff',
    fillColor: "#00fbff",
    weight: 2,
    fillOpacity: 0.7,
  };

  function onMapClick(e) {
    e.target.setStyle(highlight);

    // Add d-block class and remove d-none to display the chart
    if (window.bar != undefined) {
      window.bar.destroy();
    }
    document.getElementById("myChart").classList.add("d-block");
    document.getElementById("myChart").classList.remove("d-none");
    updateChart(e.target.feature);
  }

  // Need to cancel highlight when select another feature

  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////// Add base maps and overlay maps //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  var baseMaps = {
    "Light Mode": osm,
    "Dark Mode": CartoDB_DarkMatter,
  };

  var groupedOverlays = {
    Illinois: {
      Vulnerability: illinois_vul_ts,
      "IDPH County-level Cases": illinois_counties_ts,
      "Illinois Weekly Average Change": illinois_change_ts,
      "Accessibility (ICU Beds-Chicago)": chicago_acc_i_ts,
      "Accessibility (Ventilators-Chicago)": chicago_acc_v_ts,
      "Accessibility (ICU Beds-State)": illinois_acc_i_ts,
      "Accessibility (Ventilators-State)": illinois_acc_v_ts,
      // "IDPH Zipcode-level Cases": illinois_zipcode_static,
      "Density of PLWH (Persons Living with HIV)": hiv_layer,
      "CDC Social Vulnerability Index": svi_layer,
      "Testing Sites": testing_sites,
    },
    US: {
      "US States": us_states_ts,
      "US State-level Weekly Average Change": us_states_change_ts,
      "US Counties": us_counties_ts,
      "US County-level Weekly Average Change": us_counties_change_ts,
    },
    World: {
      World: world_ts,
      "World Weekly Average Change": world_change_ts,
    },
  };

  var options = {
    // Make the groups exclusive (use radio inputs)
    exclusiveGroups: ["Illinois", "US", "World"],
    // Show a checkbox next to non-exclusive group labels for toggling all
    groupCheckboxes: true,
  };

  // Use the custom grouped layer control, not "L.control.layers"
  var layerControl = L.control.groupedLayers(
    baseMaps,
    groupedOverlays,
    options
  );
  map.addControl(layerControl);

  // L.control.layers(baseMaps).addTo(map);
  // L.control.layers(overlayMaps).addTo(map);

  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////// Handle side panel ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  map.whenReady(function () {
    let tab = document.getElementById("illinois-tab");

    let illinois_table = document
      .getElementById("illinois-table")
      .querySelector("tbody");
    let template = document.querySelector("template");

    let result_list = illinois_counties.features.map(function (value, index) {
      return {
        centroid_x: turf.centroid(value.geometry).geometry.coordinates[0],
        centroid_y: turf.centroid(value.geometry).geometry.coordinates[1],
        uid: value.properties.OBJECTID,
        county: value.properties.NAME,
        case: value.properties.today_case,
        new_case: value.properties.today_new_case,
        death: value.properties.today_death,
        new_death: value.properties.today_new_death,
        tested: value.properties.today_tested,
        new_tested: value.properties.today_new_tested,
      };
    });

    //console.log(result_list);

    result_list.forEach(function (value) {
      let instance = template.content.cloneNode(true);

      if (value.county == "Illinois") {
        tab.querySelectorAll("span")[0].innerHTML = numberWithCommas(
          value.case
        );
        let case_div = document.getElementById("illinois_total_case_number");
        let death_div = document.getElementById("illinois_total_death_number");
        let test_div = document.getElementById("illinois_total_test_number");
        case_div.querySelector(".case-number").innerHTML = numberWithCommas(
          value.case
        );
        case_div.querySelector(".change").innerHTML =
          "<i class='fas fa-caret-up'></i> " + numberWithCommas(value.new_case);
        death_div.querySelector(".case-number").innerHTML = numberWithCommas(
          value.death
        );
        death_div.querySelector(".change").innerHTML =
          "<i class='fas fa-caret-up'></i> " +
          numberWithCommas(value.new_death);
        test_div.querySelector(".case-number").innerHTML = numberWithCommas(
          value.tested
        );
        test_div.querySelector(".change").innerHTML =
          "<i class='fas fa-caret-up'></i> " +
          numberWithCommas(value.new_tested);
      } else {
        instance.querySelector("th").innerHTML = value.county;
        instance.querySelector("th").setAttribute("data-x", value.centroid_x);
        instance.querySelector("th").setAttribute("data-y", value.centroid_y);
        instance.querySelector("th").setAttribute("data-uid", value.uid);
        instance.querySelector("th").setAttribute("data-county", value.county);

        instance.querySelector(".confirmed").innerHTML =
          "<span>" +
          numberWithCommas(value.case) +
          '</span><br><i class="fas fa-caret-up"></i> ' +
          numberWithCommas(value.new_case);
        instance.querySelector(".death").innerHTML =
          "<span>" +
          numberWithCommas(value.death) +
          '</span><br><i class="fas fa-caret-up"></i> ' +
          numberWithCommas(value.new_death);
        instance.querySelector(".tested").innerHTML =
          "<span>" +
          numberWithCommas(value.tested) +
          '</span><br><i class="fas fa-caret-up"></i> ' +
          numberWithCommas(value.new_tested);
        instance
          .querySelector(".confirmed")
          .setAttribute("data-order", value.case);
        instance
          .querySelector(".death")
          .setAttribute("data-order", value.death);
        instance
          .querySelector(".tested")
          .setAttribute("data-order", value.tested);
        illinois_table.appendChild(instance);
      }
    });

    var il_table = $("#illinois-table").DataTable({
      paging: true,
      pagingType: "simple_numbers",
      pageLength: 50,
      ordering: true,
      order: [[1, "desc"]],
      info: false,
      responsive: true,
      dom: "pt",
    });

    $("#il-search-input").on("input", function () {
      console.log($("#il-search-input").val());
      il_table.search($("#il-search-input").val()).draw();
    });
  });

  var sum_us_counties_today_case = 0;
  var sum_us_counties_today_death = 0;
  var sum_us_counties_today_new_case = 0;
  var sum_us_counties_today_new_death = 0;

  map.whenReady(function () {
    let counties_table = document
      .getElementById("county-table")
      .querySelector("tbody");
    let template = document.querySelectorAll("template")[1];

    let result_list = us_counties.features.map(function (value, index) {
      return {
        centroid_x: turf.centroid(value.geometry).geometry.coordinates[0],
        centroid_y: turf.centroid(value.geometry).geometry.coordinates[1],
        uid: value.properties.OBJECTID,
        county: value.properties.NAME,
        state: value.properties.state_name,
        case: value.properties.today_case,
        new_case: value.properties.today_new_case,
        death: value.properties.today_death,
        new_death: value.properties.today_new_death,
      };
    });

    //console.log(result_list);

    result_list.forEach(function (value) {
      let instance = template.content.cloneNode(true);

      instance.querySelector("th").innerHTML =
        value.county + ", " + value.state;
      instance.querySelector("th").setAttribute("data-x", value.centroid_x);
      instance.querySelector("th").setAttribute("data-y", value.centroid_y);
      instance.querySelector("th").setAttribute("data-uid", value.uid);
      instance.querySelector("th").setAttribute("data-county", value.county);
      instance.querySelector("th").setAttribute("data-state", value.state);
      instance.querySelector(".confirmed").innerHTML =
        "<span>" +
        numberWithCommas(value.case) +
        '</span><br><i class="fas fa-caret-up"></i> ' +
        numberWithCommas(value.new_case);
      instance.querySelector(".death").innerHTML =
        "<span>" +
        numberWithCommas(value.death) +
        '</span><br><i class="fas fa-caret-up"></i> ' +
        numberWithCommas(value.new_death);
      instance
        .querySelector(".confirmed")
        .setAttribute("data-order", value.case);
      instance.querySelector(".death").setAttribute("data-order", value.death);
      counties_table.appendChild(instance);

      sum_us_counties_today_case += value.case;
      sum_us_counties_today_death += value.death;
      sum_us_counties_today_new_case += value.new_case;
      sum_us_counties_today_new_death += value.new_death;
    });

    let tab = document.getElementById("county-tab");
    tab.querySelectorAll("span")[0].innerHTML = numberWithCommas(
      sum_us_counties_today_case
    );
    let case_div = document.getElementById("counties_total_case_number");
    let death_div = document.getElementById("counties_total_death_number");
    case_div.querySelector(".case-number").innerHTML = numberWithCommas(
      sum_us_counties_today_case
    );
    case_div.querySelector(".change").innerHTML =
      "<i class='fas fa-caret-up'></i> " +
      numberWithCommas(sum_us_counties_today_new_case);
    death_div.querySelector(".case-number").innerHTML = numberWithCommas(
      sum_us_counties_today_death
    );
    death_div.querySelector(".change").innerHTML =
      "<i class='fas fa-caret-up'></i> " +
      numberWithCommas(sum_us_counties_today_new_death);

    var county_table = $("#county-table").DataTable({
      paging: true,
      pagingType: "simple_numbers",
      pageLength: 50,
      ordering: true,
      order: [[1, "desc"]],
      info: false,
      responsive: true,
      dom: "pt",
    });

    $("#w-search-input").on("input", function () {
      console.log($("#w-search-input").val());
      county_table.search($("#w-search-input").val()).draw();
    });
  });

  var sum_world_today_case = 0;
  var sum_world_today_death = 0;
  var sum_world_today_new_case = 0;
  var sum_world_today_new_death = 0;

  map.whenReady(function () {
    let worlds_table = document
      .getElementById("world-table")
      .querySelector("tbody");
    let template = document.querySelectorAll("template")[1];

    let result_list = world.features.map(function (value, index) {
      return {
        centroid_x: turf.centroid(value.geometry).geometry.coordinates[0],
        centroid_y: turf.centroid(value.geometry).geometry.coordinates[1],
        uid: value.properties.OBJECTID,
        country: value.properties.NAME,
        case: value.properties.today_case,
        new_case: value.properties.today_new_case,
        death: value.properties.today_death,
        new_death: value.properties.today_new_death,
      };
    });

    //console.log(result_list);

    result_list.forEach(function (value) {
      let instance = template.content.cloneNode(true);

      instance.querySelector("th").innerHTML = value.country;
      instance.querySelector("th").setAttribute("data-x", value.centroid_x);
      instance.querySelector("th").setAttribute("data-y", value.centroid_y);
      instance.querySelector("th").setAttribute("data-country", value.country);
      instance.querySelector(".confirmed").innerHTML =
        "<span>" +
        numberWithCommas(value.case) +
        '</span><br><i class="fas fa-caret-up"></i> ' +
        numberWithCommas(value.new_case);
      instance.querySelector(".death").innerHTML =
        "<span>" +
        numberWithCommas(value.death) +
        '</span><br><i class="fas fa-caret-up"></i> ' +
        numberWithCommas(value.new_death);
      instance
        .querySelector(".confirmed")
        .setAttribute("data-order", value.case);
      instance.querySelector(".death").setAttribute("data-order", value.death);
      worlds_table.appendChild(instance);

      sum_world_today_case += value.case;
      sum_world_today_death += value.death;
      sum_world_today_new_case += value.new_case;
      sum_world_today_new_death += value.new_death;
    });

    let tab = document.getElementById("world-tab");
    tab.querySelectorAll("span")[0].innerHTML = numberWithCommas(
      sum_world_today_case
    );
    let case_div = document.getElementById("world_total_case_number");
    let death_div = document.getElementById("world_total_death_number");
    case_div.querySelector(".case-number").innerHTML = numberWithCommas(
      sum_world_today_case
    );
    case_div.querySelector(".change").innerHTML =
      "<i class='fas fa-caret-up'></i> " +
      numberWithCommas(sum_world_today_new_case);
    death_div.querySelector(".case-number").innerHTML = numberWithCommas(
      sum_world_today_death
    );
    death_div.querySelector(".change").innerHTML =
      "<i class='fas fa-caret-up'></i> " +
      numberWithCommas(sum_world_today_new_death);

    var world_table = $("#world-table").DataTable({
      paging: true,
      pagingType: "simple_numbers",
      pageLength: 50,
      ordering: true,
      order: [[1, "desc"]],
      info: false,
      responsive: true,
      dom: "pt",
    });

    $("#world-search-input").on("input", function () {
      console.log($("#world-search-input").val());
      world_table.search($("#world-search-input").val()).draw();
    });
  });

  ///////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////Handle Table clicking//////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  var highlight;

  /// illinois Table
  document
    .querySelector("#illinois-table tbody")
    .addEventListener("click", function (event) {
      if (map.hasLayer(illinois_counties_ts) != true) {
        map.eachLayer(function (layer) {
          if (layer._url == undefined) {
            map.removeLayer(layer);
          }
        });
        map.addLayer(illinois_counties_ts);
      }

      var tr = event.target;
      while (tr !== this && !tr.matches("tr")) {
        tr = tr.parentNode;
      }
      if (tr === this) {
        console.log("No table cell found");
      } else {
        long = parseFloat(tr.firstElementChild.dataset.x);
        lat = parseFloat(tr.firstElementChild.dataset.y);
        objID = parseFloat(tr.firstElementChild.dataset.uid);
        countyName = tr.firstElementChild.dataset.county;

        illinois_counties_ts.eachLayer(function (value) {
          if (value.feature.properties.NAME == countyName) {
            illinois_counties_ts.setStyle(styleFunc);
            value.setStyle(highlight);
            map.setView([lat, long], 9);
            updateChart(value.feature);
          }
        });
      }
    });

  /// US Table
  document
    .querySelector("#county-table tbody")
    .addEventListener("click", function (event) {
      if (map.hasLayer(us_counties_ts) != true) {
        map.eachLayer(function (layer) {
          if (layer._url == undefined) {
            map.removeLayer(layer);
          }
        });
        map.addLayer(us_counties_ts);
      }

      var tr = event.target;
      while (tr !== this && !tr.matches("tr")) {
        tr = tr.parentNode;
      }
      if (tr === this) {
        console.log("No table cell found");
      } else {
        long = parseFloat(tr.firstElementChild.dataset.x);
        lat = parseFloat(tr.firstElementChild.dataset.y);
        objID = parseFloat(tr.firstElementChild.dataset.uid);
        countyName = tr.firstElementChild.dataset.county;
        stateName = tr.firstElementChild.dataset.state;

        us_counties_ts.eachLayer(function (value) {
          if (
            value.feature.properties.NAME == countyName &&
            value.feature.properties.state_name == stateName
          ) {
            us_counties_ts.setStyle(styleFunc);
            value.setStyle(highlight);
            map.setView([lat, long], 9);
            updateChart(value.feature);
          }
        });
      }
    });

  /// World Table
  document
    .querySelector("#world-table tbody")
    .addEventListener("click", function (event) {
      if (map.hasLayer(world_ts) != true) {
        map.eachLayer(function (layer) {
          if (layer._url == undefined) {
            map.removeLayer(layer);
          }
        });
        map.addLayer(world_ts);
      }

      var tr = event.target;
      while (tr !== this && !tr.matches("tr")) {
        tr = tr.parentNode;
      }
      if (tr === this) {
        console.log("No table cell found");
      } else {
        long = parseFloat(tr.firstElementChild.dataset.x);
        lat = parseFloat(tr.firstElementChild.dataset.y);
        objID = parseFloat(tr.firstElementChild.dataset.uid);
        countryName = tr.firstElementChild.dataset.country;

        world_ts.eachLayer(function (value) {
          if (value.feature.properties.NAME == countryName) {
            world_ts.setStyle(styleFunc);
            value.setStyle(highlight);
            map.setView([lat, long], 4);
            updateChart(value.feature);
          }
        });
      }
    });

  //Set default layers after clicking side panels
  document
    .getElementById("illinois-tab")
    .addEventListener("click", function (event) {
      if (map.hasLayer(illinois_counties_ts) != true) {
        map.eachLayer(function (layer) {
          if (layer._url == undefined) {
            map.removeLayer(layer);
          }
        });
        map.addLayer(illinois_counties_ts);
      }
    });

  document
    .getElementById("county-tab")
    .addEventListener("click", function (event) {
      if (map.hasLayer(us_counties_ts) != true) {
        map.eachLayer(function (layer) {
          if (layer._url == undefined) {
            map.removeLayer(layer);
          }
        });
        map.addLayer(us_counties_ts);
      }
    });

  document
    .getElementById("world-tab")
    .addEventListener("click", function (event) {
      if (map.hasLayer(world_ts) != true) {
        map.eachLayer(function (layer) {
          if (layer._url == undefined) {
            map.removeLayer(layer);
          }
        });
        map.addLayer(world_ts);
      }
    });
  ///////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// Handle chart update //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

  function updateChart(graphic) {
    Chart.defaults.global.defaultFontSize = 12;
    Chart.defaults.global.defaultFontColor = "#777";

    var datasetList = [];

    var CasesArrayStr = graphic.properties.cases_ts.split(",");
    var CasesArray = CasesArrayStr.map(Number);

    // Fix negative numbers of increased cases

    for (k = CasesArray.length - 1; k > 0; k--) {
      if (CasesArray[k - 1] > CasesArray[k]) {
        CasesArray[k - 1] = CasesArray[k];
      }
    }

    var IncreasedCases = [];
    var averageWeeklyCases = [];

    for (i = 1; i < CasesArray.length; i++) {
      IncreasedCases.push(CasesArray[i] - CasesArray[i - 1]);
    }
    IncreasedCases.unshift(0);

    for (i = 0; i < IncreasedCases.length; i++) {
      if (i < 6) {
        averageWeeklyCases.push(IncreasedCases[i]);
      } else {
        averageWeeklyCases.push(
          Math.round(
            (IncreasedCases[i] +
              IncreasedCases[i - 1] +
              IncreasedCases[i - 2] +
              IncreasedCases[i - 3] +
              IncreasedCases[i - 4] +
              IncreasedCases[i - 5] +
              IncreasedCases[i - 6]) /
              7
          )
        );
      }
    }

    var ExtendedCasesArray = CasesArray.slice(0);
    ExtendedCasesArray.unshift(0, 0, 0, 0, 0, 0, 0);

    var ExtendedIncreasedCases = IncreasedCases.slice(0);
    ExtendedIncreasedCases.unshift(0, 0, 0, 0, 0, 0, 0);

    var ExtendedAverageWeeklyCases = averageWeeklyCases.slice(0);
    ExtendedAverageWeeklyCases.unshift(0, 0, 0, 0, 0, 0, 0);

    var firstCaseIndex = ExtendedCasesArray.findIndex((val) => val > 0);
    SlicedCasesArray = ExtendedCasesArray.slice(firstCaseIndex);
    SlicedIncreasedCases = ExtendedIncreasedCases.slice(firstCaseIndex);
    SlicedAverageWeeklyCases = ExtendedAverageWeeklyCases.slice(firstCaseIndex);

    if (graphic.properties.deaths_ts != undefined) {
      var DeathsArrayStr = graphic.properties.deaths_ts.split(",");
      var DeathsArray = DeathsArrayStr.map(Number);

      // Fix negative numbers of increased cases

      for (k = DeathsArray.length - 1; k > 0; k--) {
        if (DeathsArray[k - 1] > DeathsArray[k]) {
          DeathsArray[k - 1] = DeathsArray[k];
        }
      }

      var IncreasedDeaths = [];
      for (i = 1; i < DeathsArray.length; i++) {
        IncreasedDeaths.push(DeathsArray[i] - DeathsArray[i - 1]);
      }
      IncreasedDeaths.unshift(0);

      var ExtendedDeathsArray = DeathsArray.slice(0);
      ExtendedDeathsArray.unshift(0, 0, 0, 0, 0, 0, 0);

      var ExtendedIncreasedDeaths = IncreasedDeaths.slice(0);
      ExtendedIncreasedDeaths.unshift(0, 0, 0, 0, 0, 0, 0);

      SlicedDeathsArray = ExtendedDeathsArray.slice(firstCaseIndex);
      SlicedIncreasedDeaths = ExtendedIncreasedDeaths.slice(firstCaseIndex);
    }

    var LabelDates = [];
    if (graphic.properties.start == "2020-03-17") {
      var LabelDate = new Date(2020, 2, 9);
    } else if (graphic.properties.start == "2020-01-11") {
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
      getLinePosition: function (chart, pointIndex) {
        const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
        const data = meta.data;
        return data[pointIndex]._model.x;
      },
      renderVerticalLine: function (chartInstance, pointIndex) {
        const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
        const scale = chartInstance.scales["y-axis-0"];
        const context = chartInstance.chart.ctx;

        // render vertical line
        context.beginPath();
        context.strokeStyle = "#ffffff";
        context.setLineDash([10, 5]);
        context.moveTo(lineLeftOffset, scale.top);
        context.lineTo(lineLeftOffset, scale.bottom);
        context.stroke();

        // write label
        context.fillStyle = "#ffffff";
        context.textAlign = "right";
        //context.fillText('Current Day ', lineLeftOffset, (scale.bottom - scale.top) / 2 + scale.top);
      },

      afterDatasetsDraw: function (chart, easing) {
        if (chart.config.lineAtIndex) {
          chart.config.lineAtIndex.forEach((pointIndex) =>
            this.renderVerticalLine(chart, pointIndex)
          );
        }
      },
    };

    Chart.plugins.register(verticalLinePlugin);

    dic1 = {
      data: SlicedCasesArray,
      label: "Total Cases ",
      backgroundColor: "#ffab24",
      borderColor: "#ffab24",
      fill: true,
      hidden: true,
    };
    dic2 = {
      data: SlicedIncreasedCases,
      label: "Daily Cases ",
      backgroundColor: "#f25100",
      borderColor: "#f25100",
      fill: true,
      hidden: false,
    };

    if (graphic.properties.deaths_ts != undefined) {
      dic3 = {
        data: SlicedDeathsArray,
        label: "Total Deaths ",
        backgroundColor: "#a10025",
        borderColor: "#a10025",
        fill: true,
        hidden: true,
      };
      dic4 = {
        data: SlicedIncreasedDeaths,
        label: "Daily Deaths ",
        backgroundColor: "#6a28c7",
        borderColor: "#6a28c7",
        fill: true,
        hidden: true,
      };
    }

    dic5 = {
      data: SlicedAverageWeeklyCases,
      label: "7-Day Average New Cases ",
      type: "line",
      borderColor: "#fed8b1",
      pointStyle: "circle",
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
      fill: false,
      hidden: false,
    };

    if (graphic.properties.cases_ts != undefined) {
      datasetList.push(dic5);
      datasetList.push(dic2);
      datasetList.push(dic1);
    }

    if (graphic.properties.deaths_ts != undefined) {
      datasetList.push(dic4);
      datasetList.push(dic3);
    }

    if (window.bar != undefined) {
      window.bar.destroy();
    }

    window.bar = new Chart(myChart, {
      type: "bar",
      data: {
        labels: SlicedLabelDates,
        datasets: datasetList,
      },
      options: {
        title: {
          display: false,
          text: "COVID19 Time Series",
          fontSize: 15,
        },
        legend: {
          position: "top",
          fullWidth: true,
          labels: {
            fontSize: 12,
          },
        },
        fontSize: 12,
        responsive: true,
        maintainAspectRatio: false,
      },
      //lineAtIndex: [slider.values[0]-firstCaseIndex],
      animation: {
        duration: 0,
      },
      responsiveAnimationDuration: 0,
    });

    // Prevent the animation of redrawing the chart
    window.bar.update(0);
  }
}
