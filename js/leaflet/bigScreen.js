///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Variables ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////// Set up Basemaps /////////////////////////////////////

var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

var il_weekly_case_layer_object = null;
var us_county_weekly_case_layer_object = null;
var us_state_weekly_case_layer_object = null;
var world_weekly_case_layer_object = null;

//////////////////////////////////// Load GeoJSON File ////////////////////////////////////

class_json_url = "preprocessing/classes.json";
var class_json_obj = null;

/////////////////////////////// Define Color Schema And Bins //////////////////////////////

var bins = null;
var index = 0;
const DayInMilSec = 60 * 60 * 24 * 1000;
const TwoWeeksInMilSec = 14 * DayInMilSec;

///////////////////////////////////// Handle Left Panel ///////////////////////////////////

var sum_illinois_today_case = 0;
var sum_illinois_today_death = 0;
var sum_illinois_today_tested = 0;
var sum_illinois_today_new_case = 0;
var sum_illinois_today_new_death = 0;
var sum_illinois_today_new_tested = 0;

var sum_us_counties_today_case = 0;
var sum_us_counties_today_death = 0;
var sum_us_counties_today_new_case = 0;
var sum_us_counties_today_new_death = 0;

var sum_world_today_case = 0;
var sum_world_today_death = 0;
var sum_world_today_new_case = 0;
var sum_world_today_new_death = 0;

var arrowHTML = '<i class="fas fa-caret-up" aria-hidden="true"></i>';

var highlight = {
    'color': '#00fbff',
    'weight': 3,
    'Opacity': 1
};

////////////////////////////////////// Create Legend //////////////////////////////////////

var legend = null;
var chartTitle = "";

////////////////////////////////////// Setup zooming //////////////////////////////////////

var illinois_bounds = [];
var us_bounds = [];
var world_bounds = [];

////////////////////////////////////// Setup cycles //////////////////////////////////////

var scene_play_counter = 0;
var scene_playing = false;
var active_scene_layer = null;

///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Functions ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////// Setup Layer Style ////////////////////////////////////

var styleChange = function(_data) {
    return {
        stroke: true,
        weight: 1,
        color: "gray",
        fillColor: getChangeColor(splitStrFloat(_data.properties.change_ts, index), bins),
        fillOpacity: 0.5
    }
}

///////////////////////////////////// Define Layerlist ////////////////////////////////////

var layer_info_list = [{
        "name": "il_weekly_case",
        "display_name": "Illinois Weekly Average Change",
        "geojson_url": "preprocessing/illinois/dph_county_data.geojson",
        "category": "Illinois",
        "show": false,
        "style_func": styleChange,
        "animation": true,
        "highlightArea": "Champaign",
        "tabpage_id": "#illinois-tab",
        "zoom_center": [39, -89],
        "zoom_level": 6.5,
        "panel_id": "#illinois-data",
        "chartTitle": "Champaign County, IL",
    },
    {
        "name": "us_state_weekly_case",
        "display_name": "US State-level Weekly Average Change",
        "geojson_url": "preprocessing/nyt_states_data.geojson",
        "category": "US",
        "show": false,
        "style_func": styleChange,
        "animation": true,
        "highlightArea": "Illinois",
        "tabpage_id": "#county-tab",
        "zoom_center": [35, -96],
        "zoom_level": 4,
        "panel_id": "#us-data",
        "chartTitle": "Illinois State",
    },
    {
        "name": "world_weekly_case",
        "display_name": "World Weekly Average Change",
        "geojson_url": "preprocessing/worldwide/who_world_data.geojson",
        "category": "World",
        "show": false,
        "style_func": styleChange,
        "animation": true,
        "highlightArea": "United States",
        "tabpage_id": "#world-tab",
        "zoom_center": [0, 0],
        "zoom_level": 2,
        "panel_id": "#world-data",
        "chartTitle": "United States",
    },
];

var getLayerInfo = function(name, field = "name") {

    for (i = 0; i < layer_info_list.length; i++) {
        if (name == layer_info_list[i][field]) {
            return layer_info_list[i];
        }
    }

    return null;

}

//////////////////////////////////// Load GeoJSON File ////////////////////////////////////

var loadClassJson = function(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log(url);
                class_json_obj = data;
                resolve();
            },
            error: function(error) {
                reject(error);
            },
        })
    })
}

var load_geojson_promise = function(layer_info) {
    return new Promise((resolve, reject) => {
        if (layer_info["esri_url"] != undefined) {
            resolve(layer_info);
        } else {

            $.ajax({
                url: layer_info.geojson_url,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    console.log("Downloading " + layer_info.geojson_url);
                    // Compare newly loaded geojson obj
                    // Update layer_info.geojson_obj if it changed
                    // Update a flag in layer_info to indicare whether geojson_obj has changed
                    if (JSON.stringify(layer_info.geojson_obj) != JSON.stringify(data)) {
                        layer_info.geojson_obj = data;
                        layer_info.geojson_updated = true;
                    } else {
                        layer_info.geojson_updated = false;
                    }

                    resolve(layer_info);
                },
                error: function(error) {
                    reject(error);
                },
            })

        }

    })
}

var add_animation_layer_to_map_promise = function(layer_info) {
    return new Promise((resolve, reject) => {
        add_animation_layer_to_map(layer_info);
        resolve();
    })
}

////////////////////////////////// Add Data To Left Panel /////////////////////////////////

var numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var fill_left_panel_il = function(geojson) {

    let result_list = geojson.features.map(function(value, index) {
        return {
            centroid_x: turf.centroid(value.geometry).geometry.coordinates[0],
            centroid_y: turf.centroid(value.geometry).geometry.coordinates[1],
            bounds: value.geometry.coordinates,
            uid: value.properties.OBJECTID,
            county: value.properties.NAME,
            case: value.properties.today_case,
            new_case: value.properties.today_new_case,
            death: value.properties.today_death,
            new_death: value.properties.today_new_death,
            tested: value.properties.today_tested,
            new_tested: value.properties.today_new_tested
        }
    });

    result_list.forEach(function(value) {

        if (value.county == "Illinois") {

            sum_illinois_today_case = value.case;
            sum_illinois_today_death = value.death;
            sum_illinois_today_tested = value.tested;
            sum_illinois_today_new_case = value.new_case;
            sum_illinois_today_new_death = value.new_death;
            sum_illinois_today_new_tested = value.new_tested;

            // fill numbers in the pane
            $('#illinois-data .confirmed .data-number').text(numberWithCommas(value.case));
            $('#illinois-data .death .data-number').text(numberWithCommas(value.death));
            $('#illinois-data .tested .data-number').text(numberWithCommas(value.tested));

            $('#illinois-data .confirmed .change').html(arrowHTML + numberWithCommas(value.new_case));
            $('#illinois-data .death .change').html(arrowHTML + numberWithCommas(value.new_death));
            $('#illinois-data .tested .change').html(arrowHTML + numberWithCommas(value.new_tested));
        }
    })
}

var fill_left_panel_us = function(geojson) {

    let result_list = geojson.features.map(function(value, index) {
        if (value.properties.NAME == "Illinois") {
            let bounds = value.geometry.coordinates;
            // console.log(bounds.length);
            // console.log(bounds[0].length);
            for (i = 0; i < bounds[0].length; i++) {
                illinois_bounds.push([bounds[0][i][1], bounds[0][i][0]]);
            }
        }
        return {
            centroid_x: turf.centroid(value.geometry).geometry.coordinates[0],
            centroid_y: turf.centroid(value.geometry).geometry.coordinates[1],
            bounds: value.geometry.coordinates,
            uid: value.properties.OBJECTID,
            // county: value.properties.NAME,
            // state: value.properties.state_name,
            state: value.properties.NAME,
            case: value.properties.today_case,
            new_case: value.properties.today_new_case,
            death: value.properties.today_death,
            new_death: value.properties.today_new_death,
        }
    });

    result_list.forEach(function(value) {

        sum_us_counties_today_case += value.case;
        sum_us_counties_today_death += value.death;
        sum_us_counties_today_new_case += value.new_case;
        sum_us_counties_today_new_death += value.new_death;

        // fill numbers in the pane
        $('#us-data .confirmed .data-number').text(numberWithCommas(sum_us_counties_today_case));
        $('#us-data .death .data-number').text(numberWithCommas(sum_us_counties_today_death));

        $('#us-data .confirmed .change').html(arrowHTML + numberWithCommas(sum_us_counties_today_new_case));
        $('#us-data .death .change').html(arrowHTML + numberWithCommas(sum_us_counties_today_new_death));
    })
}

var fill_left_panel_world = function(geojson) {

    let result_list = geojson.features.map(function(value, index) {
        if (value.properties.NAME == "United States") {
            let bounds = value.geometry.coordinates;
            // console.log(bounds.length);
            // console.log(bounds[0].length);
            // console.log(bounds[0][0].length);
            for (j = 0; j < bounds.length; j++) {
                for (i = 0; i < bounds[0][0].length; i++) {
                    us_bounds.push([bounds[0][0][i][1], bounds[0][0][i][0]]);
                }
            }
            // console.log(us_bounds);
        }
        return {
            centroid_x: turf.centroid(value.geometry).geometry.coordinates[0],
            centroid_y: turf.centroid(value.geometry).geometry.coordinates[1],
            bounds: value.geometry.coordinates,
            uid: value.properties.OBJECTID,
            country: value.properties.NAME,
            case: value.properties.today_case,
            new_case: value.properties.today_new_case,
            death: value.properties.today_death,
            new_death: value.properties.today_new_death,
        }
    });

    result_list.forEach(function(value) {

        sum_world_today_case += value.case;
        sum_world_today_death += value.death;
        sum_world_today_new_case += value.new_case;
        sum_world_today_new_death += value.new_death;

        // fill numbers in the pane
        $('#world-data .confirmed .data-number').text(numberWithCommas(sum_world_today_case));
        $('#world-data .death .data-number').text(numberWithCommas(sum_world_today_death));

        $('#world-data .confirmed .change').html(arrowHTML + numberWithCommas(sum_world_today_new_case));
        $('#world-data .death .change').html(arrowHTML + numberWithCommas(sum_world_today_new_death));
    })
}

var fill_left_panel_promise = function(layer_info) {
    return new Promise((resolve, reject) => {
        if (layer_info.name == "il_weekly_case") {
            fill_left_panel_il(layer_info.geojson_obj);
        } else if (layer_info.name == "us_state_weekly_case") {
            fill_left_panel_us(layer_info.geojson_obj);
        } else if (layer_info.name == "world_weekly_case") {
            fill_left_panel_world(layer_info.geojson_obj);
        }
        hide_loader();
        resolve();
    })
}

/////////////////////////////// Initialize Map And Controls ///////////////////////////////

var map = L.map('map', {
    layers: [CartoDB_DarkMatter],
    center: new L.LatLng(40, -89),
    zoom: 7,
    //Remove Zoom Control from the map
    zoomControl: false,
    //Disable snap to zoom level
    zoomSnap: 0,
    //Remove the attribution from the right hand side
    //We will add it back later to the left side
    attributionControl: false
});


var slider = L.timelineSliderControl({
    formatOutput: function(date) {
        return new Date(date).toLocaleDateString('en-US', { timeZone: 'UTC' })
    },
    steps: 150,
    duration: 150000,
    position: 'topleft',
    showTicks: false
});
map.addControl(slider);

var baseMaps = {
    "Dark Mode": CartoDB_DarkMatter,
};

var groupedOverlays = {
    "Illinois": {},
    "US": {},
    "World": {}
};
var options = {
    // Make the groups exclusive (use radio inputs)
    exclusiveGroups: ["Illinois", "US", "World"],
    // Show a checkbox next to non-exclusive group labels for toggling all
    groupCheckboxes: true
};

// add layer control to the map
var layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, options);
// map.addControl(layerControl);

// Add the attribution of the base map to the left side
L.control.attribution({
    position: 'bottomleft'
}).addTo(map);

//////////////////////////////// Define Layer Change Events ///////////////////////////////

var onOverlayAdd = function(e) {

    // Remove the chart if it exists
    document.getElementById('myChart').classList.add("d-none");
    document.getElementById('myChart').classList.remove("d-block");

    slider.timelines.forEach(function(item) {
        slider.removeTimelines(item)
    });
    slider.remove();

    if (map.hasLayer(marker)) {
        map.removeLayer(marker);
    }

    if (getLayerInfo(e.layer.name)['animation'] == true) {
        // slider.addTo(map);
        slider.addTimelines(e.layer);
        // setTime must be after addTo(map), otherwise reset to startTime
        slider.setTime(slider.end);
    }

    refreshLegend(e.layer);

    // hide_loader();
}

var onOverlayRemove = function(e) {
    slider.removeTimelines(e.layer);
    slider.remove();
}

map.on('overlayadd', onOverlayAdd);
//map.on('overlayremove', onOverlayRemove);

/////////////////////////////// Define Color Schema And Bins //////////////////////////////

var splitStrInt = function(str, num) {
    var newStr = str.split(",");
    return parseInt(newStr[num])
}

var splitStrFloat = function(str, num) {
    var newStr = str.split(",");
    return parseFloat(newStr[num])
}

var getChangeColor = function(d) {
    return d > 0.5 ? '#d7191c' :
        d > 0.1 ? '#fd9861' :
        d > -0.1 ? '#ffffbf' :
        d > -0.5 ? '#a5d96a' :
        '#199640';
}

////////////////////////////// Define Promises And Entry Point ////////////////////////////

var add_animation_layer_to_map = function(layer_info) {
    if (layer_info.geojson_obj == null || layer_info.geojson_obj == undefined) {
        console.log("Geojson for " + layer_info.display_name + " is not loaded")
        return;
    }

    let layer_obj = L.timeline(layer_info.geojson_obj, {
        style: layer_info.style_func,
    });

    layer_obj.name = layer_info.name;
    layer_info.layer_object = layer_obj;

    if (layer_obj.name == "il_weekly_case") {
        il_weekly_case_layer_object = layer_obj;
    } else if (layer_obj.name == "us_state_weekly_case") {
        us_state_weekly_case_layer_object = layer_obj;
    } else if (layer_obj.name == "us_county_weekly_case") {
        us_county_weekly_case_layer_object = layer_obj;
    } else if (layer_obj.name == "world_weekly_case") {
        world_weekly_case_layer_object = layer_obj;
    }

    layer_obj.on('add', function(e) {
        // Set chart title
        chartTitle = layer_info.chartTitle;
        let li = getLayerInfo(e.target.name);
        try {
            bins = class_json_obj[li.color_class[0]][li.color_class[1]][li.color_class[2]][li.color_class[3]].bins.split(",").map(function(item) {

                if (li.color_class[4] == "int") {
                    return parseInt(item, 10);
                } else {
                    return parseFloat(parseFloat(item).toFixed(2));
                }

            });
            this.setStyle(li.style_func);
        } catch (err) {

        }
    });

    layer_obj.on('change', function(e) {
        // console.log(slider.time);
        let li = getLayerInfo(e.target.name);
        index = Math.floor((this.time - this.start) / DayInMilSec);
        // console.log(index);
        this.setStyle(li.style_func);
        layer_obj.eachLayer(function(value) {
            if (value.feature.properties.NAME == layer_info.highlightArea) {
                // layer_obj.setStyle(layer_info.style_func);
                // highlight geometry
                value.setStyle(highlight);
                // show chart
                updateChart(value.feature);
            }
        })
        var sliderDate = new Date(slider.time);
        var options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'};
        date_time = '<h2 class="map-date" style="padding:15px">' + sliderDate.toLocaleDateString('en-US', options) + "</h2>";
        // $('#current-datetime').text(sliderDate.toLocaleDateString('en-US', { timeZone: 'UTC' }));
        $('.leaflet-control-container .leaflet-top.leaflet-left').html(date_time);
        console.log("11111111111111111111111111");
        console.log(slider.time);
        console.log(slider);

        if(slider.time == slider.end)
        {
            scene_playing = false;
        }
    });
}


var chain_load_update_promise = function(layer_info) {
    return load_geojson_promise(layer_info).then(update_layer_and_table_promise);
}

var update_layer_and_table_promise = function(layer_info) {
    // check if geojson obj updated
    if (layer_info.geojson_updated == true) {
        let p1 = add_animation_layer_to_map_promise(layer_info);
        let p2 = fill_left_panel_promise(layer_info);
        return Promise.allSettled([p1, p2]);
    } else {
        return Promise.resolve(1);
    }
}

// hide_loader();

var init_layer_and_table_promise = function() {
    return Promise.allSettled(layer_info_list.map(chain_load_update_promise));
}

init_layer_and_table_promise().then(function() {
    setInterval(cycle_scenes, 4000);
});
setInterval(init_layer_and_table_promise, 3600000);

var cycle_scenes = function() {
    if (scene_playing) {
        return;
    }
    scene_playing = true;
    let layer_index = scene_play_counter % layer_info_list.length;
    let layer_info = layer_info_list[layer_index];
    let layer_obj = layer_info.layer_object;

    // remove layer in last scene
    if (active_scene_layer != null && active_scene_layer != undefined) {
        slider.removeTimelines(active_scene_layer);
        map.removeLayer(active_scene_layer);
    }

    if (layer_obj != null && layer_obj != undefined) {
        console.log("Playing " + layer_info.display_name);

        // hide all data panes
        $('.data-pane').removeClass('d-flex');
        $('.data-pane').addClass('d-none');

        // then to show specific pane
        $(layer_info.panel_id).removeClass('d-none');
        $(layer_info.panel_id).addClass('d-flex');

        // map.setView(layer_info.zoom_center, layer_info.zoom_level);
        if (layer_info.name == "il_weekly_case") {
            map.fitBounds(illinois_bounds, { paddingTopLeft: [200, 50], paddingBottomRight: [200, 400] });
        } else if (layer_info.name == "us_state_weekly_case") {
            map.fitBounds(us_bounds, { paddingTopLeft: [100, 50], paddingBottomRight: [100, 400] });
        } else {
            map.fitWorld({ paddingTopLeft: [100, -50], paddingBottomRight: [100, 200] });
        }

        // add new layer to map
        layer_obj.addTo(map);
        slider.addTimelines(layer_obj);
        refreshLegend(layer_obj);

        // setup slider
        // map.removeControl(slider);
        slider._stepDuration = 1000;
        slider._stepSize = DayInMilSec;
        // slider.start = slider.end - TwoWeeksInMilSec;
        // map.addControl(slider);
        slider.setTime(slider.end - TwoWeeksInMilSec);

        active_scene_layer = layer_obj;
        slider.play();
    }
    scene_play_counter = scene_play_counter + 1;
    //scene_playing = false;

}

////////////////////////////////////// Create Legend //////////////////////////////////////

var refreshLegend = function(_layer) {

    if (legend != null) {
        map.removeControl(legend)
    }

    legend = L.control({ position: 'bottomright' });

    binsAcc = ["low", "", "", "", "", "high"];
    binsChange = ["-50%", "-10%~-50%", "Steady (-10%~10%)", "+10%~+50%", "+50%"];

    legend.onAdd = function(map) {

        var div = L.DomUtil.create('div', 'info legend');

        label6 = ['<strong> Weekly Change Rate of New Cases </strong>']

        // Changing the grades using unshift somehow also changes bins?
        //grades.unshift(0);
        var legendContent = "";

        // loop through our density intervals and generate a label with a colored square for each interval
        if (_layer == il_weekly_case_layer_object || _layer == us_county_weekly_case_layer_object ||
            _layer == us_state_weekly_case_layer_object || _layer == world_weekly_case_layer_object) {
            grades = binsChange;
            var binsChangeValue = [-1, -0.4, 0, 0.4, 1];
            for (var i = 0; i < grades.length; i++) {
                legendContent +=
                    '<i style="background:' + getChangeColor(binsChangeValue[i]) + '"></i> ' +
                    grades[i] + (grades[i + 1] != undefined ? '<br>' : '') + '<br>';
            }
            label6.push(legendContent);
            div.innerHTML = label6.join('<br><br><br>');
        }

        return div;
    };

    legend.addTo(map);
}

//////////////////////////////////////// Plot Chart ///////////////////////////////////////

var updateChart = function(graphic) {

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
    var averageWeeklyCases = [];

    for (i = 1; i < CasesArray.length; i++) {
        IncreasedCases.push(CasesArray[i] - CasesArray[i - 1]);
    }
    IncreasedCases.unshift(0);

    for (i = 0; i < IncreasedCases.length; i++) {
        if (i < 6) {
            averageWeeklyCases.push(IncreasedCases[i]);
        } else {
            averageWeeklyCases.push(Math.round((IncreasedCases[i] + IncreasedCases[i - 1] + IncreasedCases[i - 2] +
                IncreasedCases[i - 3] + IncreasedCases[i - 4] + IncreasedCases[i - 5] + IncreasedCases[i - 6]) / 7));
        }
    }

    var ExtendedCasesArray = CasesArray.slice(0);
    ExtendedCasesArray.unshift(0, 0, 0, 0, 0, 0, 0);

    var ExtendedIncreasedCases = IncreasedCases.slice(0);
    ExtendedIncreasedCases.unshift(0, 0, 0, 0, 0, 0, 0);

    var ExtendedAverageWeeklyCases = averageWeeklyCases.slice(0);
    ExtendedAverageWeeklyCases.unshift(0, 0, 0, 0, 0, 0, 0);

    var firstCaseIndex = ExtendedCasesArray.findIndex(val => val > 0);
    SlicedCasesArray = ExtendedCasesArray.slice(firstCaseIndex);
    SlicedIncreasedCases = ExtendedIncreasedCases.slice(firstCaseIndex);
    SlicedAverageWeeklyCases = ExtendedAverageWeeklyCases.slice(firstCaseIndex);

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
    // IDPH data started from 2020-03-17
    if (graphic.properties.start == "2020-03-17") {
        var LabelDate = new Date(2020, 2, 9);
    }
    // NYT state-level data started from 2020-01-21
    else if (graphic.properties.start == "2020-01-21") {
        var LabelDate = new Date(2020, 0, 13);
    }
    // WHO data started from 2020-01-04
    else if (graphic.properties.start == "2020-01-04") {
        var LabelDate = new Date(2019, 11, 27);
    }

    for (i = 0; i < ExtendedCasesArray.length; i++) {
        LabelDate.setDate(LabelDate.getDate() + 1);
        LabelDates.push(LabelDate.toLocaleDateString());
    }

    SlicedLabelDates = LabelDates.slice(firstCaseIndex);
    // console.log(firstCaseIndex);

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
            // context.setLineDash([10, 5]);
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
        backgroundColor: "#ffab24",
        borderColor: "#ffab24",
        fill: true,
        hidden: true
    };
    dic2 = {
        data: SlicedIncreasedCases,
        label: "Daily Cases ",
        backgroundColor: "#f25100",
        borderColor: "#f25100",
        fill: true,
        hidden: false
    };

    if (graphic.properties.deaths_ts != undefined) {
        dic3 = {
            data: SlicedDeathsArray,
            label: "Total Deaths ",
            backgroundColor: "#a10025",
            borderColor: "#a10025",
            fill: true,
            hidden: true
        };
        dic4 = {
            data: SlicedIncreasedDeaths,
            label: "Daily Deaths ",
            backgroundColor: "#6a28c7",
            borderColor: "#6a28c7",
            fill: true,
            hidden: true
        };
    }

    dic5 = {
        data: SlicedAverageWeeklyCases,
        label: "7-Day Average New Cases ",
        type: "line",
        borderColor: "#fed8b1",
        pointStyle: "circle",
        pointHoverRadius: 3,
        pointRadius: 0,
        lineTension: 0.5,
        borderWidth: 2,
        fill: false,
        hidden: false,
    };

    if (graphic.properties.cases_ts != undefined) {
        datasetList.push(dic5)
        datasetList.push(dic2)
            // datasetList.push(dic1)
    }

    if (graphic.properties.deaths_ts != undefined) {
        // datasetList.push(dic4)
        // datasetList.push(dic3)
    }

    if (window.bar != undefined) {
        window.bar.destroy();
    }

    // 'index' represents the exact location of silder, 'firstCaseIndex' minus 7 days is the actual index of first date
    var verticalLineIndex = index - firstCaseIndex + 7;
    if (verticalLineIndex < 0) {
        verticalLineIndex = 1;
    }

    window.bar = new Chart(myChart, {
        type: 'bar',
        data: {
            labels: SlicedLabelDates,
            datasets: datasetList
        },
        options: {
            title: {
                display: true,
                text: 'COVID19 Time Series of ' + chartTitle,
                fontSize: 15
            },
            legend: {
                display: ($(window).width() > 1000),
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
        lineAtIndex: [verticalLineIndex],
        animation: {
            duration: 0
        },
        responsiveAnimationDuration: 0
    });

    // Prevent the animation of redrawing the chart
    window.bar.update(0);

}

function update_clock() {

    var options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    var now = new Date();
    $('#current-datetime').text(now.toLocaleDateString('en-US', options) + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
}

setInterval(update_clock, 10000);
