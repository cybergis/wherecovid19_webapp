require([
    "esri/Map",
    "esri/layers/FeatureLayer",
    "esri/views/MapView",
    "esri/core/promiseUtils",
    "esri/widgets/Legend",
    "esri/widgets/Home",
    "esri/widgets/Slider",
    "esri/widgets/Fullscreen",
    "esri/geometry/SpatialReference",
    "esri/geometry/Point",
    "esri/Basemap",
    "esri/layers/MapImageLayer",
    "esri/symbols/SimpleFillSymbol",
    "esri/layers/GroupLayer",
    "esri/widgets/LayerList",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Expand",
    "esri/layers/GeoJSONLayer",
    "esri/tasks/support/Query",
    "esri/geometry/geometryEngine",
    "esri/layers/support/LabelClass",
    "esri/widgets/Zoom",
    "dojo/dom",
    "dojo/on",
    "dojo/Evented",
    "dojo/date",
    "dojo/date/locale",
    "dojox/data/CsvStore",
    "dojo/request",
    "dojo/DeferredList",
    "dojo/Stateful",
    "dojo/_base/declare",
    "dojo/query",
    "dojo",
    "dojo/domReady!"
], function(
    Map,
    FeatureLayer,
    MapView,
    promiseUtils,
    Legend,
    Home,
    Slider,
    Fullscreen,
    SpatialReference,
    Point,
    Basemap,
    MapImageLayer,
    SimpleFillSymbol,
    GroupLayer,
    LayerList,
    BasemapGallery,
    Expand,
    GeoJSONLayer,
    Query,
    geometryEngine,
    LabelClass,
    Zoom,
    dom,
    on,
    Evented,
    date,
    locale,
    CsvStore,
    request,
    DeferredList,
    Stateful,
    declare,
    query,
    dojo,
) {

    // Subclass dojo/Stateful:
    const MyWatcher = declare([Stateful], {
        active_animation_layer: null,
        _active_animation_layerGetter: function() {
            return this.active_animation_layer;
        },
        _active_animation_layerSetter: function(value) {
            this.active_animation_layer = value;
        }
    });

    // Create an instance and initialize some property values:
    const mywatcher = new MyWatcher({
        active_animation_layer: null,
    });
    // first time the animation button is clicked for this layer?
    var flag_first_click_anination_per_layer = true;

    var production_mode = false; //true or false

    //global variables contain data
    var counties_data = null;
    var counties_data_str = null;
    var states_data = null;
    var states_data_str = null;
    var classes_data = null;
    var dynamic_classes_data = null;
    var visualizationSchema = {
        'dph_illinois': {
            'case': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'death': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'case_per_100k_capita': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'death_per_100k_capita': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'tested': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks'
            },
            'zipcode_case': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks'
            },
            'zipcode_tested': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks'
            },
        },
        'illinois': {
            'case': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'death': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'case_per_100k_capita': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'death_per_100k_capita': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            }
        },
        'state': {
            'case': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'death': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'case_per_100k_capita': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'death_per_100k_capita': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            }
        },
        'county': {
            'case': {
                'value': 'log',
                'breaks': 'NaturalBreaks',
            },
            'death': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'case_per_100k_capita': {
                'value': 'nolog',
                'breaks': 'Quantiles',
            },
            'death_per_100k_capita': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            }
        },
        'who_world': {
            'case': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
            'death': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            }
        },
        'vulnerability': {
            'case': {
                'value': 'nolog',
                'breaks': 'NaturalBreaks',
            },
        }
    }

    // main() is called after external json file is loaded
    function main(arg1) {

        //--------------------------------------------------------------------------
        //
        //  Setup UI
        //
        //--------------------------------------------------------------------------

        var applicationDiv = document.getElementById("applicationDiv");
        var sliderValue = document.getElementById("sliderValue");
        var playButton = document.getElementById("playButton");
        var animation = null;
        var slider = null;
        var sliderDiv = document.getElementById("sliderContainer");
        var myChart = document.getElementById('myChart').getContext('2d');


        //--------------------------------------------------------------------------
        //
        //  Setup Map and View
        //
        //--------------------------------------------------------------------------
        var nyt_layer_states_url = "preprocessing/nyt_states_data.geojson";
        var nyt_layer_counties_url = "preprocessing/nyt_counties_data.geojson";
        var illinois_hospitals_url = "preprocessing/illinois/illinois_hospitals.geojson";
        var illinois_testing_url = "preprocessing/illinois/illinois_testing.geojson";
        var dph_illinois_zipcode_url = "preprocessing/illinois/dph_zipcode_data.geojson";
        var dph_illinois_county_dynamic_url = "preprocessing/illinois/dph_county_data.geojson";
        var dph_illinois_county_static_url = "preprocessing/illinois/dph_county_static_data.geojson";
        var chicago_hospitals_url = "preprocessing/illinois/chicago_hospitals.geojson";
        var chicago_acc_i_url = "preprocessing/illinois/Chicago_ACC_i.geojson";
        var chicago_acc_v_url = "preprocessing/illinois/Chicago_ACC_v.geojson";
        var illinois_acc_i_url = "preprocessing/illinois/Illinois_ACC_i.geojson";
        var illinois_acc_v_url = "preprocessing/illinois/Illinois_ACC_v.geojson";
        var who_world_layer_url = "preprocessing/worldwide/who_world_data.geojson";
        var vulnerability_layer_url = "preprocessing/illinois/vulnerability.geojson";

        const default_polygon_renderer = {
            type: "simple",
            symbol: {
                type: "simple-fill",
                color: [0, 0, 0, 0.1],
                outline: { // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.2],
                }
            }
        };

        var chicago_acc_hospitals_i = new GeoJSONLayer({
            url: chicago_hospitals_url,
            outFields: ["*"],
            title: "Accessibility (ICU Beds-Chicago)",
            renderer: {
                type: "simple",
                symbol: {
                    type: "simple-marker",
                    style: "cross",
                    color: "red",
                    size: "10px",
                    outline: {
                        color: [255, 0, 0, 1],
                        width: "3px"
                    }
                }
            },
            listMode: "hide",
            legendEnabled: false,
            visible: false,
        });

        var chicago_acc_hospitals_v = new GeoJSONLayer({
            url: chicago_hospitals_url,
            outFields: ["*"],
            title: "Accessibility (Ventilators-Chicago)",
            renderer: {
                type: "simple",
                symbol: {
                    type: "simple-marker",
                    style: "cross",
                    color: "red",
                    size: "10px",
                    outline: {
                        color: [255, 0, 0, 1],
                        width: "3px"
                    }
                }
            },
            listMode: "hide",
            legendEnabled: false,
            visible: false,
        });

        var illinois_acc_hospitals_i = new GeoJSONLayer({
            url: illinois_hospitals_url,
            outFields: ["*"],
            title: "Accessibility (ICU Beds-State)",
            renderer: {
                type: "simple",
                symbol: {
                    type: "simple-marker",
                    style: "cross",
                    color: "red",
                    size: "10px",
                    outline: {
                        color: [255, 0, 0, 1],
                        width: "3px"
                    }
                }
            },
            listMode: "hide",
            legendEnabled: false,
            visible: false,
        });

        var illinois_acc_hospitals_v = new GeoJSONLayer({
            url: illinois_hospitals_url,
            outFields: ["*"],
            title: "Accessibility (Ventilators-State)",
            renderer: {
                type: "simple",
                symbol: {
                    type: "simple-marker",
                    style: "cross",
                    color: "red",
                    size: "10px",
                    outline: {
                        color: [255, 0, 0, 1],
                        width: "3px"
                    }
                }
            },
            listMode: "hide",
            legendEnabled: false,
            visible: false,
        });

        var chicago_acc_i_layer = new GeoJSONLayer({
            url: chicago_acc_i_url,
            outFields: ["*"],
            title: "Accessibility (ICU Beds-Chicago)",
            visible: false,
            renderer: default_polygon_renderer,
        })

        var chicago_acc_v_layer = new GeoJSONLayer({
            url: chicago_acc_v_url,
            outFields: ["*"],
            title: "Accessibility (Ventilators-Chicago)",
            visible: false,
            renderer: default_polygon_renderer,
        })

        var illinois_acc_i_layer = new GeoJSONLayer({
            url: illinois_acc_i_url,
            outFields: ["*"],
            title: "Accessibility (ICU Beds-State)",
            visible: false,
            renderer: default_polygon_renderer,
        })

        var illinois_acc_v_layer = new GeoJSONLayer({
                url: illinois_acc_v_url,
                outFields: ["*"],
                title: "Accessibility (Ventilators-State)",
                visible: false,
                renderer: default_polygon_renderer,
            })
            //who worldwide
        var who_world_layer = new GeoJSONLayer({
            url: who_world_layer_url,
            outFields: ["*"],
            title: "WHO Country-level Cases",
            visible: false,
            renderer: default_polygon_renderer,
        });

        //nyt states
        var nyt_layer_states = new GeoJSONLayer({
            url: nyt_layer_states_url,
            outFields: ["*"],
            title: "US States (New York Times)",
            visible: false,
            renderer: default_polygon_renderer,
        });

        //nyt counties
        var nyt_layer_counties = new GeoJSONLayer({
            url: nyt_layer_counties_url,
            outFields: ["*"],
            title: "US Counties (New York Times)",
            visible: false,
            renderer: default_polygon_renderer,
        });

        var dph_illinois_zipcode = new GeoJSONLayer({
            url: dph_illinois_zipcode_url,
            outFields: ["*"],
            title: "IDPH Zipcode-level Cases",
            renderer: dphStaticRender("zipcode_case"),
            visible: false,
        });
        var dph_illinois_county_static = new GeoJSONLayer({
            url: dph_illinois_county_static_url,
            outFields: ["*"],
            title: "IDPH County-level Testing Data",
            renderer: dphStaticRender("tested"),
            visible: false,
        });

        var dph_illinois_county_dynamic = new GeoJSONLayer({
            url: dph_illinois_county_dynamic_url,
            outFields: ["*"],
            title: "IDPH County-level Cases",
            renderer: default_polygon_renderer,
            visible: false,
        });

        var illinois_hospitals = new GeoJSONLayer({
            url: illinois_hospitals_url,
            outFields: ["*"],
            title: "Hospital Locations",
            renderer: {
                type: "simple",
                symbol: {
                    type: "picture-marker",
                    url: "img/hospital.png",
                    width: "32px",
                    height: "32px"
                }
            },
            visible: false,
        });

        var illinois_testing = new GeoJSONLayer({
            url: illinois_testing_url,
            outFields: ["*"],
            title: "Testing Cases",
            renderer: {
                type: "unique-value",
                field: "Test_Result",
                uniqueValueInfos: [{
                    value: "Positive",
                    symbol: {
                        type: "simple-marker",
                        size: 12,
                        color: "red",
                    }
                }, {
                    value: "Negative",
                    symbol: {
                        type: "simple-marker",
                        size: 12,
                        color: "blue",
                    }
                }]
            },
            visible: false,
        });

        var vulnerability_layer = new GeoJSONLayer({
            url: vulnerability_layer_url,
            outFields: ["*"],
            title: "Vulnerability",
            visible: true,
            renderer: default_polygon_renderer,
        });

        // Some Layer Types can NOT be published on ArcGIS Online
        // https://developers.arcgis.com/documentation/core-concepts/layers/
        // references an ArcGIS Online item pointing to a Map Service Layer

        var hiv_layer = new MapImageLayer({
            url: "https://dev.rmms.illinois.edu/iepa/rest/services/wherecovid19/HIV_Map/MapServer",
            title: "Density of PLWH (Persons Living with HIV)",
            visible: false,
            listMode: "hide-children",
        });

        var svi_layer = new MapImageLayer({
            url: "https://dev.rmms.illinois.edu/iepa/rest/services/wherecovid19/SVI_2018/MapServer",
            title: "CDC Social Vulnerability Index",
            visible: false,
            listMode: "hide-children",
        });

        var testing_sites_layer = new MapImageLayer({
            url: "https://dev.rmms.illinois.edu/iepa/rest/services/wherecovid19/Testing_Sites/MapServer",
            title: "Testing Sites",
            visible: false,
            listMode: "hide-children",
        });

        // order matters! last layer is at top
        var animation_layers = [who_world_layer, nyt_layer_states, nyt_layer_counties,
            dph_illinois_county_dynamic, chicago_acc_i_layer, chicago_acc_v_layer,
            illinois_acc_i_layer, illinois_acc_v_layer, vulnerability_layer
        ];
        var static_layers = [chicago_acc_hospitals_i, chicago_acc_hospitals_v,
            illinois_acc_hospitals_i, illinois_acc_hospitals_v, illinois_hospitals, illinois_testing,
            dph_illinois_zipcode, dph_illinois_county_static, hiv_layer, svi_layer, testing_sites_layer
        ];

        var world_group = new GroupLayer({
            title: "World",
            visible: false,
            visibilityMode: "independent",
            layers: [who_world_layer],
            opacity: 0.75
        });

        var us_group = new GroupLayer({
            title: "US",
            visible: false,
            visibilityMode: "independent",
            layers: [nyt_layer_states, nyt_layer_counties],
            opacity: 0.75
        });

        var illinois_group = new GroupLayer({
            title: "Illinois",
            visible: true,
            visibilityMode: "independent",
            layers: [illinois_hospitals, testing_sites_layer, svi_layer, hiv_layer,
                dph_illinois_zipcode, dph_illinois_county_static, dph_illinois_county_dynamic,
                chicago_acc_i_layer, chicago_acc_v_layer, chicago_acc_hospitals_i, chicago_acc_hospitals_v,
                illinois_acc_i_layer, illinois_acc_v_layer, illinois_acc_hospitals_i, illinois_acc_hospitals_v,
                vulnerability_layer
            ],
            opacity: 0.75
        });

        // A non-3857 basemap
        // var basemap = new Basemap({
        //     baseLayers: [
        //         new MapImageLayer({
        //             url: "https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT3978/MapServer",
        //             title: "Basemap"
        //         })
        //     ],
        //     title: "basemap",
        //     id: "basemap"
        // });

        var map = new Map({
            //basemap: basemap,
            basemap: {
                portalItem: {
                    id: "4f2e99ba65e34bb8af49733d9778fb8e",
                }
            },
            layers: [world_group, us_group, illinois_group],
        });

        // Set up callback function for active_animation_layer value change before any map things
        setupActiveAnimationLayerChangeCallback();


        // This event will be triggered once at startup as maps adds layers for the fist time
        // Listen for layer change: remove, add, reorder
        // https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html#layers
        map.allLayers.on("change", function(event) {
            // this function will change active_animation_layer value
            setActiveAnimationLayer(event);
        });

        var view = new MapView({
            map: map,
            container: "viewDiv",
            //spatialReference: new SpatialReference(wkid: 3857}),
            center: [-89.7, 40],
            zoom: 5.5,
            // constraints: {
            //     snapToZoom: false,
            //     //minScale: 72223.819286,
            //     rotationEnabled: false
            // },
            // This ensures that when going fullscreen
            // The top left corner of the view extent
            // stays aligned with the top left corner
            // of the view's container
            resizeAlign: "top-left"
        });

        // All the resources in the MapView and the map have loaded. Now execute additional processes
        // https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html
        // entry point after map is initialized
        view.when(setActiveAnimationLayer("view.when"));

        function addClass2Elem(elem, add, class_name) {
            //https://stackoverflow.com/questions/639815/how-to-disable-all-div-content/25328170
            //https://dojotoolkit.org/reference-guide/1.7/dojo/removeClass.html
            if (add) {
                if (!dojo.hasClass(elem, class_name)) {
                    dojo.addClass(elem, class_name);
                }
            } else {
                dojo.removeClass(elem, class_name);
            }
        }

        // Find the top visible layer obj in array filter_array
        function getTopVisibleLayer(layerCol, filter_array = []) {
            // start from the end of the array (top)
            for (let i = layerCol.items.length - 1; i >= 0; i--) {
                let layer = layerCol.items[i];
                if (layer.visible) {
                    if (layer.type == "group") {
                        let l = getTopVisibleLayer(layer.layers, filter_array);
                        if (l != null) {
                            return l;
                        }
                    } else {
                        if (filter_array.length == 0) {
                            return layer;
                        } else {
                            if (filter_array.includes(layer)) {
                                return layer;
                            }
                        }
                    }
                }
            }
            return null;
        }

        // called when layer order changed in layerlist control or layer visibility changed
        function setActiveAnimationLayer(evt) {
            stopAnimation();
            // reset active_animation_layer
            let topVisibleLayer = getTopVisibleLayer(map.layers, animation_layers);
            mywatcher.set("active_animation_layer", topVisibleLayer);
            //Setup hover effects
            if (topVisibleLayer != chicago_acc_i_layer &&
                topVisibleLayer != chicago_acc_v_layer &&
                topVisibleLayer != illinois_acc_i_layer &&
                topVisibleLayer != illinois_acc_v_layer &&
                topVisibleLayer != vulnerability_layer) {
                view.whenLayerView(topVisibleLayer).then(setupHoverTooltip);
            }
        }

        // Listen for layer visibility change
        // may get triggered more than once in if GroupLayer is in "exclusive" mode (radio button)
        // LayerA on->off and LayerB off->on
        // https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=animation-layer-visibility
        map.allLayers.forEach(function(item) {
            item.watch("visible", function(visible) {
                // console.log(item.title, visible)
                if (visible === true && item.type !== "group") {
                    map.layers.forEach(function(value) {

                        if (value.title === item.parent.title) {
                            value.visible = true;
                            value.layers.forEach(function(val) {
                                if (val.title === item.title) {
                                    val.visible = true;
                                } else {
                                    val.visible = false;
                                }
                            });
                        } else {
                            value.visible = false;
                            value.layers.forEach(function(val) {
                                val.visible = false;
                            });
                        }
                    });

                    if (item.title === chicago_acc_i_layer.title ||
                        item.title === chicago_acc_v_layer.title ||
                        item.title === chicago_acc_hospitals_i.title ||
                        item.title === chicago_acc_hospitals_v) {
                        view.goTo({
                            center: [-87.631721, 41.868428],
                            zoom: 10,
                        });
                    } else if (item.parent.title === us_group.title || item.title === us_group.title) {
                        view.goTo({
                            center: [-96.984300, 40.474679],
                            zoom: 3
                        });
                    } else if (item.parent.title === illinois_group.title || item.title === illinois_group.title) {
                        view.goTo({
                            center: [-88.984300, 40.474679],
                            zoom: 6
                        });
                    } else if (item.parent.title === world_group.title || item.title === world_group.title) {
                        view.goTo({
                            center: [-60, 20],
                            zoom: 2
                        });
                    }
                } // if(visible === true){
                setActiveAnimationLayer(item);

                isResponsiveSize = view.widthBreakpoint === "xsmall" || view.widthBreakpoint === "small";
                console.log(isResponsiveSize);
                if (!isResponsiveSize) {
                    // close the side bar when the layer is changed 
                    if ($(".sidebar").hasClass("open")) {
                        $('#sidebar_control').removeClass("open").addClass("closed");
                        $(".sidebar").css('display', 'none').removeClass("open").addClass("closed");
                        // $(".sidebar").removeClass("open").hide("slide", { direction: "left" }, 1000).addClass("closed");
                        $("main").addClass("map-fullscreen");
                    }
                }
            });
        });

        var layerlist = new LayerList({
            view: view,
            //listItemCreatedFunction: defineActions,
            selectionEnabled: false,
            visibleElements: {
                statusIndicators: false
            },
        });

        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        setListview();

        function setListview() {

            const illinois_query = dph_illinois_county_static.createQuery();

            illinois_query.where = "NAME = 'Illinois'";
            illinois_query.outFields = ["confirmed_cases", "total_tested", "deaths"];

            dph_illinois_county_static.queryFeatures(illinois_query)
                .then(function(response) {
                    let stats = response.features[0].attributes;
                    let tab = document.getElementById('illinois-tab');
                    tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(stats.confirmed_cases)
                    let case_div = document.getElementById('illinois_total_case_number')
                        // console.log(case_div.querySelector('.case-number').innerHTML)
                    let test_div = document.getElementById('illinois_total_test_number')
                    let death_div = document.getElementById('illinois_total_death_number')
                    case_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.confirmed_cases)
                    death_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.deaths)
                    test_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.total_tested)
                });

            const illinois_list_query = dph_illinois_county_static.createQuery();
            illinois_list_query.orderByFields = ['confirmed_cases DESC'];

            dph_illinois_county_static.queryFeatures(illinois_list_query)
                .then(function(response) {
                    console.log(response);
                    let illinois_table = document.getElementById('illinois-table').querySelector('tbody');
                    let template = document.querySelector('template')
                    let result_list = response.features.map(function(value) {
                        return {
                            centroid_x: value.geometry.centroid.x,
                            centroid_y: value.geometry.centroid.y,
                            uid: value.attributes.OBJECTID,
                            county: value.attributes.County,
                            case: value.attributes.confirmed_cases,
                            death: value.attributes.deaths,
                            tested: value.attributes.total_tested
                        }
                    });
                    result_list.forEach(function(value, index) {
                        if (value.county !== "Illinois") {
                            let instance = template.content.cloneNode(true);
                            instance.querySelector('th').innerHTML = value.county;
                            instance.querySelector('th').setAttribute('data-x', value.centroid_x);
                            instance.querySelector('th').setAttribute('data-y', value.centroid_y);
                            instance.querySelector('th').setAttribute('data-uid', index);
                            instance.querySelector('th').setAttribute('data-county', value.county);
                            instance.querySelector('.confirmed').innerHTML = numberWithCommas(value.case);
                            instance.querySelector('.tested').innerHTML = numberWithCommas(value.tested);
                            instance.querySelector('.death').innerHTML = numberWithCommas(value.death);
                            instance.querySelector('.confirmed').setAttribute('data-order', value.case);
                            instance.querySelector('.death').setAttribute('data-order', value.death);
                            instance.querySelector('.tested').setAttribute('data-order', value.tested);
                            illinois_table.appendChild(instance);
                        }
                    })

                    var illini_table = $('#illinois-table').DataTable({
                        paging: true,
                        pagingType: "full_numbers",
                        pageLength: 50,
                        ordering: true,
                        order: [
                            [1, "desc"]
                        ],
                        info: false,
                        responsive: true,
                        dom: "t",
                    });

                    $('#il-search-input').on('input', function() {
                        console.log($('#il-search-input').val());
                        illini_table.search($('#il-search-input').val()).draw();
                    });
                });

            const counties_query = nyt_layer_counties.createQuery();
            const countiesConfrimed = {
                onStatisticField: "today_case",
                outStatisticFieldName: "Total_Cases",
                statisticType: "sum"
            }
            const countiesDeath = {
                onStatisticField: "today_death",
                outStatisticFieldName: "Total_Deaths",
                statisticType: "sum"
            }
            const countiesNewConfrimed = {
                onStatisticField: "today_new_case",
                outStatisticFieldName: "Total_New_Cases",
                statisticType: "sum"
            }
            const countiesNewDeath = {
                onStatisticField: "today_new_death",
                outStatisticFieldName: "Total_New_Deaths",
                statisticType: "sum"
            }
            counties_query.outStatistics = [countiesConfrimed, countiesDeath, countiesNewConfrimed, countiesNewDeath];
            nyt_layer_counties.queryFeatures(counties_query)
                .then(function(response) {
                    let stats = response.features[0].attributes;
                    let tab = document.getElementById('county-tab');
                    tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(stats.Total_Cases)
                    let case_div = document.getElementById('counties_total_case_number')
                    let death_div = document.getElementById('counties_total_death_number')
                    case_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.Total_Cases)
                    case_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(stats.Total_New_Cases)
                    death_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.Total_Deaths)
                    death_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(stats.Total_New_Deaths)
                });

            const counties_list_query = nyt_layer_counties.createQuery();
            counties_list_query.orderByFields = ['today_case DESC'];
            nyt_layer_counties.queryFeatures(counties_list_query)
                .then(function(response) {
                    console.log(response)
                    let couneites_table = document.getElementById('county-table').querySelector('tbody');
                    let template = document.querySelectorAll('template')[1]
                    let result_list = response.features.map(function(value, index) {
                        return {
                            centroid_x: value.geometry.centroid.x,
                            centroid_y: value.geometry.centroid.y,
                            uid: value.attributes.OBJECTID,
                            county: value.attributes.NAME,
                            state: value.attributes.state_name,
                            case: value.attributes.today_case,
                            new_case: value.attributes.today_new_case,
                            death: value.attributes.today_death,
                            new_death: value.attributes.today_new_death,
                        }
                    });
                    //result = result_list.slice(0, 100);
                    result_list.forEach(function(value) {
                        let instance = template.content.cloneNode(true);

                        instance.querySelector('th').innerHTML = value.county + ", " + value.state;
                        instance.querySelector('th').setAttribute('data-x', value.centroid_x);
                        instance.querySelector('th').setAttribute('data-y', value.centroid_y);
                        instance.querySelector('th').setAttribute('data-uid', value.uid);
                        instance.querySelector('th').setAttribute('data-county', value.county);
                        instance.querySelector('.confirmed').innerHTML = '<span>' + numberWithCommas(value.case) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_case);
                        instance.querySelector('.death').innerHTML = '<span>' + numberWithCommas(value.death) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_death);
                        instance.querySelector('.confirmed').setAttribute('data-order', value.case);
                        instance.querySelector('.death').setAttribute('data-order', value.death);
                        couneites_table.appendChild(instance);
                    })
                    var county_table = $('#county-table').DataTable({
                        paging: true,
                        pagingType: "full_numbers",
                        pageLength: 50,
                        ordering: true,
                        order: [
                            [1, "desc"]
                        ],
                        info: false,
                        responsive: true,
                        dom: "t",
                    });

                    $('#w-search-input').on('input', function() {
                        console.log($('#w-search-input').val());
                        county_table.search($('#w-search-input').val()).draw();
                    });

                });

            const world_query = who_world_layer.createQuery();
            const worldConfrimed = {
                onStatisticField: "today_case",
                outStatisticFieldName: "Total_Cases",
                statisticType: "sum"
            }
            const worldDeath = {
                onStatisticField: "today_death",
                outStatisticFieldName: "Total_Deaths",
                statisticType: "sum"
            }
            const worldNewConfrimed = {
                onStatisticField: "yesterday_new_case",
                outStatisticFieldName: "Total_New_Cases",
                statisticType: "sum"
            }
            const worldNewDeath = {
                onStatisticField: "yesterday_new_death",
                outStatisticFieldName: "Total_New_Deaths",
                statisticType: "sum"
            }
            world_query.outStatistics = [worldConfrimed, worldDeath, worldNewConfrimed, worldNewDeath];
            who_world_layer.queryFeatures(world_query)
                .then(function(response) {
                    let stats = response.features[0].attributes;
                    let tab = document.getElementById('world-tab');
                    tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(stats.Total_Cases)
                    let case_div = document.getElementById('world_total_case_number')
                    let death_div = document.getElementById('world_total_death_number')
                    case_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.Total_Cases)
                    case_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(stats.Total_New_Cases)
                    death_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.Total_Deaths)
                    death_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> " + numberWithCommas(stats.Total_New_Deaths)
                });

            const world_list_query = who_world_layer.createQuery();
            world_list_query.orderByFields = ['today_case DESC'];
            who_world_layer.queryFeatures(world_list_query)
                .then(function(response) {
                    console.log(response)
                    let couneites_table = document.getElementById('world-table').querySelector('tbody');
                    let template = document.querySelectorAll('template')[1]
                    let result_list = response.features.map(function(value, index) {
                        return {
                            centroid_x: value.geometry.centroid.x,
                            centroid_y: value.geometry.centroid.y,
                            uid: value.attributes.OBJECTID,
                            country: value.attributes.NAME,
                            case: value.attributes.today_case,
                            new_case: value.attributes.today_new_case,
                            death: value.attributes.today_death,
                            new_death: value.attributes.today_new_death,
                        }
                    });
                    //result = result_list.slice(0, 100);
                    result_list.forEach(function(value) {
                        let instance = template.content.cloneNode(true);

                        instance.querySelector('th').innerHTML = value.country;
                        instance.querySelector('th').setAttribute('data-x', value.centroid_x);
                        instance.querySelector('th').setAttribute('data-y', value.centroid_y);
                        instance.querySelector('th').setAttribute('data-uid', value.uid);
                        instance.querySelector('th').setAttribute('data-country', value.country);
                        instance.querySelector('.confirmed').innerHTML = '<span>' + numberWithCommas(value.case) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_case);
                        instance.querySelector('.death').innerHTML = '<span>' + numberWithCommas(value.death) + '</span><br><i class="fas fa-caret-up"></i> ' + numberWithCommas(value.new_death);
                        instance.querySelector('.confirmed').setAttribute('data-order', value.case);
                        instance.querySelector('.death').setAttribute('data-order', value.death);
                        couneites_table.appendChild(instance);
                    })
                    var world_table = $('#world-table').DataTable({
                        paging: true,
                        pagingType: "full_numbers",
                        pageLength: 50,
                        ordering: true,
                        order: [
                            [1, "desc"]
                        ],
                        info: false,
                        dom: "t",
                    });

                    $('#world-search-input').on('input', function() {
                        console.log($('#world-search-input').val());
                        world_table.search($('#world-search-input').val()).draw();
                    });

                });

        }

        // Zero-based Month: 0==Jan
        const dt_startConst = new Date(2020, 0, 14);
        var dt_start = dt_startConst;
        //var old_dt_start = dt_start;
        var dt_interval_unit = "day";


        function queryLayerDates(_layer) {
            const list_query = _layer.createQuery();
            //list_query.orderByFields = ['population DESC'];
            list_query.returnGeometry = false;
            list_query.num = 1;
            list_query.outFields = ["dt_start", "dt_end", "dt_unit"];
            return _layer.queryFeatures(list_query);
        }

        function initSlider(response) {
            let feature0_attrs = response.features[0].attributes;
            let _dt_start_str = feature0_attrs["dt_start"];
            let _dt_end_str = feature0_attrs["dt_end"];

            if (feature0_attrs.hasOwnProperty("dt_unit")) {
                dt_interval_unit = feature0_attrs["dt_unit"];
            } else {
                dt_interval_unit = "day";
            }

            //dt_interval_unit = "day";
            let _dt_end = locale.parse(_dt_end_str, {
                datePattern: "yyyy-MM-dd",
                selector: "date"
            });
            let _dt_start = locale.parse(_dt_start_str, {
                datePattern: "yyyy-MM-dd",
                selector: "date"
            });
            dt_start = _dt_start;

            // if (dt_interval_unit == "day") {
            //     dt_start = dt_startConst;
            // }

            let _slider_max = date.difference(dt_start, _dt_end, dt_interval_unit);
            //console.log(_slider_max);


            if (slider == null) {
                slider = new Slider({
                    container: "slider",
                    min: 0,
                    max: _slider_max,
                    values: [_slider_max],
                    step: 1,
                    visibleElements: {
                        rangeLabels: true
                    },
                    draggableSegmentsEnabled: false,
                });
                slider.on("thumb-drag", inputHandler);
            } else {
                slider.min = 0;
                slider.max = _slider_max;
            }
        }

        function setupActiveAnimationLayerChangeCallback() {
            // Watch changes on a property:
            mywatcher.watch("active_animation_layer", onActiveAnimationLayerChange);
        }

        function onActiveAnimationLayerChange(name, oldValue, value) {

            //Undock popup window
            view.popup.dockEnabled = false;

            //Hide the chart
            document.getElementById('myChart').classList.add("d-none");
            document.getElementById('myChart').classList.remove("d-block");

            var old_dt_start = dt_start;
            if (slider != null) {
                var old_slider_value = slider.values[0];
            }

            //console.log(name, oldValue, value);
            // reset flag when animation layer changed
            flag_first_click_anination_per_layer = true;
            if (value == null) {
                addClass2Elem(sliderDiv, true, "hideDiv");
            } else {
                if (value != oldValue) {
                    // enable slider div
                    addClass2Elem(sliderDiv, false, "hideDiv");
                    queryLayerDates(value).then(initSlider).then(function() {

                        console.log(slider);

                        let thumb_value = slider.values[0]

                        if (old_dt_start != undefined) {
                            // Calculate the change of start dates for two different layers
                            var start_date_change = date.difference(old_dt_start, dt_start, dt_interval_unit);
                            // Remain on the same date while switching layers
                            // Instead of current slider value, we need to use the slider value of previous layer
                            thumb_value = old_slider_value - start_date_change;

                        }

                        if (thumb_value < slider.min) {
                            thumb_value = slider.min;
                        } else if (thumb_value > slider.max) {
                            thumb_value = slider.max;
                        }

                        let dt_thumb = date.add(dt_start, dt_interval_unit, thumb_value);

                        setDate(dt_thumb, animation_type = animation_type);
                    });
                }
            }
        }


        // When user drags the slider:
        //  - stops the animation
        //  - set the visualized year to the slider one.
        function inputHandler(event) {
            //console.log("Drag");
            stopAnimation();
            let thumb_value = Math.floor(event.value);
            //console.log(thumb_value);
            let dt_thumb = date.add(dt_start, dt_interval_unit, thumb_value);
            //console.log(dt_thumb);
            setDate(dt_thumb, animation_type = animation_type);
            updateChart(hitGraphic);
        }

        // Toggle animation on/off when user
        // clicks on the play button
        playButton.addEventListener("click", function() {
            if (playButton.classList.contains("toggled")) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });

        view.popup.autoOpenEnabled = true;
        view.popup.autoCloseEnabled = true;

        /////////////////////////////////////////////////////////////////
        //////////////////////////Responsive/////////////////////////////
        /////////////////////////////////////////////////////////////////

        view.ui.empty("top-left");

        view.ui.add(
            new Zoom({
                view: view
            }),
            "top-right"
        );

        view.ui.add(
            new Home({
                view: view
            }),
            "top-right"
        );

        view.ui.add(
            new Fullscreen({
                view: view,
                element: applicationDiv
            }),
            "top-right"
        );

        var zoom = new Zoom({ view: view });

        // Desktop
        var legend = new Legend({
            view: view,
            container: document.createElement("div")
        });
        //The Layerlist object is intialized prior to this code.

        // Mobile
        var expandLegend = new Expand({
            view: view,
            content: new Legend({
                view: view,
                container: document.createElement("div")
            })
        });
        var expandLayerlist = new Expand({
            view: view,
            content: layerlist,
            container: document.createElement("div")
        });


        // Load
        isResponsiveSize = view.widthBreakpoint === "xsmall" || view.widthBreakpoint === "small";
        updateView(isResponsiveSize);

        // Breakpoints
        view.watch("widthBreakpoint", function(breakpoint) {
            switch (breakpoint) {
                case "xsmall":
                case "small":
                    console.log("xsmall and small");
                    updateView(true);
                    break;
                case "medium":
                case "large":
                case "xlarge":
                    console.log("medium and large and Xlarge");
                    updateView(false);
                    break;
                default:
            }
        });

        function updateView(isMobile) {

            // view.ui.empty("bottom-right");

            if (isMobile) {
                view.ui.remove(legend, "bottom-right");
                view.ui.add(expandLegend, "bottom-right");

                view.ui.remove(layerlist, "top-left");
                view.ui.add(expandLayerlist, "top-left");

                view.popup.autoOpenEnabled = false;
            } else {

                view.ui.remove(expandLegend, "bottom-right");
                view.ui.add(legend, "bottom-right");

                view.ui.remove(expandLayerlist, "top-left");
                view.ui.add(layerlist, "top-left");

                view.popup.autoOpenEnabled = true;
            }
        }

        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////

        // When the layerview is available, setup hovering interactivity
        //view.whenLayerView(active_animation_layer).then(setupHoverTooltip);

        var animation_dropdown = document.getElementById("animation_dropdown");
        var animation_type = animation_dropdown.value;
        //setDate(dt_start, animation_type = animation_type);
        //setDate(dt_start, animation_type="first_case");

        animation_dropdown.addEventListener("change", function(evt) {
            //console.log(evt);
            animation_type = evt.target.value;
            let thumb_value = Math.ceil(slider.values[0]);

            let current_date = date.add(dt_start, dt_interval_unit, thumb_value);
            setDate(current_date, animation_type = animation_type);
        });

        var ilZipCaseTemplate = {
            title: "{id}",
            content: [{
                type: "fields",
                fieldInfos: [{
                        fieldName: "confirmed_cases",
                        visible: true,
                        label: "Confirmed Cases"
                    },
                    {
                        fieldName: "total_tested",
                        visible: true,
                        label: "Total Tested"
                    },
                ]
            }]
        };
        dph_illinois_zipcode.popupTemplate = ilZipCaseTemplate;

        var ilCountyCaseTemplate = {
            title: "{County}",
            content: [{
                type: "fields",
                fieldInfos: [{
                        fieldName: "confirmed_cases",
                        visible: true,
                        label: "Confirmed Cases"
                    },
                    {
                        fieldName: "deaths",
                        visible: true,
                        label: "Deaths"
                    },
                    {
                        fieldName: "total_tested",
                        visible: true,
                        label: "Total Tested"
                    },
                ]
            }]
        };

        dph_illinois_county_static.popupTemplate = ilCountyCaseTemplate;

        var ilHospitalTemplate = {

            title: "{Hospital}",

            content: [{
                type: "fields", // FieldsContentElement
                fieldInfos: [

                    {
                        fieldName: "StreetAddress",
                        visible: true,
                        label: "Address"
                    }, {
                        fieldName: "City",
                        visible: true,
                        label: "City"
                    }, {
                        fieldName: "ZIP_Code",
                        visible: true,
                        label: "Zip Code"
                    }, {
                        fieldName: "Total_Bed",
                        visible: true,
                        label: "Total Beds"
                    }, {
                        fieldName: "AvailableBed",
                        visible: true,
                        label: "Available Beds"
                    }, {
                        fieldName: "Bed_in_Use",
                        visible: true,
                        label: "Bed in use"
                    }, {
                        fieldName: "Adult_ICU_Bed",
                        visible: true,
                        label: "Adult ICU Beds"
                    }, {
                        fieldName: "Total_Vent",
                        visible: true,
                        label: "Total Vents"
                    }, {
                        fieldName: "Available_Vent",
                        visible: true,
                        label: "Available Vents"
                    }, {
                        fieldName: "Vent_in_Use",
                        visible: true,
                        label: "Vent in Use"
                    }, {
                        fieldName: "CovidConfirmedPatient",
                        visible: true,
                        label: "Confirmed COVID-19 Patients"
                    }, {
                        fieldName: "CovidPatient_in_ICU",
                        visible: true,
                        label: "COVID-19 Patients in ICU"
                    }, {
                        fieldName: "CovidPatientVent",
                        visible: true,
                        label: "COVID-19 Patients Vent"
                    },

                ]
            }]
        };
        illinois_hospitals.popupTemplate = ilHospitalTemplate;

        var ilTestingTemplate = {

            title: "Test Cases",

            content: [{
                type: "fields", // FieldsContentElement
                fieldInfos: [

                    {
                        fieldName: "Test_Result",
                        visible: true,
                        label: "Test Result"
                    }, {
                        fieldName: "expression/lab_date",
                    }, {
                        fieldName: "age",
                        visible: true,
                        label: "Age"
                    }, {
                        fieldName: "Sex",
                        visible: true,
                        label: "Gender"
                    }, {
                        fieldName: "Deceased",
                        visible: true,
                        label: "Deceased"
                    }
                ]
            }],
            expressionInfos: [{
                // Wed, 18 Mar 2020 00:00:00 GMT --> Wed, 18 Mar 2020
                name: "lab_date",
                title: "Lab Report Date",
                expression: "Replace($feature.Lab_Report_Date, ' 0:00', '')"
            }, ],
        };

        illinois_testing.popupTemplate = ilTestingTemplate;

        var usStateTemplate = {

            title: "{NAME}",
            expressionInfos: [{
                    name: "total_cases",
                    title: "Total Confirmed Cases",
                    expression: "Round(Split($feature.cases_ts, ',')[-1])"
                },
                {
                    name: "total_deaths",
                    title: "Total Deaths",
                    expression: "Round(Split($feature.deaths_ts, ',')[-1])"
                },
                {
                    name: "death_rate",
                    title: "Death Rate (%)",
                    expression: "Round((Split($feature.deaths_ts, ',')[-1]/Split($feature.cases_ts, ',')[-1])*100,2)"
                }

            ],
            content: [{
                type: "fields", // FieldsContentElement
                fieldInfos: [

                    {
                        fieldName: "expression/total_cases",
                        visible: true,
                        label: "Confirmed Cases"
                    },
                    {
                        fieldName: "expression/total_deaths",
                        visible: true,
                        label: "Deaths"
                    },
                    {
                        fieldName: "expression/death_rate",
                        visible: true,
                        label: "Death Rate"
                    },
                    {
                        fieldName: "dt_first_case",
                        visible: true,
                        label: "First Date of Confirmed Cases"
                    },
                    {
                        fieldName: "dt_first_death",
                        visible: true,
                        label: "First Date of Deaths"
                    },
                    {
                        fieldName: "population",
                        visible: true,
                        label: "Population"
                    }

                ]
            }]
        };

        nyt_layer_states.popupTemplate = usStateTemplate;

        function dynamicArcade(_column, _date) {
            return `
                //be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!

                var dt_thumb = Date(${_date.getFullYear()}, ${_date.getMonth()}, ${_date.getDate()});
                var ts = Split($feature['${_column}'],',');
                var dt_start_array = Split($feature.dt_start, '-');
                var dt_start = Date(Number(dt_start_array[0]), Number(dt_start_array[1])-1, Number(dt_start_array[2]));
                if(dt_thumb < dt_start){
                    return '0';
                }
                var days=DateDiff(dt_thumb, dt_start, "days");
                return Round(ts[days]);


            `;
        }

        function getDynamicPopup(date) {
            var dphDynamicPopup = {

                title: "{NAME}",
                expressionInfos: [{
                        name: "current_cases",
                        title: "Confirmed Cases",
                        expression: dynamicArcade('cases_ts', date)
                    },
                    {
                        name: "current_deaths",
                        title: "Deaths",
                        expression: dynamicArcade('deaths_ts', date)
                    },
                    // {
                    //     name: "death_rate",
                    //     title: "Death Rate (%)",
                    //     expression: "Round((Split($feature.deaths_ts, ',')[-1]/Split($feature.cases_ts, ',')[-1])*100,2)"
                    // }

                ],
                content: [{
                    type: "fields", // FieldsContentElement
                    fieldInfos: [

                        {
                            fieldName: "expression/current_cases",
                            visible: true,
                            label: "Confirmed Cases"
                        },
                        {
                            fieldName: "expression/current_deaths",
                            visible: true,
                            label: "Deaths"
                        },
                        // {
                        //     fieldName: "expression/death_rate",
                        //     visible: true,
                        //     label: "Death Rate"
                        // },
                        {
                            fieldName: "dt_first_case",
                            visible: true,
                            label: "First Date of Confirmed Cases"
                        },
                        {
                            fieldName: "dt_first_death",
                            visible: true,
                            label: "First Date of Deaths"
                        }
                        // },
                        // {
                        //     fieldName: "population",
                        //     visible: true,
                        //     label: "Population"
                        // }

                    ]
                }]
            };
            return dphDynamicPopup;
        }

        var usCountyTemplate = {

            title: "{NAME}",

            expressionInfos: [{
                    name: "total_cases",
                    title: "Total Confirmed Cases",
                    expression: "Round(Split($feature.cases_ts, ',')[-1])"
                },
                {
                    name: "total_deaths",
                    title: "Total Deaths",
                    expression: "Round(Split($feature.deaths_ts, ',')[-1])"
                },
                {
                    name: "death_rate",
                    title: "Death Rate (%)",
                    expression: "Round((Split($feature.deaths_ts, ',')[-1]/Split($feature.cases_ts, ',')[-1])*100,2)"
                }

            ],
            content: [{
                type: "fields", // FieldsContentElement
                fieldInfos: [

                    {
                        fieldName: "fips",
                        visible: true,
                        label: "FIPS"
                    },
                    {
                        fieldName: "state_name",
                        visible: true,
                        label: "State"
                    },
                    {
                        fieldName: "expression/total_cases",
                        visible: true,
                        label: "Confirmed Cases"
                    },
                    {
                        fieldName: "expression/total_deaths",
                        visible: true,
                        label: "Deaths"
                    },
                    {
                        fieldName: "expression/death_rate",
                        visible: true,
                        label: "Death Rate"
                    },
                    {
                        fieldName: "dt_first_case",
                        visible: true,
                        label: "First Date of Confirmed Cases"
                    },
                    {
                        fieldName: "dt_first_death",
                        visible: true,
                        label: "First Date of Deaths"
                    },
                    {
                        fieldName: "population",
                        visible: true,
                        label: "Population"
                    }

                ]
            }]
        };

        nyt_layer_counties.popupTemplate = usCountyTemplate;


        // Create tooltip
        function createTooltip() {

            var tooltip = document.createElement("div");
            var style = tooltip.style;

            tooltip.setAttribute("role", "tooltip");
            tooltip.classList.add("tooltip");

            var textElement = document.createElement("div");
            textElement.classList.add("esri-widget");
            tooltip.appendChild(textElement);

            view.container.appendChild(tooltip);

            var x = 0;
            var y = 0;
            var targetX = 0;
            var targetY = 0;
            var visible = false;

            // move the tooltip progressively
            function move() {
                x += (targetX - x) * 0.1;
                y += (targetY - y) * 0.1;

                if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
                    x = targetX;
                    y = targetY;
                } else {
                    requestAnimationFrame(move);
                }
                style.transform =
                    "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px, 0)";
            }

            return {
                show: function(point, text) {
                    if (!visible) {
                        x = point.x;
                        y = point.y;
                    }

                    targetX = point.x;
                    targetY = point.y;
                    style.opacity = 1;
                    visible = true;
                    textElement.innerHTML = text;

                    move();
                },

                hide: function() {
                    style.opacity = 0;
                    visible = false;
                }
            };
        }

        // When the layerview is available, setup hovering interactivity
        var tooltip = null;
        var hitTest = null;
        var hoverover_callback = null;
        var activeAnimationLayerView = null;
        var hitGraphic = null;

        function updateChart(graphic) {

            Chart.defaults.global.defaultFontSize = 12;
            Chart.defaults.global.defaultFontColor = '#777';

            var datasetList = [];

            var CasesArrayStr = (graphic.getAttribute("cases_ts")).split(",");
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

            if (graphic.getAttribute("deaths_ts") != undefined) {
                var DeathsArrayStr = (graphic.getAttribute("deaths_ts")).split(",");
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
            if (graphic.getAttribute("dt_start") == "2020-03-17") {
                var LabelDate = new Date(2020, 2, 9);
            } else if (graphic.getAttribute("dt_start") == "2020-01-11") {
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
                label: "Confirmed Cases ", //+"("+graphic.getAttribute("NAME")+")",
                borderColor: "#ffab24",
                pointStyle: "circle",
                fill: false
            };
            dic2 = {
                data: SlicedIncreasedCases,
                label: "Increased Cases ", //+"("+graphic.getAttribute("NAME")+")",
                borderColor: "#f25100",
                pointStyle: "circle",
                fill: false
            };

            if (graphic.getAttribute("deaths_ts") != undefined) {
                dic3 = {
                    data: SlicedDeathsArray,
                    label: "Deaths ", //+"("+graphic.getAttribute("NAME")+")",
                    borderColor: "#a10025",
                    pointStyle: "circle",
                    fill: false
                };
                dic4 = {
                    data: SlicedIncreasedDeaths,
                    label: "Increased Deaths ", //+"("+graphic.getAttribute("NAME")+")",
                    borderColor: "#6a28c7",
                    pointStyle: "circle",
                    fill: false
                };
            }

            if (graphic.getAttribute("cases_ts") != undefined) {
                datasetList.push(dic1)
                datasetList.push(dic2)
            }

            if (graphic.getAttribute("deaths_ts") != undefined) {
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

        function setupHoverTooltip(layerview) {

            // var highlight;
            activeAnimationLayerView = layerview;

            if (hitTest == null) {
                hitTest = promiseUtils.debounce(function(event) {
                    return view.hitTest(event).then(function(hit) {
                        var results = hit.results.filter(function(result) {
                            return result.graphic.layer === activeAnimationLayerView.layer;
                        });

                        if (!results.length) {
                            return null;
                        }

                        return {
                            graphic: results[0].graphic,
                            screenPoint: hit.screenPoint
                        };
                    });
                });
            }

            if (hoverover_callback == null) {
                view.on("click", function(event) {
                    console.log("click!")
                    return hitTest(event).then(
                        function(hit) {
                            // remove current highlighted feature
                            if (highlight) {
                                highlight.remove();
                                highlight = null;
                            }

                            // highlight the hovered feature
                            // or hide the tooltip

                            if (hit) {
                                if (window.bar != undefined) {
                                    window.bar.destroy();
                                }

                                // Add d-block class and remove d-none to display the chart
                                document.getElementById('myChart').classList.add("d-block");
                                document.getElementById('myChart').classList.remove("d-none");

                                var graphic = hit.graphic;
                                var screenPoint = hit.screenPoint;

                                hitGraphic = hit.graphic;

                                // view.goTo({
                                //     center: [graphic.geometry.centroid.longitude, graphic.geometry.centroid.latitude],
                                // })

                                updateChart(graphic);

                                highlight = activeAnimationLayerView.highlight(graphic);
                                // tooltip.show(
                                //     screenPoint,
                                //     "Cases in " + graphic.getAttribute("NAME")
                                // );
                            } else {
                                // tooltip.hide();
                            }
                        },
                        function() {}
                    );
                });
                hoverover_callback = true;
            }

        }

        //--------------------------------------------------------------------------
        //
        //  Methods
        //
        //--------------------------------------------------------------------------

        /**
         * Sets the current visualized construction year.
         */
        function setDate(_date, animation_type = "case") {
            let level = null;
            animation_layers.forEach(function(value) {
                if (value.title != chicago_acc_i_layer.title &&
                    value.title != chicago_acc_v_layer.title &&
                    value.title != illinois_acc_i_layer.title &&
                    value.title != illinois_acc_v_layer.title &&
                    value.title != vulnerability_layer.title) {
                    value.popupTemplate = getDynamicPopup(_date);
                }

                if (value.visible == true && value.parent.visible == true) {
                    console.log(value.title);
                    if (value.title == nyt_layer_counties.title) {
                        level = "county";
                    } else if (value.title == nyt_layer_states.title) {
                        level = "state";
                    } else if (value.title == dph_illinois_county_dynamic.title) {
                        level = "dph_illinois";
                    } else if (value.title == who_world_layer.title) {
                        level = "who_world";
                    } else if (value.title == vulnerability_layer.title) {
                        level = "vulnerability";
                    }
                }
            })
            if (dt_interval_unit == "week") {
                dt_week_end = date.add(_date, "week", 1);
                sliderValue.innerHTML = locale.format(_date, {
                        datePattern: "MM/dd",
                        selector: "date"
                    }) +
                    "-" + locale.format(dt_week_end, {
                        datePattern: "MM/dd/yyyy",
                        selector: "date"
                    });
            } else {
                sliderValue.innerHTML = locale.format(_date, {
                    datePattern: "MM/dd/yyyy",
                    selector: "date"
                });
            }

            var thumb_value = date.difference(dt_start, _date, dt_interval_unit);
            slider.viewModel.setValue(0, thumb_value);
            let _layer = mywatcher.get("active_animation_layer");

            // let event_type = document.querySelector('input[name="dataOptions"]:checked').value;
            // let if_log = document.querySelector('input[name="logOptions"]:checked').value;
            // let method = document.querySelector('input[name="renderOptions"]:checked').value;
            let event_type = "case"
                // let if_log = "nolog"
                // let method = "NaturalBreaks"

            if (_layer == null) {
                return;
            }
            if (_layer == chicago_acc_i_layer ||
                _layer == chicago_acc_v_layer ||
                _layer == illinois_acc_i_layer ||
                _layer == illinois_acc_v_layer) {
                _layer.renderer = classRender_time_enabled(_date);
            } else {
                _layer.renderer = classRender(_date, _event_type = event_type, _level = level);
            }
        }

        function classRender(_date, _event_type = "case", _level = "county") {
            const colors = ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#e34a33", "#b30000"];
            const colors_vul = ['#199640', '#a5d96a', '#ffffbf', '#fdaf61', '#d7191c', '#8c0002']

            function colorPicker(level) {
                if (level == "vulnerability") {
                    return colors_vul
                } else {
                    return colors
                }
            }
            const background_color = [0, 0, 0];
            let constant_class = classes_data;
            let dynamic_class = dynamic_classes_data;
            //Specify the methods
            let source = null;
            _method = visualizationSchema[_level][_event_type]['breaks'];
            _if_log = visualizationSchema[_level][_event_type]['value'];
            // 5 Common type: Constant Classes
            if (_event_type == "case" || _event_type == "death" || _event_type == "case_per_100k_capita" ||
                _event_type == "death_per_100k_capita" || _event_type == "death_case_ratio") {
                source = constant_class[_level][_event_type][_if_log][_method];
                let bins = source.bins.split(",")

                if (_level != "vulnerability") {
                    var stop_array = [{
                        value: -1,
                        color: background_color,
                        label: 0
                    }];
                } else {
                    var stop_array = [{
                        value: -1,
                        color: background_color,
                        label: ""
                    }];
                }

                // bins.length <= colors.length
                // e.g. if only 2 classes, get [4,5] colors
                for (let i = 0; i < bins.length; i++) {
                    var label = bins[i];
                    if (_if_log == "log") {
                        label = Math.ceil(Math.pow(2.71828, label));
                    } else if (parseFloat(label) % 1 != 0) {
                        // label = parseFloat(label).toFixed(2);
                        if (i == 0) {
                            label = "Low"
                        } else if (i == bins.length - 1) {
                            label = "High"
                        } else {
                            label = ""
                        }
                    } else {
                        label = parseInt(label);
                    }
                    stop_array.push({
                        value: i,
                        color: colorPicker(_level)[i],
                        label: label
                    })
                }
                return {
                    type: "simple",
                    symbol: {
                        type: "simple-fill",
                        outline: { // autocasts as new SimpleLineSymbol()
                            color: [128, 128, 128, 50],
                        }
                    },
                    visualVariables: [{
                        type: "color",
                        valueExpression: classArcade(_date, _class = bins, _event_type = _event_type, _if_log = _if_log),
                        //valueExpressionTitle: "Voter Turnout",
                        stops: stop_array.reverse(),
                    }]
                };

            }
        }

        function classRender_time_enabled(_date) {
            const colors = ["#eff3ff", "#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"];
            const opacityValues = [0, 1, 1, 1, 1, 1];

            var stop_array_opacity = [];
            var stop_array_color = [];

            function labeling(value) {
                if (value == -1) {
                    return "Low"
                } else if (value == 4) {
                    return "High"
                } else {
                    return ""
                }
            }

            for (let i = -1; i < 5; i++) {
                stop_array_opacity.push({
                    value: i,
                    opacity: opacityValues[i + 1],
                    label: labeling(i),
                })
            }

            for (let i = -1; i < 5; i++) {
                stop_array_color.push({
                    value: i,
                    color: colors[i + 1],
                    label: labeling(i),
                })
            }

            return {
                type: "simple",
                symbol: {
                    type: "simple-fill",
                    color: "#0000FF",
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [128, 128, 128, 50],
                        width: 0
                    }
                },
                visualVariables: [{
                        type: "opacity",
                        valueExpression: classArcade_time_enabled(_date),
                        stops: stop_array_opacity.reverse(),
                        legendOptions: {
                            showLegend: false
                        },
                    },
                    {
                        type: "color",
                        valueExpression: classArcade_time_enabled(_date),
                        stops: stop_array_color.reverse(),
                    }
                ]
            };
        }

        function classArcade(_date, _class, _event_type = "case", _if_log = "nolog") {

            // Drew: return must be followed by the open ` on the same line, and a semi-colon ";" is required after the close `!!!
            return `
                //be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!

                var dt_thumb = Date(${_date.getFullYear()}, ${_date.getMonth()}, ${_date.getDate()});
                var event_type = Lower('${_event_type}');
                var if_log = Lower('${_if_log}');
                var val = 0;
                var class = 0;
                var bins = [${_class}];
                var population = Number($feature['population'])/100000;
                var dt_start_array = Split($feature.dt_start, '-');
                var dt_start = Date(Number(dt_start_array[0]), Number(dt_start_array[1])-1, Number(dt_start_array[2]));
                if(dt_thumb < dt_start){
                    class = -1;
                    return class;
                }
                var days=DateDiff(dt_thumb, dt_start, "days");
                var index = Ceil(days);

                    
                if(event_type == "case" || event_type == "case_per_100k_capita"){
                    var case_ts = Split($feature['cases_ts'],',');
                    val = case_ts[index];
                    if(event_type == "case_per_100k_capita"){
                        val = val/population;
                    }
                    if(if_log == "log"){
                        val = Log(val + 1);
                    }
                }
                else if(event_type == "death" || event_type == "death_per_100k_capita"){
                    var death_ts = Split($feature['deaths_ts'],',');
                    val = death_ts[index];
                    if(event_type == "death_per_100k_capita"){
                        val = val/population;
                    }
                    if(if_log == "log"){
                        val = Log(val + 1);
                    }
                }
                // else if(event_type == "death_case_ratio"){
                //     var case_ts = Split($feature['cases_ts'],',');
                //     var death_ts = Split($feature['deaths_ts'],',');
                //     val = death_ts[index]/case_ts[index];
                // }
                for(var x = 0; x < Count(bins); x ++){
                    if(val <= 0){
                        class = -1;
                        break;
                    }
                    if(val <= Number(bins[x])){
                        class = x;
                        break;
                    }
                }
                return class;
            `;
        }


        function classArcade_time_enabled(_date) {

            // Drew: return must be followed by the open ` on the same line, and a semi-colon ";" is required after the close `!!!
            return `
                //be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!

                var dt_thumb_obj = Date(${_date.getFullYear()}, ${_date.getMonth()}, ${_date.getDate()});
                var dt_thumb = Text(dt_thumb_obj, "Y-MM-DD");
                var dt_feature = $feature.date;
                var class = -1;
                if(dt_feature == dt_thumb){
                    class = Number($feature.category);
                } 
                return class;
            `;
        }

        function illinoisZipCodeRender(field_name, min, max) {
            const defaultSym = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                outline: {
                    // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.8],
                    width: "0.5px"
                }
            };
            const renderer = {
                type: "simple", // autocasts as new SimpleRenderer()
                symbol: defaultSym,
                //label: "1-Week Ahead Forecast",
                visualVariables: [{
                    type: "color",
                    field: field_name, //"ZipCodeForecast",
                    //normalizationField: "TOTPOP_CY",
                    legendOptions: {
                        title: "Number of Cases"
                    },
                    stops: [{
                        value: max,
                        color: "#FF0000",
                        label: max.toString()
                    }, {
                        value: min,
                        color: "#000000",
                        label: min.toString()
                    }]
                }]
            };
            return renderer;

        }

        function dphStaticRender(_event_type) {
            const colors = ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#e34a33", "#b30000"];
            const background_color = [0, 0, 0];
            let constant_class = classes_data;
            //Specify the methods
            let method = visualizationSchema['dph_illinois'][_event_type]['breaks'];
            let if_log = visualizationSchema['dph_illinois'][_event_type]['value'];
            let source = constant_class['dph_illinois'][_event_type][if_log][method];
            let bins = source.bins.split(",")
            let stop_array = [{
                value: -1,
                color: background_color,
                label: 0
            }];
            for (let i = 0; i < bins.length; i++) {
                var val = bins[i];
                if (parseFloat(val) < 0) {
                    label = parseFloat(val);
                } else {
                    label = parseInt(val);
                }
                stop_array.push({
                    value: i,
                    color: colors[i],
                    label: label,
                })
            }
            let fieldName = "";
            if (_event_type == "tested" || _event_type == "zipcode_tested") {
                fieldName = "total_tested"
            } else if (_event_type == "zipcode_case") {
                fieldName = "confirmed_cases"
            }
            return {
                type: "simple",
                symbol: {
                    type: "simple-fill",
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [128, 128, 128, 50],
                    }
                },
                visualVariables: [{
                    type: "color",
                    valueExpression: dphStaticArcade(bins, fieldName),
                    //valueExpressionTitle: "Voter Turnout",
                    stops: stop_array.reverse(),

                }]
            };
        }

        function dphStaticArcade(_class, _fieldName) {

            // Drew: return must be followed by the open ` on the same line, and a semi-colon ";" is required after the close `!!!
            return `
                //be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!
                var fieldName = '${_fieldName}';
                var val = Number($feature[fieldName]);
                var class = 0;
                var bins = [${_class}];

                for(var x = 0; x < Count(bins); x ++){
                    if(val <= 0){
                        class = -1;
                        break;
                    }
                    if(val <= Number(bins[x])){
                        class = x;
                        break;
                    }
                }
                return class;
            `;
        }


        /**
         * Starts the animation that cycle
         * through the construction years.
         */
        function startAnimation() {
            stopAnimation();
            playButton.classList.add("toggled");
            animation = animate(slider.values[0]);
            flag_first_click_anination_per_layer = false;
        }

        /**
         * Stops the animations
         */
        function stopAnimation() {
            if (animation) {
                animation.remove();
                animation = null;
            }
            playButton.classList.remove("toggled");
        }

        /**
         * Animates the color visual variable continously
         */
        function animate(startValue) {
            var animating = true;
            var value = startValue;
            var repeat_count = 0;

            var frame = function(timestamp) {
                if (!animating) {
                    return;
                }

                value += 1;
                if (value > slider.max) {
                    // if (flag_first_click_anination_per_layer) {
                    //     value = slider.min;
                    // }
                    if (startValue == slider.max && repeat_count == 0) {
                        value = slider.min;
                        repeat_count += 1;
                    } else {
                        animating = false;
                        stopAnimation();
                        return;
                    }
                }
                var dt_thumb = date.add(dt_start, dt_interval_unit, Math.floor(value));
                setDate(dt_thumb, animation_type = animation_type);

                // Update at 30fps
                setTimeout(function() {
                    requestAnimationFrame(frame);
                    updateChart(hitGraphic);
                }, 1000 / 10);
            };

            frame();

            return {
                remove: function() {
                    animating = false;
                }
            };
        }


        /////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////Handle Table clicking//////////////////////////////
        /////////////////////////////////////////////////////////////////////////////////

        var highlight;

        /// illinois Table
        document.querySelector("#illinois-table tbody").addEventListener("click", function(event) {
            dph_illinois_county_dynamic.visible = true;

            var tr = event.target;
            while (tr !== this && !tr.matches("tr")) {
                tr = tr.parentNode;
            }
            if (tr === this) {
                console.log("No table cell found");
            } else {

                lat = parseFloat(tr.firstElementChild.dataset.x);
                long = parseFloat(tr.firstElementChild.dataset.y);
                objID = parseFloat(tr.firstElementChild.dataset.uid);
                countyName = tr.firstElementChild.dataset.county;

                console.log(countyName);

                // let topVisibleLayer = getTopVisibleLayer(map.layers,);
                let topVisibleLayer = dph_illinois_county_dynamic;
                view.whenLayerView(topVisibleLayer).then(function(layerView) {
                    var query = topVisibleLayer.createQuery();
                    query.where = "NAME = " + "'" + countyName + "'";

                    topVisibleLayer.queryFeatures(query).then(function(result) {

                        if (highlight) {
                            highlight.remove();
                        }
                        highlight = layerView.highlight(result.features);
                    })
                }).then(function() {
                    view.goTo({
                            center: [lat, long],
                            zoom: 8,
                        })
                        .catch(function(error) {
                            if (error.name != "AbortError") {
                                console.error(error);
                            }
                        });
                });

            }
        });

        /// US Table
        document.querySelector("#county-table tbody").addEventListener("click", function(event) {
            nyt_layer_counties.visible = true;

            var tr = event.target;
            while (tr !== this && !tr.matches("tr")) {
                tr = tr.parentNode;
            }
            if (tr === this) {
                console.log("No table cell found");
            } else {

                lat = parseFloat(tr.firstElementChild.dataset.x);
                long = parseFloat(tr.firstElementChild.dataset.y);
                objID = parseFloat(tr.firstElementChild.dataset.uid);
                countyName = tr.firstElementChild.dataset.county;

                console.log(countyName);

                // let topVisibleLayer = getTopVisibleLayer(map.layers,);
                let topVisibleLayer = nyt_layer_counties;
                view.whenLayerView(topVisibleLayer).then(function(layerView) {
                    var query = topVisibleLayer.createQuery();
                    query.where = "NAME = " + "'" + countyName + "'";

                    topVisibleLayer.queryFeatures(query).then(function(result) {

                        if (highlight) {
                            highlight.remove();
                        }
                        highlight = layerView.highlight(result.features);
                    })
                }).then(function() {
                    view.goTo({
                            center: [lat, long],
                            zoom: 8,
                        })
                        .catch(function(error) {
                            if (error.name != "AbortError") {
                                console.error(error);
                            }
                        });
                });
            }
        });

        /// World Table
        document.querySelector("#world-table tbody").addEventListener("click", function(event) {
            who_world_layer.visible = true;

            var tr = event.target;
            while (tr !== this && !tr.matches("tr")) {
                tr = tr.parentNode;
            }
            if (tr === this) {
                console.log("No table cell found");
            } else {

                lat = parseFloat(tr.firstElementChild.dataset.x);
                long = parseFloat(tr.firstElementChild.dataset.y);
                objID = parseFloat(tr.firstElementChild.dataset.uid);
                countryName = tr.firstElementChild.dataset.country;

                console.log(countryName);

                // let topVisibleLayer = getTopVisibleLayer(map.layers,);
                let topVisibleLayer = who_world_layer;
                view.whenLayerView(topVisibleLayer).then(function(layerView) {
                    var query = topVisibleLayer.createQuery();
                    query.where = "NAME = " + "'" + countryName + "'";

                    topVisibleLayer.queryFeatures(query).then(function(result) {

                        if (highlight) {
                            highlight.remove();
                        }
                        highlight = layerView.highlight(result.features);
                    })
                }).then(function() {
                    view.goTo({
                            center: [lat, long],
                            zoom: 4,
                        })
                        .catch(function(error) {
                            if (error.name != "AbortError") {
                                console.error(error);
                            }
                        });
                });
            }
        });

        //Set default layers after clicking side panels
        document.getElementById("illinois-tab").addEventListener("click", function(event) {
            dph_illinois_county_dynamic.visible = true;

            // Bring hidden panel to display
            // To override the side effect in Layer Change event

            view.whenLayerView(dph_illinois_county_dynamic).then(function() {

                isResponsiveSize = view.widthBreakpoint === "xsmall" || view.widthBreakpoint === "small";
                console.log(isResponsiveSize);
                if (!isResponsiveSize) {
                    if ($(".sidebar").hasClass("closed")) {
                        $('#sidebar_control').removeClass("closed").addClass("open");
                        $(".sidebar").css('display', 'flex').removeClass("closed").addClass("open");
                        $("main").addClass("map-fullscreen");
                    }
                }
            })
        });

        document.getElementById("county-tab").addEventListener("click", function(event) {
            nyt_layer_counties.visible = true;

            // Bring hidden panel to display
            // To override the side effect in Layer Change event
            view.whenLayerView(nyt_layer_counties).then(function() {
                isResponsiveSize = view.widthBreakpoint === "xsmall" || view.widthBreakpoint === "small";
                console.log(isResponsiveSize);
                if (!isResponsiveSize) {
                    if ($(".sidebar").hasClass("closed")) {
                        $('#sidebar_control').removeClass("closed").addClass("open");
                        $(".sidebar").css('display', 'flex').removeClass("closed").addClass("open");
                        $("main").addClass("map-fullscreen");
                    }
                }
            })
        });

        document.getElementById("world-tab").addEventListener("click", function(event) {
            who_world_layer.visible = true;

            // Bring hidden panel to display
            // To override the side effect in Layer Change event
            view.whenLayerView(who_world_layer).then(function() {
                isResponsiveSize = view.widthBreakpoint === "xsmall" || view.widthBreakpoint === "small";
                console.log(isResponsiveSize);
                if (!isResponsiveSize) {
                    if ($(".sidebar").hasClass("closed")) {
                        $('#sidebar_control').removeClass("closed").addClass("open");
                        $(".sidebar").css('display', 'flex').removeClass("closed").addClass("open");
                        $("main").addClass("map-fullscreen");
                    }
                }
            })
        });

    }; //End main


    function pre_main() {
        // let counties_data_json_url = "/nyt_counties_data.json";
        // let states_data_json_url = "/nyt_states_data.json";
        let counties_data_json_url = "";
        let states_data_json_url = "";
        let classes_json_url = "preprocessing/classes.json";
        let dynamic_classes_json_url = "preprocessing/dynamic_classes.json";

        // if (production_mode) {
        //     // proxy to CORS
        //     let proxy_url = "https://cors-anywhere.herokuapp.com/";
        //     counties_data_json_url = proxy_url + "https://raw.githubusercontent.com/cybergis/cybergis.github.io/master/nyt_counties_data.json";
        //     states_data_json_url = proxy_url + "https://raw.githubusercontent.com/cybergis/cybergis.github.io/master/nyt_states_data.json";
        // }

        let counties_request = request(counties_data_json_url, { handleAs: "json" });
        let states_request = request(states_data_json_url, { handleAs: "json" });
        let classes_request = request(classes_json_url, { handleAs: "json" });
        let dynamic_classes_request = request(dynamic_classes_json_url, { handleAs: "json" });

        let dl = new DeferredList([counties_request, states_request, classes_request, dynamic_classes_request]);
        return dl.then(setGlobal_JSON);
    }

    function setGlobal_JSON(res) {
        counties_data = res[0][1];
        //counties_data_str = JSON.stringify(counties_data);
        states_data = res[1][1];
        //states_data_str = JSON.stringify(states_data);
        classes_data = res[2][1];
        dynamic_classes_data = res[3][1];

        let promise = new Promise(function(resolve, reject) {
            // the function is executed automatically when the promise is constructed

            // after 1 millisecond signal that the job is done with the result "done"
            setTimeout(() => resolve("Load JSON Done"), 1);
        });
        return promise;
    }

    //pre_main().then(main);
    pre_main().then(main);

});