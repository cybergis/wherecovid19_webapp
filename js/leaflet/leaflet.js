///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Variables ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////


////////////////////////// Get User Location And Set Up Markers ///////////////////////////

$('#illinois-tab').css("pointer-events","none");
$('#county-tab').css("pointer-events","none");
$('#world-tab').css("pointer-events","none");

var geolocation_options = {
    enableHighAccuracy: false,
    timeout: 30000,
    maximumAge: 0
};

var userLat = null;
var userLng = null;
var userCentered = false;
var userGeolocationTimer = null;
var userGeolocationTriedCounter = 0;
var marker;

var boundaryIllinois = [
    [-90.54179687500002, 42.43051037801457],
    [-90.54179687500002, 37.30787664699351],
    [-87.50957031250002, 37.30787664699351],
    [-87.50957031250002, 42.43051037801457]
];

var boundaryUS = [
    [-127.52638302724817, 49.02551219307651],
    [-127.52638302724817, 25.148115576371765],
    [-66.35450802724817, 25.148115576371765],
    [-66.35450802724817, 49.02551219307651]
];

var locIcon = L.icon({
    // iconUrl: 'https://img.icons8.com/color/48/000000/map-pin.png',
    iconUrl: 'img/point.gif',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

///////////////////////////////////// Set up Basemaps /////////////////////////////////////

var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

var il_county_case_layer_object = null;
var il_county_death_layer_object = null;
var us_county_case_layer_object = null;
var us_county_death_layer_object = null;
var world_case_layer_object = null;
var world_death_layer_object = null;
var us_state_case_layer_object = null;
var us_state_death_layer_object = null;
var il_weekly_case_layer_object = null;
var us_county_weekly_case_layer_object = null;
var us_state_weekly_case_layer_object = null;
var world_weekly_case_layer_object = null;


//////////////////////////////////// Load GeoJSON File ////////////////////////////////////

class_json_url = "preprocessing/classes.json";
var class_json_obj = null;

////////////////////////////////// Add Data To Left Panel /////////////////////////////////

var il_table;
var county_table;
var world_table;

/////////////////////////////// Initialize Map And Controls ///////////////////////////////

var colorClass = null;
var world = null;
var us_states = null;
var us_counties = null;
var illinois_counties = null;

var illinois_counties_ts, us_counties_ts, us_states_ts, world_ts;

/////////////////////////////// Define Color Schema And Bins //////////////////////////////

var bins = null;
// var index = 0;
// const DayInMilSec = 60 * 60 * 24 * 1000;

///////////////////////////// Handle Left Panel Table Clicking ////////////////////////////

var highlight = {
    //'color': '#00fbff',
    'fillColor': '#00fbff',
    'weight': 2,
    'fillOpacity': 0.7
};

////////////////////////////////////// Create Legend //////////////////////////////////////

var legend = null;
var isShareableURL = document.location.href.includes("#");


///////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// Functions ////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////


////////////////////////// Get User Location And Set Up Markers ///////////////////////////

var getPosition = function(options) {
    //// https://gist.github.com/varmais/74586ec1854fe288d393
    return new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
}

var addMarker = function () {
    marker = new L.marker({ lat: userLat, lng: userLng }, { icon: locIcon });
    marker.setOpacity(0.8);
    marker.addTo(map);
}

getPosition(geolocation_options)
    .then((position) => {
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;
    })
    .catch((err) => {
        console.error(err.message);
    })

var zoomToUserLocation = function () {
    // console.log(document.location.href.includes("#"));
    // Only locate user when detailed URL information is not given
    if (!isShareableURL) {

        console.log("Trying to center view to user location ....");
        if (!userCentered || userGeolocationTriedCounter > 60) {
            if (userLat != null && userLng != null) {
                userLatLonAction({ lat: userLat, lng: userLng });
                userCentered = true;
                addMarker();
                console.log("centered");
            } else {
                console.log("User location still unknown; Will try again in 1s.");
            }
        } else {
            clearInterval(userGeolocationTimer);
        }
        userGeolocationTriedCounter = userGeolocationTriedCounter + 1;
    }
    
}

var zoomToUserLocationPromise = function () {
    return new Promise((resolve, reject) => {
        userGeolocationTimer = setInterval(zoomToUserLocation, 1000);
        resolve();
    });
}

var _switch_layer = function (layer, map) {
    if (map.hasLayer(layer) != true) {
        map.eachLayer(function(layer) {
            if (layer._url == undefined) {
                map.removeLayer(layer);
            }
        });
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
        map.addLayer(layer);
    }
}

var userLatLonAction = function (point) {

    userLat = point.lat;
    userLng = point.lng;
    // // New York
    // userLat = 40.7128;
    // userLng = -74.0060;
    // // Japan
    // userLat = 36.2048;
    // userLng = 138.2529;

    try {

        if (userLat < boundaryIllinois[0][1] && userLat > boundaryIllinois[1][1] &&
            userLng < boundaryIllinois[2][0] && userLng > boundaryIllinois[0][0]) {

            _switch_layer(il_county_case_layer_object, map);
            map.setView({ lat: userLat, lng: userLng }, 9);

        } else if (userLat < boundaryUS[0][1] && userLat > boundaryUS[1][1] &&
            userLng < boundaryUS[2][0] && userLng > boundaryUS[0][0]) {

            _switch_layer(us_county_case_layer_object, map);
            map.setView({ lat: userLat, lng: userLng }, 9);

        } else {

            _switch_layer(world_case_layer_object, map);
            map.setView({ lat: userLat, lng: userLng }, 6);
        }

    } catch (ex) {

    }

}

//////////////////////////////////// Setup Layer Style ////////////////////////////////////

var styleFunc1 = function(_data) {
    return {
        stroke: true,
        weight: 1,
        color: "gray",
        fillColor: getColorFor(100000 * splitStrInt(_data.properties.cases_ts, index) / _data.properties.population, bins),
        fillOpacity: 0.5
    }
};

var styleFunc1_death = function(_data) {
    return {
        stroke: true,
        weight: 1,
        color: "gray",
        fillColor: getColorFor(100000 * splitStrInt(_data.properties.deaths_ts, index) / _data.properties.population, bins),
        fillOpacity: 0.5
    }
};


var styleFunc2 = function(_data) {
    return {
        stroke: true,
        weight: 1,
        color: "gray",
        fillColor: getColorFor(_data.properties.confirmed_cases, bins),
        fillOpacity: 0.7
    }
};

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
    "name": "il_county_case",
    "display_name": "IDPH County-level Cases",
    "geojson_url": "preprocessing/illinois/dph_county_data.geojson",
    "category": "Illinois",
    "show": true,
    "style_func": styleFunc1,
    "color_class": ["dph_illinois", "case_per_100k_capita", "nolog", "NaturalBreaks", "int"],
    "tab_page_id": "illinois-tab",
    "animation": true,
},
{
    "name": "il_county_death",
    "display_name": "IDPH County-level Death",
    "geojson_url": "preprocessing/illinois/dph_county_data.geojson",
    "category": "Illinois",
    "show": false,
    "style_func": styleFunc1_death,
    "color_class": ["dph_illinois", "death_per_100k_capita", "nolog", "NaturalBreaks", "int"],
    "tab_page_id": "illinois-tab",
    "animation": true,
},
{
    "name": "us_county_case",
    "display_name": "US Counties",
    "geojson_url": "preprocessing/nyt_counties_data.geojson",
    "category": "US",
    "show": false,
    "style_func": styleFunc1,
    "color_class": ["county", "case_per_100k_capita", "nolog", "NaturalBreaks", "int"],
    "tab_page_id": "county-tab",
    "animation": true,
},
{
    "name": "us_county_death",
    "display_name": "US Counties death",
    "geojson_url": "preprocessing/nyt_counties_data.geojson",
    "category": "US",
    "show": false,
    "style_func": styleFunc1_death,
    "color_class": ["county", "death_per_100k_capita", "nolog", "NaturalBreaks", "int"],
    "tab_page_id": "county-tab",
    "animation": true,
},
{
    "name": "world_case",
    "display_name": "World",
    "geojson_url": "preprocessing/worldwide/who_world_data.geojson",
    "category": "World",
    "show": false,
    "style_func": styleFunc1,
    "color_class": ["who_world", "case_per_100k_capita", "nolog", "NaturalBreaks", "int"],
    "tab_page_id": "world-tab",
    "animation": true,
},
{
    "name": "world_death",
    "display_name": "World death",
    "geojson_url": "preprocessing/worldwide/who_world_data.geojson",
    "category": "World",
    "show": false,
    "style_func": styleFunc1_death,
    "color_class": ["who_world", "death_per_100k_capita", "nolog", "NaturalBreaks", "int"],
    "tab_page_id": "world-tab",
    "animation": true,
},
{
    "name": "us_state_case",
    "display_name": "US States",
    "geojson_url": "preprocessing/nyt_states_data.geojson",
    "category": "US",
    "show": false,
    "style_func": styleFunc1,
    "color_class": ["state", "case_per_100k_capita", "nolog", "NaturalBreaks", "int"],
    //"tab_page_id": "world-tab",
    "animation": true,
},
{
    "name": "us_state_death",
    "display_name": "US States death",
    "geojson_url": "preprocessing/nyt_states_data.geojson",
    "category": "US",
    "show": false,
    "style_func": styleFunc1_death,
    "color_class": ["state", "death_per_100k_capita", "nolog", "NaturalBreaks", "int"],
    //"tab_page_id": "world-tab",
    "animation": true,
},
];

var layer_info_list_2 = [
{
    "name": "il_weekly_case",
    "display_name": "Illinois Weekly Average Change",
    "geojson_url": null,
    "category": "Illinois",
    "show": false,
    "style_func": styleChange,
    "reuse": "il_county_case",
    "animation": true,
},
{
    "name": "us_county_weekly_case",
    "display_name": "US County-level Weekly Average Change",
    "geojson_url": null,
    "category": "US",
    "show": false,
    "style_func": styleChange,
    "reuse": "us_county_case",
    "animation": true,
},
{
    "name": "world_weekly_case",
    "display_name": "World Weekly Average Change",
    "geojson_url": null,
    "category": "World",
    "show": false,
    "style_func": styleChange,
    "reuse": "world_case",
    "animation": true,
},
];

var layer_info_list_3 = [{
    "name": "us_state_weekly_case",
    "display_name": "US State-level Weekly Average Change",
    "geojson_url": null,
    "category": "US",
    "show": false,
    "style_func": styleChange,
    "reuse": "us_state_case",
    "animation": true,
},
];

var getLayerInfo = function (name, field = "name") {

    for (i = 0; i < layer_info_list.length; i++) {
        if (name == layer_info_list[i][field]) {
            return layer_info_list[i];
        }
    }

    for (i = 0; i < layer_info_list_2.length; i++) {
        if (name == layer_info_list_2[i][field]) {
            return layer_info_list_2[i];
        }
    }

    for (i = 0; i < layer_info_list_3.length; i++) {
        if (name == layer_info_list_3[i][field]) {
            return layer_info_list_3[i];
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
                //console.log(url);
                class_json_obj = data;
                resolve();
            },
            error: function(error) {
                reject(error);
            },
        })
    })
}

var loadGeoJson = function (layer_info) {
    return new Promise((resolve, reject) => {
        if (layer_info["esri_url"] != undefined) {
            resolve(layer_info);
        } else {
            if (layer_info["reuse"] != null && layer_info["reuse"] != undefined) {
                li_reuse = getLayerInfo(layer_info["reuse"]);
                layer_info.geojson_obj = JSON.parse(JSON.stringify(li_reuse.geojson_obj));
                resolve(layer_info);
            }

            $.ajax({
                url: layer_info.geojson_url,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    //console.log(layer_info.geojson_url);
                    layer_info.geojson_obj = data;
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
        il_table.column(0).search($('#il-search-input').val()).draw();
        il_table.$('tr.selected').removeClass('selected');
    });

    $('#il-search-input').on('textchange', function() {
        // If using regex in strict search, the context can only be searched in targetTable.column(i) instead of targetTable
        il_table.column(0).search('^'+$('#il-search-input').val()+'$', true, false).draw();
    });

}

// Use county data to fill the list
var fill_left_panel_us_county = function (geojson) {

    let counties_table = document.getElementById('county-table').querySelector('tbody');
    let template = document.querySelectorAll('template')[1]

    let result_list = geojson.features.map(function(value, index) {
        return {
            centroid_x: turf.centroid(value.geometry).geometry.coordinates[0],
            centroid_y: turf.centroid(value.geometry).geometry.coordinates[1],
            bounds: value.geometry.coordinates,
            uid: value.properties.OBJECTID,
            county: value.properties.NAME,
            state: value.properties.state_name,
            case: value.properties.today_case,
            new_case: value.properties.today_new_case,
            death: value.properties.today_death,
            new_death: value.properties.today_new_death,
        }
    });

    result_list.forEach(function(value) {
        let instance = template.content.cloneNode(true);

        instance.querySelector('th').innerHTML = value.county + ", " + value.state;
        instance.querySelector('th').setAttribute('data-x', value.centroid_x);
        instance.querySelector('th').setAttribute('data-y', value.centroid_y);
        instance.querySelector('th').setAttribute('data-bounds', value.bounds);
        instance.querySelector('th').setAttribute('data-uid', value.uid);
        instance.querySelector('th').setAttribute('data-county', value.county);
        instance.querySelector('th').setAttribute('data-state', value.state);
        instance.querySelector('.confirmed').innerHTML = '<span>' + numberWithCommas(value.case) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_case);
        instance.querySelector('.death').innerHTML = '<span>' + numberWithCommas(value.death) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_death);
        instance.querySelector('.confirmed').setAttribute('data-order', value.case);
        instance.querySelector('.death').setAttribute('data-order', value.death);
        counties_table.appendChild(instance);

    })

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
        county_table.column(0).search($('#w-search-input').val()).draw();
        county_table.$('tr.selected').removeClass('selected');
    });

    $('#w-search-input').on('textchange', function() {
        // If using regex in strict search, the context can only be searched in targetTable.column(i) instead of targetTable
        county_table.column(0).search('^'+$('#w-search-input').val()+'$', true, false).draw();
    });
}

// Use state data to fill the sum number
var fill_left_panel_us_state = function (geojson) {
    // In this function, all 'counties' represents 'states'
    var sum_us_counties_today_case = 0;
    var sum_us_counties_today_death = 0;
    var sum_us_counties_today_new_case = 0;
    var sum_us_counties_today_new_death = 0;

    let result_list = geojson.features.map(function(value, index) {
        return {
            centroid_x: turf.centroid(value.geometry).geometry.coordinates[0],
            centroid_y: turf.centroid(value.geometry).geometry.coordinates[1],
            bounds: value.geometry.coordinates,
            uid: value.properties.OBJECTID,
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
    })

    let tab = document.getElementById('county-tab');
    tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(sum_us_counties_today_case)
    let case_div = document.getElementById('counties_total_case_number')
    let death_div = document.getElementById('counties_total_death_number')
    case_div.querySelector('.case-number').innerHTML = numberWithCommas(sum_us_counties_today_case)
    case_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(sum_us_counties_today_new_case)
    death_div.querySelector('.case-number').innerHTML = numberWithCommas(sum_us_counties_today_death)
    death_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(sum_us_counties_today_new_death)
}

var fill_left_panel_world = function (geojson) {
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
        world_table.column(0).search($('#world-search-input').val()).draw();
        world_table.$('tr.selected').removeClass('selected');
    });

    $('#world-search-input').on('textchange', function() {
        // If using regex in strict search, the context can only be searched in targetTable.column(i) instead of targetTable
        world_table.column(0).search('^'+$('#world-search-input').val()+'$', true, false).draw();
    });

}

var fill_left_panel_promise = function (layer_info) {
    return new Promise((resolve, reject) => {
        if (layer_info.name == "il_county_case") {
            fill_left_panel_il(layer_info.geojson_obj);
        } else if (layer_info.name == "us_county_case") {
            fill_left_panel_us_county(layer_info.geojson_obj);
        } else if (layer_info.name == "us_state_case") {
            fill_left_panel_us_state(layer_info.geojson_obj);
        } else if (layer_info.name == "world_case") {
            fill_left_panel_world(layer_info.geojson_obj);
        }
        hide_loader();
        resolve();
    })
}

/////////////////////////////// Initialize Map And Controls ///////////////////////////////

var map = L.map('map', {
    layers: [osm, CartoDB_DarkMatter],
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

L.Control.zoomHome = L.Control.extend({
    options: {
        position: 'topright',
        zoomInText: '+',
        zoomInTitle: 'Zoom in',
        zoomOutText: '-',
        zoomOutTitle: 'Zoom out',
        zoomHomeText: '<i class="fa fa-home" style="line-height:1.65;"></i>',
        zoomHomeTitle: 'Zoom home'
    },

    onAdd: function(map) {
        var controlName = 'gin-control-zoom',
            container = L.DomUtil.create('div', controlName + ' leaflet-bar'),
            options = this.options;

        this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
            controlName + '-in', container, this._zoomIn);
        this._zoomHomeButton = this._createButton(options.zoomHomeText, options.zoomHomeTitle,
            controlName + '-home', container, this._zoomHome);
        this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
            controlName + '-out', container, this._zoomOut);

        this._updateDisabled();
        map.on('zoomend zoomlevelschange', this._updateDisabled, this);

        return container;
    },

    onRemove: function(map) {
        map.off('zoomend zoomlevelschange', this._updateDisabled, this);
    },

    _zoomIn: function(e) {
        this._map.zoomIn(e.shiftKey ? 3 : 1);
    },

    _zoomOut: function(e) {
        this._map.zoomOut(e.shiftKey ? 3 : 1);
    },

    _zoomHome: function(e) {
        //map.setView([lat, lng], zoom);
        if (userLat == null || userLng == null) {
            _switch_layer(il_county_case_layer_object, map);
            map.setView([40, -89], 7)
        } else {
            if (userLat < boundaryIllinois[0][1] && userLat > boundaryIllinois[1][1] &&
                userLng < boundaryIllinois[2][0] && userLng > boundaryIllinois[0][0]) {
                // _switch_layer(il_county_case_layer_object, map);
                map.setView({ lat: userLat, lng: userLng }, 9);

            } else if (userLat < boundaryUS[0][1] && userLat > boundaryUS[1][1] &&
                userLng < boundaryUS[2][0] && userLng > boundaryUS[0][0]) {
                // _switch_layer(us_county_case_layer_object, map);
                map.setView({ lat: userLat, lng: userLng }, 9);

            } else {
                // _switch_layer(world_case_layer_object, map);
                map.setView({ lat: userLat, lng: userLng }, 6);
            }
            addMarker();
        }
    },

    _createButton: function(html, title, className, container, fn) {
        var link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;

        L.DomEvent.on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', fn, this)
            .on(link, 'click', this._refocusOnMap, this);

        return link;
    },

    _updateDisabled: function() {
        var map = this._map,
            className = 'leaflet-disabled';

        L.DomUtil.removeClass(this._zoomInButton, className);
        L.DomUtil.removeClass(this._zoomOutButton, className);

        if (map._zoom === map.getMinZoom()) {
            L.DomUtil.addClass(this._zoomOutButton, className);
        }
        if (map._zoom === map.getMaxZoom()) {
            L.DomUtil.addClass(this._zoomInButton, className);
        }
    }
});


var slider = L.timelineSliderControl({
    formatOutput: function(date) {
        return new Date(date).toLocaleDateString('en-US', { timeZone: 'UTC' })
    },
    steps: 150,
    position: 'topleft',
    showTicks: false
});
map.addControl(slider);

var baseMaps = {
    "Light Mode": osm,
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

var allMapLayers = {
    "Light_Mode": osm,
    "Dark_Mode": CartoDB_DarkMatter,
};

// add layer control to the map
var layerControl = L.control.groupedLayers(baseMaps, groupedOverlays, options);
map.addControl(layerControl);
map.removeLayer(osm);

// add zoom control to the map
var zoomHome = new L.Control.zoomHome();
zoomHome.addTo(map);

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
        slider.addTo(map);
        slider.addTimelines(e.layer);
        // setTime must be after addTo(map), otherwise reset to startTime
        slider.setTime(slider.end);
    }

    refreshLegend(e.layer);
    // Only reset view when the map is already initialized
    if (initializedTag == true) {
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

var getColorFor = function (_num, _bins) {
    return _num > _bins[5] ? '#800026' :
        _num > _bins[4] ? '#BD0026' :
        _num > _bins[3] ? '#E31A1C' :
        _num > _bins[2] ? '#FC4E2A' :
        _num > _bins[1] ? '#FD8D3C' :
        _num > _bins[0] ? '#FEB24C' :
        _num > 0 ? '#FFEDA0' :
        'transparent';
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

    let _onEachFeatureFunc;
    if (layer_info.name == "il_county_case") {
        _onEachFeatureFunc = onEachFeature_il_county_case;
    } else if (layer_info.name == "il_county_death") {
        _onEachFeatureFunc = onEachFeature_il_county_death;
    }else if (layer_info.name == "us_county_case") {
        _onEachFeatureFunc = onEachFeature_us_county_case;
    } else if (layer_info.name == "us_county_death") {
        _onEachFeatureFunc = onEachFeature_us_county_death;
    }else if (layer_info.name == "world_case") {
        _onEachFeatureFunc = onEachFeature_world_case;
    } else if (layer_info.name == "world_death") {
        _onEachFeatureFunc = onEachFeature_world_death;
    } else if (layer_info.name == "us_state_case") {
        _onEachFeatureFunc = onEachFeature_us_state_case;
    } else if (layer_info.name == "us_state_death") {
        _onEachFeatureFunc = onEachFeature_us_state_death;
    }else if (layer_info.name == "il_weekly_case" || 
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

    if (layer_obj.name == "il_county_case") {
        il_county_case_layer_object = layer_obj;
    } else if (layer_obj.name == "il_county_death") {
        il_county_death_layer_object = layer_obj;
    } else if (layer_obj.name == "us_county_case") {
        us_county_case_layer_object = layer_obj;
    } else if (layer_obj.name == "us_county_death") {
        us_county_death_layer_object = layer_obj;
    } else if (layer_obj.name == "world_case") {
        world_case_layer_object = layer_obj;
    } else if (layer_obj.name == "world_death") {
        world_death_layer_object = layer_obj;
    } else if (layer_obj.name == "us_state_case") {
        us_state_case_layer_object = layer_obj;
    } else if (layer_obj.name == "us_state_death") {
        us_state_death_layer_object = layer_obj;
    } else if (layer_obj.name == "il_weekly_case") {
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
        let li = getLayerInfo(e.target.name);
        index = Math.floor((this.time - this.start) / DayInMilSec);
        this.setStyle(li.style_func);
        // Only for the listening of the URL hash change 
        map.fire("mousedown");
    });

    if (layer_info.show) {
        layer_obj.addTo(map);
        slider.addTimelines(layer_obj);
        refreshLegend(layer_obj);
        slider.setTime(slider.end);
    }

    // add layer into LayerControl UI list
    layerControl.addOverlay(layer_obj, layer_info.display_name, layer_info.category);
    allMapLayers[layer_info.name] = layer_obj;

    // switch_left_tab_page_handler
    // switch_left_tab_page_handler(layer_info);

    //popup
}

var addUrlHash = function() {
    // console.log(allMapLayers);
    var hash = new L.Hash(map, allMapLayers);
}

var chain_promise = function (layer_info) {
    return loadGeoJson(layer_info).then(function(result) {
        p1 = add_animation_layer_to_map_promise(result);
        p2 = fill_left_panel_promise(result);
        return Promise.allSettled([p1, p2]);
    })
}

// Promise Entry Point
loadClassJson(class_json_url).then(
    Promise.allSettled(layer_info_list.map(chain_promise)).then(function() {
        switch_left_tab_page_handler_old();
        left_tab_page_table_click_old();
    }).then(function() {
        $('#illinois-tab').css("pointer-events","auto");
        $('#county-tab').css("pointer-events","auto");
        $('#world-tab').css("pointer-events","auto");
    }).then(function() {
        return zoomToUserLocationPromise();
    }).then(function() {
        return Promise.allSettled(layer_info_list_2.map(chain_promise));
    }).then(function() {
        return Promise.allSettled(layer_info_list_3.map(chain_promise));
    }).then(function() {
        addUrlHash();
        return Promise.resolve(1);
    })
);

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
    // console.log(layer_info["tab_page_id"]);
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

    binsChange = ["-50%", "-10%~-50%", "Steady (-10%~10%)", "+10%~+50%", "+50%"];

    legend.onAdd = function(map) {

        var div = L.DomUtil.create('div', 'info legend');

        label1 = ['<strong> Confirmed cases per 100k people </strong>'];
        label_death = ['<strong> Confirmed death per 100k people </strong>'];
        label6 = ['<strong> Weekly Change Rate of New Cases </strong>']
        label7 = ['<strong> Cases </strong>'];

        var legendContent = "";

        // loop through our density intervals and generate a label with a colored square for each interval
        if (_layer == il_county_case_layer_object || _layer == us_county_case_layer_object || _layer == us_state_case_layer_object || _layer == world_case_layer_object || _layer == us_county_death_layer_object || us_state_death_layer_object || _layer == world_death_layer_object || _layer == il_county_death_layer_object) {
            grades = bins;
            // grades start from 0
            legendContent +=
                    '<i style="background:' + getColorFor(0, bins) + '"></i> ' + 0 + '<br>';

            legendContent +=
                    '<i style="background:' + getColorFor(0.000001, bins) + '"></i> ' +
                    0 + '&ndash;' + grades[0] + '<br>' + '<br>';
                    
            for (var i = 0; i < grades.length; i++) {
                legendContent +=
                    '<i style="background:' + getColorFor((grades[i] + 0.000001), bins) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+') + '<br>';
            }
            if (_layer == us_county_death_layer_object || _layer == us_state_death_layer_object || _layer == world_death_layer_object || _layer == il_county_death_layer_object){
                label_death.push(legendContent);
                div.innerHTML = label_death.join('<br><br><br>');
            }
            else{
                label1.push(legendContent);
                div.innerHTML = label1.join('<br><br><br>');
            }
        } 
        else if (_layer == il_weekly_case_layer_object || _layer == us_county_weekly_case_layer_object ||
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

var onEachFeature_il_county_case = function(feature, layer) {
    if (feature.properties) {
        createPopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            il_county_case_layer_object.setStyle(styleFunc1);
            onMapClick(e);
        });
    }
}
var onEachFeature_il_county_death = function(feature, layer) {
    if (feature.properties) {
        createPopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            il_county_death_layer_object.setStyle(styleFunc1_death);
            onMapClick(e);
        });
    }
}
var onEachFeature_us_county_case = function(feature, layer) {
    if (feature.properties) {
        createPopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            us_county_case_layer_object.setStyle(styleFunc1);
            onMapClick(e);
        });
    }
}
var onEachFeature_us_county_death = function(feature, layer) {
    if (feature.properties) {
        createPopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            us_county_death_layer_object.setStyle(styleFunc1_death);
            onMapClick(e);
        });
    }
}
var onEachFeature_world_case = function(feature, layer) {
    if (feature.properties) {
        createPopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            world_case_layer_object.setStyle(styleFunc1);
            onMapClick(e);
        });
    }
}
var onEachFeature_world_death = function(feature, layer) {
    if (feature.properties) {
        createPopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            world_death_layer_object.setStyle(styleFunc1_death);
            onMapClick(e);
        });
    }
}
var onEachFeature_us_state_case = function(feature, layer) {
    if (feature.properties) {
        createPopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            us_state_case_layer_object.setStyle(styleFunc1);
            onMapClick(e);
        });
    }
}

var onEachFeature_us_state_death = function(feature, layer) {
    if (feature.properties) {
        createPopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            us_state_death_layer_object.setStyle(styleFunc1_death);
            onMapClick(e);
        });
    }
}

var onEachFeature_change = function(feature, layer) {
    if (feature.properties) {
        createChangePopup(feature, layer);
        layer.on("click", function(e, layer) {
            //index = Math.floor((layer.time - layer.start) / DayInMilSec);
            il_weekly_case_layer_object.setStyle(styleChange);
            us_county_weekly_case_layer_object.setStyle(styleChange);
            us_state_weekly_case_layer_object.setStyle(styleChange);
            world_weekly_case_layer_object.setStyle(styleChange);
            onMapClick(e);
        });
    }
}

var onMapClick = function (e) {
    e.target.setStyle(highlight);
    
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
    // WHO data started from 2020-01-03
    else if (graphic.properties.start == "2020-01-03") {
        var LabelDate = new Date(2019, 11, 26);
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
        datasetList.push(dic1)
    }

    if (graphic.properties.deaths_ts != undefined) {
        datasetList.push(dic4)
        datasetList.push(dic3)
    }

    if (window.bar != undefined) {
        window.bar.destroy();
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
        //lineAtIndex: [slider.values[0]-firstCaseIndex],
        animation: {
            duration: 0
        },
        responsiveAnimationDuration: 0
    });

    // Prevent the animation of redrawing the chart
    window.bar.update(0);

}

/////////////////////////////////////// Create Popup //////////////////////////////////////

var createPopup = function (_feature, _layer) {
    if (_feature.properties.state_name != undefined) {
        var popupName = _feature.properties.NAME + ", " + _feature.properties.state_name
    } else {
        var popupName = _feature.properties.NAME
    }
    var dt_first_case = new Date(_feature.properties.dt_first_case);
    var dt_first_death = new Date(_feature.properties.dt_first_death);

    function dateCorrection(dateString) {
        if (dateString == "1/1/1970") {
            return "unavailable";
        } else {
            return dateString;
        }

    }

    _layer.bindPopup('<form id="popup-form">\
            <h5 id="name" style="font-weight:bold;">' + popupName + '</h5>\
            <table class="popup-table" style="background-color:white;">\
            <tr class="popup-table-row">\
            <th class="popup-table-header" style="min-width:120px;">Total Cases:</th>\
            <td id="total_cases" class="popup-table-data">' + numberWithCommas(_feature.properties.today_case) + '</td>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header">Total Deaths:</th>\
            <td id="total_deaths" class="popup-table-data">' + numberWithCommas(_feature.properties.today_death) + '</td>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header">Population:</th>\
            <td id="population" class="popup-table-data">' + numberWithCommas(_feature.properties.population) + '</td>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header text-center pt-3 pb-1" colspan=2 style="font-size:13px;">First Date of</th>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header">   Confirmed Cases:</th>\
            <td id="first_date_case" class="popup-table-data">' + dateCorrection(dt_first_case.toLocaleDateString("en-US", { timeZone: "UTC" })) + '</td>\
            </tr>\
            <tr class="popup-table-row">\
            <th class="popup-table-header pb-2">   Deaths:</th>\
            <td id="first_date_death" class="popup-table-data">' + dateCorrection(dt_first_death.toLocaleDateString("en-US", { timeZone: "UTC" })) + '</td>\
            </tr>\
        </table>\
        </form>')
}

var createChangePopup = function (_feature, _layer) {
    if (_feature.properties.state_name != undefined) {
        var popupName = _feature.properties.NAME + ", " + _feature.properties.state_name
    } else {
        var popupName = _feature.properties.NAME
    }

    lastIndex = _feature.properties.change_ts.split(',').length - 1

    _layer.bindPopup('<form id="popup-form">\
            <h5 id="name" style="font-weight:bold;">' + popupName + '</h5>\
            <table class="popup-table" style="background-color:white;">\
            <tr class="popup-table-row">\
            <th class="popup-table-header" style="min-width:120px;">Weekly Change Rate:</th>\
            <td id="total_cases" class="popup-table-data">' + Math.round(100*splitStrFloat(_feature.properties.change_ts, lastIndex)) +'%' + '</td>\
            </tr>\
        </table>\
        </form>')
}