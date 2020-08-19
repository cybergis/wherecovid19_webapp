///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Variables ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////// Set up Basemaps /////////////////////////////////////

var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

var il_county_case_layer_object = null;
var us_county_case_layer_object = null;
var world_case_layer_object = null;
var us_state_case_layer_object = null;
var il_acc_i_layer_object = null;
var il_acc_v_layer_object = null;
var il_vul_layer_object = null;
var il_chicago_acc_v_layer_object = null;
var il_chicago_acc_i_layer_object = null;
var il_weekly_case_layer_object = null;
var us_county_weekly_case_layer_object = null;
var us_state_weekly_case_layer_object = null;
var world_weekly_case_layer_object = null;
var il_hiv_layer_object = null;
var il_svi_layer_object = null;
var il_testing_sites_layer_object = null;
var il_zipcode_case_layer_object = null;

//////////////////////////////////// Load GeoJSON File ////////////////////////////////////

class_json_url = "preprocessing/classes.json";
var class_json_obj = null;

////////////////////////////////// Add Data To Left Panel /////////////////////////////////

var il_table = $('#illinois-table').DataTable({
    paging: true,
    pagingType: "simple_numbers",
    pageLength: 50,
    ordering: true,
    order: [
        [1, "desc"]
    ],
    info: false,
    responsive: true,
    dom: "pt",
});

var county_table = $('#county-table').DataTable({
    paging: true,
    pagingType: "simple_numbers",
    pageLength: 50,
    ordering: true,
    order: [
        [1, "desc"]
    ],
    info: false,
    responsive: true,
    dom: "pt",
});

var world_table = $('#world-table').DataTable({
    paging: true,
    pagingType: "simple_numbers",
    pageLength: 50,
    ordering: true,
    order: [
        [1, "desc"]
    ],
    info: false,
    responsive: true,
    dom: "pt",
});

/////////////////////////////// Initialize Map And Controls ///////////////////////////////

var colorClass = null;
var world = null;
var us_states = null;
var us_counties = null;
var illinois_counties = null;
var illinois_acc_i = null;
var illinois_acc_v = null;
var chicago_acc_i = null;
var chicago_acc_v = null;
var illinois_vulnerability = null;
var illinois_zipcode = null;

/////////////////////////////// Define Color Schema And Bins //////////////////////////////

var bins = null;
var index = 0;
const DayInMilSec = 60 * 60 * 24 * 1000;
const TwoWeeksInMilSec = 14*DayInMilSec;

///////////////////////////// Handle Left Panel Table Clicking ////////////////////////////

var highlight = {
    'color': '#00fbff',
    'weight': 3,
    'Opacity': 1
};

////////////////////////////////////// Create Legend //////////////////////////////////////

var legend = null;


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

var layer_info_list = [
    {
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
    },
    // {
    //     "name": "us_county_weekly_case",
    //     "display_name": "US County-level Weekly Average Change",
    //     "geojson_url": "preprocessing/nyt_counties_data.geojson",
    //     "category": "US",
    //     "show": false,
    //     "style_func": styleChange,
    //     "animation": true,
    // },
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
    },    
];

var getLayerInfo = function (name, field = "name") {

    for (i = 0; i < layer_info_list.length; i++) {
        if (name == layer_info_list[i][field]) {
            return layer_info_list[i];
        }
    }

    return null;

}

//////////////////////////////////// Load GeoJSON File ////////////////////////////////////

var loadClassJson = function (url) {
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

var load_geojson_promise = function (layer_info) {
    return new Promise((resolve, reject) => {
        if (layer_info["esri_url"] != undefined) {
            resolve(layer_info);
        } 
        else {

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

var add_animation_layer_to_map_promise = function (layer_info) {
    return new Promise((resolve, reject) => {
        add_animation_layer_to_map(layer_info);
        resolve();
    })
}

////////////////////////////////// Add Data To Left Panel /////////////////////////////////

var numberWithCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

var fill_left_panel_il = function (geojson) {
    il_table.clear().destroy();

    let tab = document.getElementById('illinois-tab');
    let illinois_table = document.getElementById('illinois-table').querySelector('tbody');
    let template = document.querySelector('template')
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

    //console.log(result_list);

    result_list.forEach(function(value) {

        let instance = template.content.cloneNode(true);

        if (value.county == "Illinois") {
            tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(value.case)
            let case_div = document.getElementById('illinois_total_case_number')
            let death_div = document.getElementById('illinois_total_death_number')
            let test_div = document.getElementById('illinois_total_test_number')
            case_div.querySelector('.case-number').innerHTML = numberWithCommas(value.case)
            case_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(value.new_case)
            death_div.querySelector('.case-number').innerHTML = numberWithCommas(value.death)
            death_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(value.new_death)
            test_div.querySelector('.case-number').innerHTML = numberWithCommas(value.tested)
            test_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(value.new_tested)
        } else {
            instance.querySelector('th').innerHTML = value.county;
            instance.querySelector('th').setAttribute('data-x', value.centroid_x);
            instance.querySelector('th').setAttribute('data-y', value.centroid_y);
            instance.querySelector('th').setAttribute('data-bounds', value.bounds);
            instance.querySelector('th').setAttribute('data-uid', value.uid);
            instance.querySelector('th').setAttribute('data-county', value.county);

            instance.querySelector('.confirmed').innerHTML = '<span>' + numberWithCommas(value.case) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_case);
            instance.querySelector('.death').innerHTML = '<span>' + numberWithCommas(value.death) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_death);
            instance.querySelector('.tested').innerHTML = '<span>' + numberWithCommas(value.tested) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_tested);
            instance.querySelector('.confirmed').setAttribute('data-order', value.case);
            instance.querySelector('.death').setAttribute('data-order', value.death);
            instance.querySelector('.tested').setAttribute('data-order', value.tested);
            illinois_table.appendChild(instance);
        }
    })

    il_table = $('#illinois-table').DataTable({
        paging: true,
        pagingType: "simple_numbers",
        pageLength: 50,
        ordering: true,
        order: [
            [1, "desc"]
        ],
        info: false,
        responsive: true,
        dom: "pt",
    });

    $('#illinois-table').on('click', 'tr', function() {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            il_table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

    $('#il-search-input').on('input', function() {
        console.log($('#il-search-input').val());
        il_table.column(0).search($('#il-search-input').val()).draw();
        il_table.$('tr.selected').removeClass('selected');
    });

    $('#il-search-input').on('textchange', function() {
        console.log($('#il-search-input').val());
        // If using regex in strict search, the context can only be searched in targetTable.column(i) instead of targetTable
        il_table.column(0).search('^'+$('#il-search-input').val()+'$', true, false).draw();
    });

}

var fill_left_panel_us = function (geojson) {
    county_table.clear().destroy();

    // All 'counties' refers to 'states'
    var sum_us_counties_today_case = 0;
    var sum_us_counties_today_death = 0;
    var sum_us_counties_today_new_case = 0;
    var sum_us_counties_today_new_death = 0;
    let counties_table = document.getElementById('county-table').querySelector('tbody');
    let template = document.querySelectorAll('template')[1]

    let result_list = geojson.features.map(function(value, index) {
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

    //console.log(result_list);

    result_list.forEach(function(value) {
        let instance = template.content.cloneNode(true);

        // instance.querySelector('th').innerHTML = value.county + ", " + value.state;
        instance.querySelector('th').innerHTML = value.state;
        instance.querySelector('th').setAttribute('data-x', value.centroid_x);
        instance.querySelector('th').setAttribute('data-y', value.centroid_y);
        instance.querySelector('th').setAttribute('data-bounds', value.bounds);
        instance.querySelector('th').setAttribute('data-uid', value.uid);
        // instance.querySelector('th').setAttribute('data-county', value.county);
        instance.querySelector('th').setAttribute('data-state', value.state);
        instance.querySelector('.confirmed').innerHTML = '<span>' + numberWithCommas(value.case) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_case);
        instance.querySelector('.death').innerHTML = '<span>' + numberWithCommas(value.death) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_death);
        instance.querySelector('.confirmed').setAttribute('data-order', value.case);
        instance.querySelector('.death').setAttribute('data-order', value.death);
        counties_table.appendChild(instance);

        sum_us_counties_today_case += value.case;
        sum_us_counties_today_death += value.death;
        sum_us_counties_today_new_case += value.new_case;
        sum_us_counties_today_new_death += value.new_death;
    })

    let tab = document.getElementById('county-tab');
    tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(sum_us_counties_today_case)
    let case_div = document.getElementById('counties_total_case_number')
    let death_div = document.getElementById('counties_total_death_number')
    case_div.querySelector('.case-number').innerHTML = numberWithCommas(sum_us_counties_today_case)
    case_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(sum_us_counties_today_new_case)
    death_div.querySelector('.case-number').innerHTML = numberWithCommas(sum_us_counties_today_death)
    death_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(sum_us_counties_today_new_death)

    county_table = $('#county-table').DataTable({
        paging: true,
        pagingType: "simple_numbers",
        pageLength: 50,
        ordering: true,
        order: [
            [1, "desc"]
        ],
        info: false,
        responsive: true,
        dom: "pt",
    });
    
    $('#county-table').on('click', 'tr', function() {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            county_table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

    $('#w-search-input').on('input', function() {
        console.log($('#w-search-input').val());
        county_table.column(0).search($('#w-search-input').val()).draw();
        county_table.$('tr.selected').removeClass('selected');
    });

    $('#w-search-input').on('textchange', function() {
        console.log($('#w-search-input').val());
        // If using regex in strict search, the context can only be searched in targetTable.column(i) instead of targetTable
        county_table.column(0).search('^'+$('#w-search-input').val()+'$', true, false).draw();
    });
}

var fill_left_panel_world = function (geojson) {
    world_table.clear().destroy();

    var sum_world_today_case = 0;
    var sum_world_today_death = 0;
    var sum_world_today_new_case = 0;
    var sum_world_today_new_death = 0;
    let worlds_table = document.getElementById('world-table').querySelector('tbody');
    let template = document.querySelectorAll('template')[1]

    let result_list = geojson.features.map(function(value, index) {
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

    //console.log(result_list);

    result_list.forEach(function(value) {
        let instance = template.content.cloneNode(true);

        instance.querySelector('th').innerHTML = value.country;
        instance.querySelector('th').setAttribute('data-x', value.centroid_x);
        instance.querySelector('th').setAttribute('data-y', value.centroid_y);
        instance.querySelector('th').setAttribute('data-bounds', value.bounds);
        instance.querySelector('th').setAttribute('data-country', value.country);
        instance.querySelector('.confirmed').innerHTML = '<span>' + numberWithCommas(value.case) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_case);
        instance.querySelector('.death').innerHTML = '<span>' + numberWithCommas(value.death) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_death);
        instance.querySelector('.confirmed').setAttribute('data-order', value.case);
        instance.querySelector('.death').setAttribute('data-order', value.death);
        worlds_table.appendChild(instance);

        sum_world_today_case += value.case;
        sum_world_today_death += value.death;
        sum_world_today_new_case += value.new_case;
        sum_world_today_new_death += value.new_death;
    })

    let tab = document.getElementById('world-tab');
    tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(sum_world_today_case)
    let case_div = document.getElementById('world_total_case_number')
    let death_div = document.getElementById('world_total_death_number')
    case_div.querySelector('.case-number').innerHTML = numberWithCommas(sum_world_today_case)
    case_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(sum_world_today_new_case)
    death_div.querySelector('.case-number').innerHTML = numberWithCommas(sum_world_today_death)
    death_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(sum_world_today_new_death)

    world_table = $('#world-table').DataTable({
        paging: true,
        pagingType: "simple_numbers",
        pageLength: 50,
        ordering: true,
        order: [
            [1, "desc"]
        ],
        info: false,
        responsive: true,
        dom: "pt",
    });
    
    $('#world-table').on('click', 'tr', function() {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            world_table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

    $('#world-search-input').on('input', function() {
        console.log($('#world-search-input').val());
        world_table.column(0).search($('#world-search-input').val()).draw();
        world_table.$('tr.selected').removeClass('selected');
    });

    $('#world-search-input').on('textchange', function() {
        console.log($('#world-search-input').val());
        // If using regex in strict search, the context can only be searched in targetTable.column(i) instead of targetTable
        world_table.column(0).search('^'+$('#world-search-input').val()+'$', true, false).draw();
    });

}

var fill_left_panel_promise = function (layer_info) {
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

var onOverlayAdd = function (e) {

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

    if (e.group.name == "Illinois") {
        $("#illinois-tab").trigger("click");
        map.setView([40, -89], 7)
    } else if (e.group.name == "US") {
        $("#county-tab").trigger("click");
        map.setView([37, -96], 4)
    } else if (e.group.name == "World") {
        $("#world-tab").trigger("click");
        map.setView([0, 0], 2)
    }

    // hide_loader();

    world_table.$('tr.selected').removeClass('selected');
    document.getElementById("world-search-input").value = '';
    $("#world-search-input").trigger("input");

    county_table.$('tr.selected').removeClass('selected');
    document.getElementById("w-search-input").value = '';
    $("#w-search-input").trigger("input");

    il_table.$('tr.selected').removeClass('selected');
    document.getElementById("il-search-input").value = '';
    $("#il-search-input").trigger("input");
    
}

var onOverlayRemove = function (e) {
    slider.removeTimelines(e.layer);
    slider.remove();
}

map.on('overlayadd', onOverlayAdd);
//map.on('overlayremove', onOverlayRemove);

/////////////////////////////// Define Color Schema And Bins //////////////////////////////

var splitStrInt = function (str, num) {
    var newStr = str.split(",");
    return parseInt(newStr[num])
}

var splitStrFloat = function (str, num) {
    var newStr = str.split(",");
    return parseFloat(newStr[num])
}

var getChangeColor = function (d) {
    return d > 0.5 ? '#d7191c' :
        d > 0.1 ? '#fd9861' :
        d > -0.1 ? '#ffffbf' :
        d > -0.5 ? '#a5d96a' :
        '#199640';
}

////////////////////////////// Define Promises And Entry Point ////////////////////////////

var add_animation_layer_to_map = function (layer_info) {
    if (layer_info.geojson_obj == null || layer_info.geojson_obj == undefined)
    {
        console.log("Geojson for " + layer_info.display_name + " is not loaded")
        return;
    }
    let _onEachFeatureFunc;
    if (layer_info.name == "il_weekly_case" || 
    layer_info.name == "us_county_weekly_case" || 
    layer_info.name == "us_state_weekly_case" || 
    layer_info.name == "world_weekly_case") {
        _onEachFeatureFunc = onEachFeature_change;
    } 

    let layer_obj = L.timeline(layer_info.geojson_obj, {
        style: layer_info.style_func,
        onEachFeature: _onEachFeatureFunc,
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
    });



    // add layer into LayerControl UI list
    //layerControl.addOverlay(layer_obj, layer_info.display_name, layer_info.category);

    // switch_left_tab_page_handler
    // switch_left_tab_page_handler(layer_info);

    //popup
}


var chain_load_update_promise = function (layer_info) {
    return load_geojson_promise(layer_info).then(update_layer_and_table_promise);
}

var update_layer_and_table_promise = function (layer_info) {
    // check if geojson obj updated
    if (layer_info.geojson_updated == true) {
        let p1 = add_animation_layer_to_map_promise(layer_info);
        let p2 = fill_left_panel_promise(layer_info);
        return Promise.allSettled([p1, p2]);
    } else {
        return Promise.resolve(1);
    }
}

hide_loader();
function init_layer_and_table_promise()
{
    return Promise.allSettled(layer_info_list.map(chain_load_update_promise));
}

init_layer_and_table_promise();
setInterval(init_layer_and_table_promise, 3600000);


var scene_play_counter = 0;
var scene_playing = false;
var active_scene_layer = null;
function cycle_scenes()
{
    if(scene_playing)
    {
        return;
    }
    scene_playing = true;
    let layer_index = scene_play_counter % layer_info_list.length;
    let layer_info = layer_info_list[layer_index];
    let layer_obj= layer_info.layer_object;

    // remove layer in last scene
    if(active_scene_layer != null && active_scene_layer != undefined)
    {
        slider.removeTimelines(active_scene_layer);
        map.removeLayer(active_scene_layer);
    }

    if(layer_obj != null && layer_obj != undefined)
    {
        console.log("Playing " + layer_info.display_name);
        
        // switch left table tab page
        // zoom to layer
        $(layer_info.tabpage_id).trigger("click");
        map.setView(layer_info.zoom_center, layer_info.zoom_level);
        
        // add new layer to map
        layer_obj.addTo(map);
        slider.addTimelines(layer_obj);
        refreshLegend(layer_obj);

        // setup slider
        map.removeControl(slider);
        slider._stepDuration = 1000;
        slider._stepSize = DayInMilSec;
        slider.start = slider.end-TwoWeeksInMilSec;
        // console.log(slider);
        map.addControl(slider);
        slider.setTime(slider.end-TwoWeeksInMilSec);

        active_scene_layer = layer_obj;
        slider.play();
    }
    scene_play_counter = scene_play_counter + 1;
    scene_playing = false;

}
setInterval(cycle_scenes, 16000);

/////////////////////////// Handle Left Panel Tab Page Clicking ///////////////////////////

var _switch_to_layer = function (layer_object) {
    if (layer_object == null || layer_object == undefined) {
        return;
    }
    if (map.hasLayer(layer_object) != true) {
        map.eachLayer(function(layer) {
            if (layer._url == undefined) {
                map.removeLayer(layer);
            }
        });
        map.addLayer(layer_object);
    }
}

var switch_left_tab_page_handler = function (layer_info) {
    console.log(layer_info["tab_page_id"]);
    if (layer_info["tab_page_id"] != null && layer_info["tab_page_id"] != undefined) {
        document.getElementById(layer_info["tab_page_id"]).addEventListener("click", function(event) {
            let li = getLayerInfo(event.target.id, "tab_page_id");
            let layer_object = li.layer_object;
            _switch_to_layer(layer_object);
        });
    }
}

var switch_left_tab_page_handler_old = function (layer_info) {
    //Set default layers after clicking side panels
    document.getElementById("illinois-tab").addEventListener("click", function(event) {
        if (map.hasLayer(il_county_case_layer_object) != true) {
            map.eachLayer(function(layer) {
                if (layer._url == undefined) {
                    map.removeLayer(layer);
                }
            });
            // show_loader();
            map.addLayer(il_county_case_layer_object);
        }
    });

    document.getElementById("county-tab").addEventListener("click", function(event) {
        if (map.hasLayer(us_county_case_layer_object) != true) {
            map.eachLayer(function(layer) {
                if (layer._url == undefined) {
                    map.removeLayer(layer);
                }
            });
            // show_loader();
            map.addLayer(us_county_case_layer_object);
        }
    });

    document.getElementById("world-tab").addEventListener("click", function(event) {
        if (map.hasLayer(world_case_layer_object) != true) {
            map.eachLayer(function(layer) {
                if (layer._url == undefined) {
                    map.removeLayer(layer);
                }
            });
            // show_loader();
            map.addLayer(world_case_layer_object);
        }
    });

}

///////////////////////////// Handle Left Panel Table Clicking ////////////////////////////

var left_tab_page_table_click_old = function () {

    /// illinois Table
    document.querySelector("#illinois-table tbody").addEventListener("click", function(event) {
        // Clear existing popup
        map.closePopup();
        if (map.hasLayer(il_county_case_layer_object) != true) {
            map.eachLayer(function(layer) {
                if (layer._url == undefined) {
                    map.removeLayer(layer);
                }
            });
            map.addLayer(il_county_case_layer_object);
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
            bounds = tr.firstElementChild.dataset.bounds.split(',').map(function(item) {
                return parseFloat(item);
            });
            boundCoords = [];
            for (i=0; i<bounds.length; i++) {
                if (i%2 == 0) {
                    boundCoords.push([bounds[i+1],bounds[i]])
                }
            }
            objID = parseFloat(tr.firstElementChild.dataset.uid);
            countyName = tr.firstElementChild.dataset.county;

            il_county_case_layer_object.eachLayer(function(value) {
                if (value.feature.properties.NAME == countyName) {
                    il_county_case_layer_object.setStyle(styleFunc1);
                    value.setStyle(highlight);
                    //map.setView([lat, long], 9);
                    map.fitBounds(boundCoords);
                    updateChart(value.feature);
                }
            })
        }
    });

    /// US Table
    document.querySelector("#county-table tbody").addEventListener("click", function(event) {
        // Clear existing popup
        map.closePopup();
        if (map.hasLayer(us_county_case_layer_object) != true) {
            map.eachLayer(function(layer) {
                if (layer._url == undefined) {
                    map.removeLayer(layer);
                }
            });
            map.addLayer(us_county_case_layer_object);
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
            bounds = tr.firstElementChild.dataset.bounds.split(',').map(function(item) {
                return parseFloat(item);
            });
            boundCoords = [];
            for (i=0; i<bounds.length; i++) {
                if (i%2 == 0) {
                    boundCoords.push([bounds[i+1],bounds[i]])
                }
            }
            objID = parseFloat(tr.firstElementChild.dataset.uid);
            countyName = tr.firstElementChild.dataset.county;
            stateName = tr.firstElementChild.dataset.state;

            us_county_case_layer_object.eachLayer(function(value) {
                if (value.feature.properties.NAME == countyName && value.feature.properties.state_name == stateName) {
                    us_county_case_layer_object.setStyle(styleFunc1);
                    value.setStyle(highlight);
                    //map.setView([lat, long], 9);
                    map.fitBounds(boundCoords);
                    updateChart(value.feature);
                }
            })
        }
    });

    /// World Table
    document.querySelector("#world-table tbody").addEventListener("click", function(event) {
        // Clear existing popup
        map.closePopup();
        if (map.hasLayer(world_case_layer_object) != true) {
            map.eachLayer(function(layer) {
                if (layer._url == undefined) {
                    map.removeLayer(layer);
                }
            });
            map.addLayer(world_case_layer_object);
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
            bounds = tr.firstElementChild.dataset.bounds.split(',').map(function(item) {
                return parseFloat(item);
            });
            boundCoords = [];
            for (i=0; i<bounds.length; i++) {
                if (i%2 == 0) {
                    boundCoords.push([bounds[i+1],bounds[i]])
                }
            }
            objID = parseFloat(tr.firstElementChild.dataset.uid);
            countryName = tr.firstElementChild.dataset.country;

            world_case_layer_object.eachLayer(function(value) {
                if (value.feature.properties.NAME == countryName) {
                    world_case_layer_object.setStyle(styleFunc1);
                    value.setStyle(highlight);
                    //map.setView([lat, long], 4);
                    map.fitBounds(boundCoords);
                    updateChart(value.feature);
                }
            })
        }
    });

}

////////////////////////////////////// Create Legend //////////////////////////////////////

var refreshLegend = function (_layer) {

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

var onEachFeature_change = function(feature, layer) {
    if (feature.properties) {
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            il_weekly_case_layer_object.setStyle(styleChange);
            // us_county_weekly_case_layer_object.setStyle(styleChange);
            us_state_weekly_case_layer_object.setStyle(styleChange);
            world_weekly_case_layer_object.setStyle(styleChange);
            onMapClick(e);
        });
    }
}

var onMapClick = function (e) {
    e.target.setStyle(highlight);
    console.log(e.target);
    
    var targetTable;

    // If using regex in strict search, the context can only be searched in targetTable.column(i) instead of targetTable

    if (e.target.feature.properties.ISO_2DIGIT != undefined) {
        targetTable = world_table;
        targetTable.$('tr.selected').removeClass('selected');
        document.getElementById("world-search-input").value = e.target.feature.properties.NAME;
        $("#world-search-input").trigger("textchange");
        targetTable.$('tr').addClass('selected');
    } 
    else if (e.target.feature.properties.state_name != undefined) {
        targetTable = county_table;
        targetTable.$('tr.selected').removeClass('selected');
        document.getElementById("w-search-input").value = e.target.feature.properties.NAME+", "+e.target.feature.properties.state_name;
        $("#w-search-input").trigger("textchange");
        targetTable.$('tr').addClass('selected');
    }
    else if (e.target.feature.properties.fips == undefined) {
        targetTable = il_table;
        targetTable.$('tr.selected').removeClass('selected');
        document.getElementById("il-search-input").value = e.target.feature.properties.NAME;
        $("#il-search-input").trigger("textchange");
        targetTable.$('tr').addClass('selected');
    }

    // Add d-block class and remove d-none to display the chart
    if (window.bar != undefined) {
        window.bar.destroy();
    }
    document.getElementById('myChart').classList.add("d-block");
    document.getElementById('myChart').classList.remove("d-none");
    updateChart(e.target.feature);
}


var updateChart = function (graphic) {

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
    var verticalLineIndex = index-firstCaseIndex+7;
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
                display: false,
                text: 'COVID19 Time Series',
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