  ///////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////// Set up Basemaps /////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, 
    attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});

  ///////////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// Load GeoJSON File ////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////

function loadJson(json_url) {
    return new Promise((resolve, reject) => {
        $.ajax({
        url: json_url,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            console.log(json_url);
            resolve(data);
        },
        error: function (error) {
            reject(error);
        },
        })
    })
}

var promise=loadJson("preprocessing/classes.json");
var promise0=loadJson("preprocessing/worldwide/who_world_data_leaflet.geojson");
var promise1=loadJson("preprocessing/nyt_states_data_leaflet.geojson");
var promise2=loadJson("preprocessing/nyt_counties_data_leaflet.geojson");
var promise3=loadJson("preprocessing/illinois/dph_county_data_leaflet.geojson");
var promise4=loadJson("preprocessing/illinois/Illinois_ACC_i_leaflet.geojson");
var promise5=loadJson("preprocessing/illinois/Illinois_ACC_v_leaflet.geojson");
var promise6=loadJson("preprocessing/illinois/Chicago_ACC_i_leaflet.geojson");
var promise7=loadJson("preprocessing/illinois/Chicago_ACC_v_leaflet.geojson");

Promise.allSettled([promise, promise0, promise1, promise2, promise3, promise4, promise5, promise6, promise7]).then((values) => {
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

    main();
    console.log("---------------------------------------------");
    console.log("done");
  });

var map = L.map('map', {layers: [osm, Stadia_AlidadeSmoothDark], center: new L.LatLng(40, -89), zoom: 7 });
    var timeline;
    var timelineControl;
    var index = 0;
    const DayInMilSec = 60*60*24*1000;

function main(){

    ///////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////// Define Color Scheme ///////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////
    
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
    
    function splitStr(str,num) {
    var newStr = str.split(",")
    return parseInt(newStr[num])
    }

    var bins = colorClass.dph_illinois.case.nolog.NaturalBreaks.bins.split(",").map(function(item) {
        return parseInt(item, 10);
    });

    function getColorFor(_num,_bins) {
        return _num > _bins[5] ? '#800026' :
        _num > _bins[4] ? '#BD0026' :
        _num > _bins[3] ? '#E31A1C' :
        _num > _bins[2] ? '#FC4E2A' :
        _num > _bins[1] ? '#FD8D3C' :
        _num > _bins[0] ? '#FEB24C' :
        '#FFEDA0';
    }

    var styleFunc = function(_data){
        return {
        stroke: true,
        weight: 1,
        color: getColorFor(splitStr(_data.properties.cases_ts, index),bins),
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

        
    var illinois_counties_ts = L.timeline(illinois_counties,{style: styleFunc,
        waitToUpdateMap: true, onEachFeature: onEachFeature_illinois_counties});
    illinois_counties_ts.addTo(map);

    illinois_counties_ts.on('add', function(){
        bins = colorClass.dph_illinois.case.nolog.NaturalBreaks.bins.split(",").map(function(item) {
            return parseInt(item, 10);
        });		 
    });
    
    illinois_counties_ts.on('change', function(){
        index = Math.floor((this.time-this.start)/DayInMilSec);
        this.setStyle(styleFunc);		 
    });

    var us_states_ts = L.timeline(us_states,{style: styleFunc,
        waitToUpdateMap: true, onEachFeature: onEachFeature_us_states});
    //us_states_ts.addTo(map);

    us_states_ts.on('add', function(){
        bins = colorClass.state.case.nolog.NaturalBreaks.bins.split(",").map(function(item) {
            return parseInt(item, 10);
        });		 
    });
    
    us_states_ts.on('change', function(){
        index = Math.floor((this.time-this.start)/DayInMilSec);
        this.setStyle(styleFunc);		 
    });

    var us_counties_ts = L.timeline(us_counties,{style: styleFunc,
        waitToUpdateMap: true, onEachFeature: onEachFeature_us_counties});
    //us_counties_ts.addTo(map);

    us_counties_ts.on('add', function(){
        bins = colorClass.county.case.nolog.NaturalBreaks.bins.split(",").map(function(item) {
            return parseInt(item, 10);
        });		 
    });
    
    us_counties_ts.on('change', function(){
        index = Math.floor((this.time-this.start)/DayInMilSec);
        this.setStyle(styleFunc);		 
    });

    var world_ts = L.timeline(world,{style: styleFunc,
        waitToUpdateMap: true, onEachFeature: onEachFeature_world});
    //world_ts.addTo(map);

    world_ts.on('add', function(){
        bins = colorClass.who_world.case.nolog.NaturalBreaks.bins.split(",").map(function(item) {
            return parseInt(item, 10);
        });		 
    });
    
    world_ts.on('change', function(){
        index = Math.floor((this.time-this.start)/DayInMilSec);
        this.setStyle(styleFunc);		 
    });

    var chicago_acc_i_ts = L.timeline(chicago_acc_i,{style: styleAccI,
        waitToUpdateMap: true,});
    //chicago_acc_i_ts.addTo(map);
    
    chicago_acc_i_ts.on('change', function(){
        index = Math.floor((this.time-this.start)/DayInMilSec);
        this.setStyle(styleAccI);		 
        });

    var chicago_acc_v_ts = L.timeline(chicago_acc_v,{style: styleAccV,
        waitToUpdateMap: true,});
    //chicago_acc_v_ts.addTo(map);
    
    chicago_acc_v_ts.on('change', function(){
        index = Math.floor((this.time-this.start)/DayInMilSec);
        this.setStyle(styleAccV);		 
        });

    var illinois_acc_i_ts = L.timeline(illinois_acc_i,{style: styleAccI,
        waitToUpdateMap: true,});
    //illinois_acc_i_ts.addTo(map);
    
    illinois_acc_i_ts.on('change', function(){
        index = Math.floor((this.time-this.start)/DayInMilSec);
        this.setStyle(styleAccI);		 
        });

    var illinois_acc_v_ts = L.timeline(illinois_acc_v,{style: styleAccV,
        waitToUpdateMap: true,});
    //illinois_acc_v_ts.addTo(map);
    
    illinois_acc_v_ts.on('change', function(){
        index = Math.floor((this.time-this.start)/DayInMilSec);
        this.setStyle(styleAccV);		 
        });
    
    slider.addTimelines(illinois_counties_ts);
    // slider.addTimelines(illinois_counties_ts, us_counties_ts, us_states_ts, world_ts, 
    // chicago_acc_i_ts, chicago_acc_v_ts, illinois_acc_i_ts, illinois_acc_v_ts);

    var timelineList = [];

    function onOverlayAdd(e){

        // In case of duplicate layers we also need to remove previous timelines
        //console.log(map);
        // map.eachLayer(function (layer) {
        //     map.removeLayer(layer);
        // });
        slider.addTimelines(e.layer);
        //console.log(e);
        if (e.group.name == "Illinois") {
            map.setView([40, -89], 7)
        }else if (e.group.name == "US"){
            map.setView([37, -96], 4)
        }else if (e.group.name == "World"){
            map.setView([0, 0], 2)
        }
        // timelineList.push(e.layer);

        refreshLegend();
    }

    Array.prototype.indexOf = function(val) {
        for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
        }
        return -1;
    };

    Array.prototype.remove = function(val) {
        var index = this.indexOf(val);
        if (index > -1) {
        this.splice(index, 1);
        }
    };

    // function onOverlayRemove(e){
    //     timelineList.remove(e.layer);
    //     slider = L.timelineSliderControl({
    //         formatOutput: function(date){
    //             return new Date(date).toLocaleDateString();
    //         },
    //         steps:150,
    //         position: 'bottomleft',
    //         showTicks: false
    //     });
    //     if (timelineList != []) {
    //         for (i = 0; i < timelineList.length; i++){
    //             slider.addTimelines(timelineList[i]);
    //         }  
    //     }              
    // }

    map.on('overlayadd', onOverlayAdd);
    // map.on('overlayremove', onOverlayRemove);

    ///////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////// Create Legend ///////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////

    var legend = null;

    function refreshLegend() {
        
        if (legend != null) {
            map.removeControl(legend)
        }

        legend = L.control({position: 'bottomright'});

        legend.onAdd = function (map) {

            var div = L.DomUtil.create('div', 'info legend'),
            grades = bins,
            labels = [];
    
            // Changing the grades using unshift somehow also changes bins?
            //grades.unshift(0);
    
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColorFor((grades[i] + 1),bins) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+') +'<br>';
            }
    
            return div;
        };
    
        legend.addTo(map);
    }

    refreshLegend();    

    ///////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////// Create Popup ///////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////

        function onEachFeature_illinois_counties(feature, layer) {
            if (feature.properties) {
                layer.bindPopup(" " +feature.properties.NAME + " "  + "<br>Total cases : " + feature.properties.today_case + " ");
                layer.on("click", function(e){
                    index = Math.floor((illinois_counties_ts.time-illinois_counties_ts.start)/DayInMilSec);
                    illinois_counties_ts.setStyle(styleFunc);
                    onMapClick(e);
                });         
            }
        };

        function onEachFeature_us_counties(feature, layer) {
            if (feature.properties) {
                layer.bindPopup(" " +feature.properties.NAME + " "  + "<br>Total cases : " + feature.properties.today_case + " ");
                layer.on("click", function(e){
                    index = Math.floor((us_counties_ts.time-us_counties_ts.start)/DayInMilSec);
                    us_counties_ts.setStyle(styleFunc);
                    onMapClick(e);
                });    
            }
        };   
        // Need to make it changable with time (use index of cases_ts)

        function onEachFeature_us_states(feature, layer) {
            if (feature.properties) {
                layer.bindPopup(" " +feature.properties.NAME + " "  + "<br>Total cases : " + feature.properties.today_case + " ");
                layer.on("click", function(e){
                    index = Math.floor((us_states_ts.time-us_states_ts.start)/DayInMilSec);
                    us_states_ts.setStyle(styleFunc);
                    onMapClick(e);
                });        
            }
        };

        function onEachFeature_world(feature, layer) {
            if (feature.properties) {
                layer.bindPopup(" " +feature.properties.NAME + " "  + "<br>Total cases : " + feature.properties.today_case + " ");
                layer.on("click", function(e){
                    index = Math.floor((world_ts.time-world_ts.start)/DayInMilSec);
                    world_ts.setStyle(styleFunc);
                    onMapClick(e);
                });
                    
            }
        };

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
                "IDPH County-level Cases": illinois_counties_ts,
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
        // Make the groups exclusive (use radio inputs)
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

        map.whenReady(function() {

            let tab = document.getElementById('illinois-tab');

            let illinois_table = document.getElementById('illinois-table').querySelector('tbody');
            let template = document.querySelector('template')

            let result_list = illinois_counties.features.map(function(value, index) {
                return {
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
                }
                else {
                    instance.querySelector('th').innerHTML = value.county;
                    instance.querySelector('th').setAttribute('data-uid', value.uid);
                    instance.querySelector('th').setAttribute('data-county', value.county);

                    instance.querySelector('.confirmed').innerHTML = '<span>' + numberWithCommas(value.case) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_case);
                    instance.querySelector('.death').innerHTML = '<span>' + numberWithCommas(value.death) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_death);
                    instance.querySelector('.tested').innerHTML = '<span>' + numberWithCommas(value.tested)+ '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_tested);
                    instance.querySelector('.confirmed').setAttribute('data-order', value.case);
                    instance.querySelector('.death').setAttribute('data-order', value.death);
                    instance.querySelector('.tested').setAttribute('data-order', value.tested);
                    illinois_table.appendChild(instance);
                }            
            })

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

            $('#il-search-input').on('input', function() {
                console.log($('#il-search-input').val());
                il_table.search($('#il-search-input').val()).draw();
            });

        });

        var sum_us_counties_today_case = 0;
        var sum_us_counties_today_death = 0;
        var sum_us_counties_today_new_case = 0;
        var sum_us_counties_today_new_death = 0;

        map.whenReady(function() {
            
            let counties_table = document.getElementById('county-table').querySelector('tbody');
            let template = document.querySelectorAll('template')[1]

            let result_list = us_counties.features.map(function(value, index) {
                return {
                    uid: value.properties.OBJECTID,
                    county: value.properties.NAME,
                    state: value.properties.state_name,
                    case: value.properties.today_case,
                    new_case: value.properties.today_new_case,
                    death: value.properties.today_death,
                    new_death: value.properties.today_new_death,
                }
            });

            //console.log(result_list);

            result_list.forEach(function(value) {
                let instance = template.content.cloneNode(true);

                instance.querySelector('th').innerHTML = value.county + ", " + value.state;
                instance.querySelector('th').setAttribute('data-uid', value.uid);
                instance.querySelector('th').setAttribute('data-county', value.county);
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

            $('#w-search-input').on('input', function() {
                console.log($('#w-search-input').val());
                county_table.search($('#w-search-input').val()).draw();
            });

        });

        var sum_world_today_case = 0;
        var sum_world_today_death = 0;
        var sum_world_today_new_case = 0;
        var sum_world_today_new_death = 0;

        map.whenReady(function() {       

            let worlds_table = document.getElementById('world-table').querySelector('tbody');
            let template = document.querySelectorAll('template')[1]

            let result_list = world.features.map(function(value, index) {
                return {
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

            $('#world-search-input').on('input', function() {
                console.log($('#world-search-input').val());
                world_table.search($('#world-search-input').val()).draw();
            });

        });


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

}

  