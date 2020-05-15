
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
    "esri/Basemap",
    "esri/layers/MapImageLayer",
    "esri/symbols/SimpleFillSymbol",
    "esri/layers/GroupLayer",
    "esri/widgets/LayerList",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Expand",
    "esri/layers/GeoJSONLayer",
    "esri/tasks/support/Query",
    "esri/layers/support/LabelClass",
    "esri/widgets/Zoom",
    "dojo/dom",
    "dojo/date",
    "dojo/date/locale",
    "dojox/data/CsvStore",
    "dojo/request",
    "dojo/DeferredList",
    "dojo/Stateful",
    "dojo/_base/declare",
    "dojo/query",
    "dojo",
], function (
    Map,
    FeatureLayer,
    MapView,
    promiseUtils,
    Legend,
    Home,
    Slider,
    Fullscreen,
    SpatialReference,
    Basemap,
    MapImageLayer,
    SimpleFillSymbol,
    GroupLayer,
    LayerList,
    BasemapGallery,
    Expand,
    GeoJSONLayer,
    Query,
    LabelClass,
    Zoom,
    dom,
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
        _active_animation_layerGetter: function () {
            return this.active_animation_layer;
        },
        _active_animation_layerSetter: function (value) {
            this.active_animation_layer = value;
        }
    });

    // Create an instance and initialize some property values:
    const mywatcher = new MyWatcher({
        active_animation_layer: null,
    });

    var production_mode = false; //true or false

    //global variables contain data
    var counties_data = null;
    var counties_data_str = null;
    var states_data = null;
    var states_data_str = null;
    var classes_data = null;
    var dynamic_classes_data = null;
    var visualizationSchema = {
        'dph_illinois':{
            'case':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'death':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'case_per_100k_capita':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'death_per_100k_capita':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'tested':{
                'value':'nolog',
                'breaks':'NaturalBreaks'
            },
            'zipcode_case':{
                'value':'nolog',
                'breaks':'NaturalBreaks'
            },
            'zipcode_tested':{
                'value':'nolog',
                'breaks':'NaturalBreaks'
            },
        },
        'illinois':{
            'case':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'death':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'case_per_100k_capita':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'death_per_100k_capita':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            }
        },
        'state':{
            'case':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'death':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'case_per_100k_capita':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'death_per_100k_capita':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            }
        },
        'county':{
            'case':{
                'value':'nolog',
                'breaks':'Quantiles',
            },
            'death':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            },
            'case_per_100k_capita':{
                'value':'nolog',
                'breaks':'Quantiles',
            },
            'death_per_100k_capita':{
                'value':'nolog',
                'breaks':'NaturalBreaks',
            }
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
        var titleDiv = document.getElementById("titleDiv");
        var animation = null;
        var slider = null;
        var sliderDiv = document.getElementById("sliderContainer");
        var myChart = document.getElementById('myChart').getContext('2d');

        // Query total numbers for left slide bar
        var confirmDiv = document.getElementById("total_confirm_div");
        var deathDiv = document.getElementById("total_death_div");
        var recoverDiv = document.getElementById("total_recover_div");

        //--------------------------------------------------------------------------
        //
        //  Setup Map and View
        //
        //--------------------------------------------------------------------------

        // var nyt_layer_states_url = "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/nyt_states_data_dev/FeatureServer/0";
        // var nyt_layer_counties_url = "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/nyt_counties_data_dev/FeatureServer/0";
        // var illinios_county_url = "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/illinois_forecast_county_dev/FeatureServer/0";
        // var illinios_zipcode_url = "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/illinois_forecast_zipcode_dev/FeatureServer/0";
        var nyt_layer_states_url = "preprocessing/nyt_states_data.geojson";
        var nyt_layer_counties_url = "preprocessing/nyt_counties_data.geojson";
        var illinios_county_url = "preprocessing/illinois/illinois_forecast_county.geojson";
        var illinios_zipcode_url = "preprocessing/illinois/illinois_forecast_zipcode.geojson";
        var illinois_hospitals_url = "preprocessing/illinois/illinois_hospitals.geojson";
        var illinois_testing_url = "preprocessing/illinois/illinois_testing.geojson";
        var illinois_report_url = "preprocessing/illinois/nyt_illinois_counties_data.geojson";
        var dph_illinois_zipcode_url = "preprocessing/illinois/dph_zipcode_data.geojson";
        var dph_illinois_county_dynamic_url = "preprocessing/illinois/dph_county_data.geojson";
        var dph_illinois_county_static_url = "preprocessing/illinois/dph_county_static_data.geojson";

        if (production_mode) {
            // nyt_layer_states_url = "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/nyt_states_data/FeatureServer/0";
            // nyt_layer_counties_url = "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/nyt_counties_data/FeatureServer/0";
            // illinios_county_url = "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/illinois_forecast_county/FeatureServer/0";
            // illinios_zipcode_url = "https://services.arcgis.com/GL0fWlNkwysZaKeV/arcgis/rest/services/illinois_forecast_zipcode/FeatureServer/0";
            nyt_layer_states_url = "https://raw.githubusercontent.com/cybergis/cybergis.github.io/master/preprocessing/nyt_states_data.geojson";
            nyt_layer_counties_url = "https://raw.githubusercontent.com/cybergis/cybergis.github.io/master/preprocessing/nyt_counties_data.geojson";
            illinios_county_url = "https://raw.githubusercontent.com/cybergis/cybergis.github.io/master/preprocessing/illinois/illinois_forecast_county.geojson";
            illinios_zipcode_url = "https://raw.githubusercontent.com/cybergis/cybergis.github.io/master/preprocessing/illinois/illinois_forecast_zipcode.geojson";
            illinois_hospitals_url = "https://raw.githubusercontent.com/cybergis/cybergis.github.io/master/preprocessing/illinois/illinois_hospitals_valid.geojson";
            illinois_testing_url = "https://raw.githubusercontent.com/cybergis/cybergis.github.io/master/preprocessing/illinois/illinois_testing.geojson";
        }

        const default_polygon_renderer = {
            type: "simple",
            symbol: {
                type: "simple-fill",
                color: [0, 0, 0, 0.1],
                outline: { // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.5],
                }
            }
        };

        //nyt states
        //var nyt_layer_states = new FeatureLayer({
        var nyt_layer_states = new GeoJSONLayer({
            url: nyt_layer_states_url,
            outFields: ["*"],
            title: "US States (New York Times)",
            visible: false,
            renderer: default_polygon_renderer,
        });

        //nyt counties
        //var nyt_layer_counties = new FeatureLayer({
        var nyt_layer_counties = new GeoJSONLayer({
            url: nyt_layer_counties_url,
            outFields: ["*"],
            title: "US Counties (New York Times)",
            visible: false,
            renderer: default_polygon_renderer,
        });

        var illinois_counties = new GeoJSONLayer({
            url: illinios_county_url,
            outFields: ["*"],
            title: "County-level Info",
            renderer: illinoisZipCodeRender("CountyForecast", 7, 8200),
            visible: false,
        });

        var illinois_zipcode = new GeoJSONLayer({
                url: illinios_zipcode_url,
                outFields: ["*"],
                title: "Zipcode-level Info",
                renderer: illinoisZipCodeRender("ZipCodeForecast", 0, 200),
                visible: false,
            }
        );
        var dph_illinois_zipcode = new GeoJSONLayer({
                url: dph_illinois_zipcode_url,
                outFields: ["*"],
                title: "DPH Zipcode-level Cases",
                renderer: dphStaticRender("zipcode_case"),
                visible: false,
            }
        );
        var dph_illinois_county_static = new GeoJSONLayer({
                url: dph_illinois_county_static_url,
                outFields: ["*"],
                title: "DPH County-level Test Data",
                renderer: dphStaticRender("tested"),
                visible: false,
            }
        );
        console.log(dph_illinois_zipcode.renderer)

        var dph_illinois_county_dynamic = new GeoJSONLayer({
            url: dph_illinois_county_dynamic_url,
            outFields: ["*"],
            title: "DPH County-level Cases",
            renderer: default_polygon_renderer,
            visible: true,
        }
    );

        var illinois_report = new GeoJSONLayer({
            url: illinois_report_url,
            outFields: ["*"],
            title: "Cases (New York Times)",
            renderer: default_polygon_renderer,
            visible: true,
        });

        var illinois_hospitals = new GeoJSONLayer({
            url: illinois_hospitals_url,
            outFields: ["*"],
            title: "Hospital Locations",
            renderer: {
                type: "simple",
                symbol: {
                    type: "picture-marker", // autocasts as new PictureMarkerSymbol()
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

        // Some Layer Types can NOT be published on ArcGIS Online
        // https://developers.arcgis.com/documentation/core-concepts/layers/
        // references an ArcGIS Online item pointing to a Map Service Layer
        var illinois_access_layer = new MapImageLayer({
            url:
                "https://dev.rmms.illinois.edu/iepa/rest/services/wherecovid19/acc_il/MapServer",
            title: "Accessibility Measure (State-wide)",
            visible: false,
            listMode: "hide-children",
        });


        var chicago_access_layer = new MapImageLayer({
            url:
                "https://dev.rmms.illinois.edu/iepa/rest/services/wherecovid19/acc_chicago/MapServer",
            title: "Accessibility Measure (Chicago)",
            visible: false,
            listMode: "hide-children",
        });

        // order matters! last layer is at top
        var animation_layers = [nyt_layer_states, nyt_layer_counties,
            dph_illinois_county_dynamic];
        var static_layers = [illinois_hospitals, illinois_testing,
            dph_illinois_zipcode, dph_illinois_county_static];

        // // new GroupLayer object may affect other GroupLayer objects
        // // Comment out unused GroupLayer objects to avoid strange bugs
        // // like group layer can not expand!!!!!
        // var animationGroupLayer = new GroupLayer({
        //     title: "Time-enabled Layers",
        //     visible: true,
        //     visibilityMode: "exclusive",
        //     layers: new Array().concat(animation_layers),
        //     opacity: 0.75
        // });
        // var staticGroupLayer = new GroupLayer({
        //     title: "Static Layers",
        //     visible: true,
        //     visibilityMode: "exclusive",
        //     layers: new Array().concat(static_layers),
        //     opacity: 0.75
        // });

        // new GroupLayer object may affect other GroupLayer objects
        // Comment out unused GroupLayer objects to avoid strange bugs
        // like group layer can not expand!!!!
        // var allInOneGroupLayer = new GroupLayer({
        //     title: "Layers",
        //     visible: true,
        //     visibilityMode: "exclusive",
        //     layers: new Array().concat(animation_layers, static_layers),
        //     opacity: 0.75
        // });

        var us_group = new GroupLayer({
            title: "US",
            visible: false,
            visibilityMode: "independent",
            layers: [nyt_layer_states, nyt_layer_counties],
            opacity: 0.75
        })

        var illinois_group = new GroupLayer({
            title: "Illinois",
            visible: true,
            visibilityMode: "independent",
            layers: [illinois_hospitals, illinois_testing,
                illinois_access_layer, chicago_access_layer, dph_illinois_zipcode,
                dph_illinois_county_static, dph_illinois_county_dynamic],
            opacity: 0.75
        });

        // order mattes! last layer is at top
        //var all_layers = [animationGroupLayer, staticGroupLayer];
        //var all_layers = allInOneGroupLayer.layers;
        var all_layers = new Array().concat(animation_layers, static_layers);

        // A non-3857 basemap
        var basemap = new Basemap({
            baseLayers: [
                new MapImageLayer({
                    //url: "https://services.arcgisonline.com/arcgis/rest/services/Polar/Arctic_Ocean_Base/MapServer",
                    url: "https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT3978/MapServer",
                    title: "Basemap"
                })
            ],
            title: "basemap",
            id: "basemap"
        });

        var map = new Map({
            //basemap: basemap,
            basemap: {
                portalItem: {
                    id: "4f2e99ba65e34bb8af49733d9778fb8e",
                }
            },
            layers: [us_group, illinois_group],
        });

        // Set up callback function for active_animation_layer value change before any map things
        setupActiveAnimationLayerChangeCallback();

        // This event will be triggered once at startup as maps adds layers for the fist time
        // Listen for layer change: remove, add, reorder
        // https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html#layers
        map.allLayers.on("change", function (event) {
            // this function will change active_animation_layer value
            setActiveAnimationLayer(event);
        });

        var view = new MapView({
            map: map,
            container: "viewDiv",
            //spatialReference: new SpatialReference(wkid: 3857}),
            center: [-88.984300, 40.474679],
            zoom: 5.5,
            constraints: {
                snapToZoom: false,
                //minScale: 72223.819286,
                rotationEnabled: false
            },
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
                                return layer
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
            view.whenLayerView(topVisibleLayer).then(setupHoverTooltip);
        }

        // Listen for layer visibility change
        // may get triggered more than once in if GroupLayer is in "exclusive" mode (radio button)
        // LayerA on->off and LayerB off->on
        // https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=animation-layer-visibility
        map.allLayers.forEach(function (item) {
            item.watch("visible", function (visible) {
                console.log(item.title, visible)
                if (visible === true && item.type !== "group") {
                    map.layers.forEach(function (value) {

                        if (value.title === item.parent.title) {
                            value.visible = true;
                            value.layers.forEach(function (val) {
                                if (val.title === item.title) {
                                    val.visible = true;
                                } else {
                                    val.visible = false;
                                }
                            })
                        } else {
                            value.visible = false;
                            value.layers.forEach(function (val) {
                                val.visible = false;
                            })
                        }
                    });

                    if (item.title === chicago_access_layer.title) {
                        view.goTo({
                            center: [-87.631721, 41.868428],
                            zoom: 10,
                        })
                    } else if (item.parent.title === us_group.title || item.title === us_group.title) {
                        view.goTo({
                            center: [-96.984300, 40.474679],
                            zoom: 3
                        })
                    } else if (item.parent.title === illinois_group.title || item.title === illinois_group.title) {
                        view.goTo({
                            center: [-88.984300, 40.474679],
                            zoom: 6
                        })
                    }
                } // if(visible === true){
                setActiveAnimationLayer(item);
            });
        });

        var layerlist = new LayerList({
            view: view,
            //listItemCreatedFunction: defineActions,
            selectionEnabled: true,
            visibleElements: {
                statusIndicators: false
            },
        });

        // function defineActions(event) {
        //     // The event object contains an item property.
        //     // is is a ListItem referencing the associated layer
        //     // and other properties. You can control the visibility of the
        //     // item, its title, and actions using this object.
        //
        //     var item = event.item;
        //
        //     if (item.title === "Pandemic" || item.title === "Census-2000") {
        //         // An array of objects defining actions to place in the LayerList.
        //         // By making this array two-dimensional, you can separate similar
        //         // actions into separate groups with a breaking line.
        //
        //         item.actionsSections = [
        //             [
        //                 {
        //                     title: "Go to full extent",
        //                     className: "esri-icon-zoom-out-fixed",
        //                     id: "full-extent"
        //                 },
        //                 {
        //                     title: "Layer information",
        //                     className: "esri-icon-description",
        //                     id: "information"
        //                 }
        //             ],
        //             [
        //                 {
        //                     title: "Increase opacity",
        //                     className: "esri-icon-up",
        //                     id: "increase-opacity"
        //                 },
        //                 {
        //                     title: "Decrease opacity",
        //                     className: "esri-icon-down",
        //                     id: "decrease-opacity"
        //                 }
        //             ]
        //         ];
        //     }
        // }
        //
        // layerlist.on("trigger-action", function (event) {
        //     // The layer visible in the view at the time of the trigger.
        //     console.log(event);
        //     let visibleLayer = event.item.layer;
        //
        //     // Capture the action id.
        //     var id = event.action.id;
        //
        //     if (id === "full-extent") {
        //         // if the full-extent action is triggered then navigate
        //         // to the full extent of the visible layer
        //         view.goTo(visibleLayer.fullExtent);
        //     } else if (id === "information") {
        //         // if the information action is triggered, then
        //         // open the item details page of the service layer
        //         window.open(visibleLayer.url);
        //     } else if (id === "increase-opacity") {
        //         // if the increase-opacity action is triggered, then
        //         // increase the opacity of the GroupLayer by 0.25
        //
        //         if (visibleLayer.opacity < 1) {
        //             visibleLayer.opacity += 0.25;
        //         }
        //     } else if (id === "decrease-opacity") {
        //         // if the decrease-opacity action is triggered, then
        //         // decrease the opacity of the GroupLayer by 0.25
        //
        //         if (visibleLayer.opacity > 0) {
        //             visibleLayer.opacity -= 0.25;
        //         }
        //     }
        //
        // });

        // var basemapGallery = new BasemapGallery({
        //     view: view,
        // });
        //
        //
        // view.ui.add(new Expand({
        //     view: view,
        //     content: basemapGallery,
        // }), "top-right");


        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        setListview();
        function setListview() {
            const illinois_query = dph_illinois_county_static.createQuery();
            const illiniConfrimed = {
                onStatisticField: "confirmed_cases",
                outStatisticFieldName: "Total_Cases",
                statisticType: "sum"
            }
            const illiniTested = {
                onStatisticField: "total_tested",
                outStatisticFieldName: "Total_Tested",
                statisticType: "sum"
            }
            illinois_query.outStatistics = [illiniConfrimed, illiniTested];
            dph_illinois_county_static.queryFeatures(illinois_query)
                .then(function (response){
                    let stats = response.features[0].attributes;
                    let tab = document.getElementById('illinois-tab');
                    
                    tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(stats.Total_Cases)
                    let case_div = document.getElementById('illinois_total_case_number')
                    console.log(case_div.querySelector('.case-number').innerHTML)
                    let test_div = document.getElementById('illinois_total_test_number')
                    case_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.Total_Cases)
                    test_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.Total_Tested)
                }
            );
            
            const illinois_list_query = dph_illinois_county_static.createQuery();
            illinois_list_query.orderByFields = ['confirmed_cases DESC'];
            dph_illinois_county_static.queryFeatures(illinois_list_query)
                .then(function (response){
                    let illinois_table = document.getElementById('illinois-table').querySelector('tbody');
                    let template = document.querySelector('template')
                    let result_list = response.features.map(function(value){
                        return {
                            county:value.attributes.County,
                            case:value.attributes.confirmed_cases,
                            tested:value.attributes.total_tested
                        }
                    });
                    result_list.forEach(function(value){
                        let instance = template.content.cloneNode(true);
                        instance.querySelector('th').innerHTML = value.county;
                        instance.querySelector('.confirmed').innerHTML = value.case;
                        instance.querySelector('.tested').innerHTML = value.tested;
                        illinois_table.appendChild(instance);
                    })

                    var illini_table = $('#illinois-table').DataTable({
                        paging: false,
                        ordering: true,
                        info: false,
                        dom: "t",
                    });
                
                    $('#il-search-input').on('input', function() {
                        console.log($('#il-search-input').val());
                        illini_table.search($('#il-search-input').val()).draw();
                    });
                }
            );

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
                .then(function (response){
                    let stats = response.features[0].attributes;
                    let tab = document.getElementById('county-tab');
                    tab.querySelectorAll('span')[0].innerHTML = numberWithCommas(stats.Total_Cases)
                    let case_div = document.getElementById('counties_total_case_number')
                    let death_div = document.getElementById('counties_total_death_number')
                    case_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.Total_Cases)
                    case_div.querySelector('.change').innerHTML = "<i class='fas fa-caret-up'></i> "  + numberWithCommas(stats.Total_New_Cases)
                    death_div.querySelector('.case-number').innerHTML = numberWithCommas(stats.Total_Deaths)
                    death_div.querySelector('.change').innerHTML ="<i class='fas fa-caret-up'></i> " + numberWithCommas(stats.Total_New_Deaths)
                }
            );

            const counties_list_query = nyt_layer_counties.createQuery();
            counties_list_query.orderByFields = ['today_case DESC'];
            nyt_layer_counties.queryFeatures(counties_list_query)
                .then(function (response){
                    console.log(response)
                    let couneites_table = document.getElementById('county-table').querySelector('tbody');
                    let template = document.querySelectorAll('template')[1]
                    let result_list = response.features.map(function(value){
                        return {
                            county:value.attributes.NAME,
                            case:value.attributes.today_case,
                            new_case:value.attributes.today_new_case,
                            death:value.attributes.today_death,
                            new_death:value.attributes.today_new_death,
                        }
                    });
                    result = result_list.slice(0, 100);
                    result.forEach(function(value){
                        let instance = template.content.cloneNode(true);
                        instance.querySelector('th').innerHTML = value.county;
                        instance.querySelector('.confirmed').innerHTML = value.case + '<br><i class="fas fa-caret-up"></i> ' + value.new_case;
                        instance.querySelector('.death').innerHTML = value.death + '<br><i class="fas fa-caret-up"></i> ' + value.new_death;
                        couneites_table.appendChild(instance);
                    })
                    var county_table = $('#county-table').DataTable({
                        paging: false,
                        ordering: true,
                        info: false,
                        dom: "t",
                    });

                    $('#w-search-input').on('input', function() {
                        console.log($('#w-search-input').val());
                        county_table.search($('#w-search-input').val()).draw();
                    });
                    
                }
            );

            // const query = nyt_layer_counties.createQuery();
            // const totalConfrimStat = {
            //     onStatisticField: "today_case",
            //     outStatisticFieldName: "Total_Cases",
            //     statisticType: "sum"
            // };
            // const totalDeathStat = {
            //     onStatisticField: "today_death",
            //     outStatisticFieldName: "Total_Deaths",
            //     statisticType: "sum"
            // };
            // query.outStatistics = [totalConfrimStat, totalDeathStat];
            // nyt_layer_counties.queryFeatures(query)

            //     .then(function (response) {
            //         //console.log(response);
            //         var stats = response.features[0].attributes;
            //         confirmDiv.getElementsByTagName('h3')[0].innerHTML = numberWithCommas(stats.Total_Cases);
            //         deathDiv.getElementsByTagName('h3')[0].innerHTML = numberWithCommas(stats.Total_Deaths);
            //     });

            // const list_query = nyt_layer_counties.createQuery();
            // list_query.orderByFields = ['today_case DESC'];
            // nyt_layer_counties.queryFeatures(list_query)
            //     .then(function (response) {
            //         //console.log(response);
            //         var listDiv = document.getElementsByClassName('case-list')[0];
            //         var template = document.getElementsByTagName('template')[0];
            //         var result_list = response.features.map(function (value) {
            //             return {
            //                 county: value.attributes.NAME,
            //                 state: value.attributes.state_name,
            //                 cases: value.attributes.today_case,
            //             };
            //             //return value.NAME;
            //         });
            //         //console.log(result_list)
            //         result = result_list.slice(0, 11);
            //         result.forEach(function (value) {
            //             var instance = template.content.cloneNode(true);
            //             instance.querySelector('strong').textContent = numberWithCommas(value.cases);
            //             instance.querySelectorAll('span')[2].textContent = value.county + "," + value.state;
            //             listDiv.appendChild(instance);
            //         });
            //     });

        }

        // Zero-based Month: 0==Jan
        const dt_startConst = new Date(2020, 0, 14);
        var dt_start = dt_startConst;
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

            if (dt_interval_unit == "day") {
                dt_start = dt_startConst;
            }

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
            //console.log(name, oldValue, value);
            if (value == null) {
                addClass2Elem(sliderDiv, true, "hideDiv");

                //Hide the chart
                document.getElementById('myChart').classList.add("d-none");
                document.getElementById('myChart').classList.remove("d-block");
            } else {
                if (value != oldValue) {
                    // enable slider div
                    addClass2Elem(sliderDiv, false, "hideDiv");
                    queryLayerDates(value).then(initSlider).then(function () {
                        let thumb_value = slider.values[0];
                        if (thumb_value > slider.max || thumb_value < slider.min) {
                            thumb_value = slider.min;
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
        playButton.addEventListener("click", function () {
            if (playButton.classList.contains("toggled")) {
                stopAnimation();
            } else {
                startAnimation();
            }
        });

        view.ui.empty("top-left");
        view.ui.add(layerlist, "top-left");
        //view.ui.add(titleDiv, "top-left");

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
            new Legend({
                view: view
            }),
            "bottom-right"
        );
        view.ui.add(
            new Fullscreen({
                view: view,
                element: applicationDiv
            }),
            "top-right"
        );

        view.popup.autoCloseEnabled = true;

        // When the layerview is available, setup hovering interactivity
        //view.whenLayerView(active_animation_layer).then(setupHoverTooltip);

        var animation_dropdown = document.getElementById("animation_dropdown");
        var animation_type = animation_dropdown.value;
        //setDate(dt_start, animation_type = animation_type);
        //setDate(dt_start, animation_type="first_case");

        animation_dropdown.addEventListener("change", function (evt) {
            //console.log(evt);
            animation_type = evt.target.value;
            let thumb_value = Math.ceil(slider.values[0]);

            let current_date = date.add(dt_start, dt_interval_unit, thumb_value);
            setDate(current_date, animation_type = animation_type);
        });


        var ilZipTemplate = {
            expressionInfos: [{
                name: "zipcode",
                title: "Zip Code",
                expression: "Text($feature.ZipCode)"
            },],

            title: "{expression/zipcode}",

            content: [{
                type: "fields", // FieldsContentElement
                fieldInfos: [{
                    fieldName: "ZipCode",
                    visible: true,
                    label: "Zip Code"
                }, {
                    fieldName: "MainCity",
                    visible: true,
                    label: "Main City"
                }, {
                    fieldName: "FIPS",
                    visible: true,
                    label: "FIPS"
                }, {
                    fieldName: "population",
                    visible: true,
                    label: "Population"
                }, {
                    fieldName: "ZipCodeForecast",
                    visible: true,
                    label: "Forecast New Cases (week Apr 5-11, 2020)"
                }]
            }]
        };

        illinois_zipcode.popupTemplate = ilZipTemplate;

        var ilZipCaseTemplate = {
            title: "{id}",
            content: [
                {
                    type:"fields",
                    fieldInfos:[
                        {
                            fieldName:"confirmed_cases",
                            visible: true,
                            label: "Confirmed Cases"
                        },
                        {
                            fieldName:"total_tested",
                            visible: true,
                            label: "Total Tested"
                        },
                    ]
                }
            ]
        };
        dph_illinois_zipcode.popupTemplate = ilZipCaseTemplate;


        var ilCountyCaseTemplate = {
            title: "{County}",
            content: [
                {
                    type:"fields",
                    fieldInfos:[
                        {
                            fieldName:"confirmed_cases",
                            visible: true,
                            label: "Confirmed Cases"
                        },
                        {
                            fieldName:"total_tested",
                            visible: true,
                            label: "Total Tested"
                        },
                    ]
                }
            ]
        };

        dph_illinois_county_static.popupTemplate = ilCountyCaseTemplate;
        


        var ilCountyTemplate = {

            title: "{NAME}",

            content: [{
                type: "fields", // FieldsContentElement
                fieldInfos: [

                    {
                        fieldName: "FIPS",
                        visible: true,
                        label: "FIPS"
                    }, {
                        fieldName: "population",
                        visible: true,
                        label: "Population"
                    }, {
                        fieldName: "CountyForecast",
                        visible: true,
                        label: "Forecast New Cases (week Apr 5-11, 2020)"
                    }, {
                        fieldName: "Number_Booths",
                        visible: true,
                        label: "Booths"
                    }

                ]
            }]
        };

        illinois_counties.popupTemplate = ilCountyTemplate;

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
            }
            ],
            expressionInfos: [
                {
                    // Wed, 18 Mar 2020 00:00:00 GMT --> Wed, 18 Mar 2020
                    name: "lab_date",
                    title: "Lab Report Date",
                    expression: "Replace($feature.Lab_Report_Date, ' 0:00', '')"
                },
            ],
        };

        illinois_testing.popupTemplate = ilTestingTemplate;

        var usStateTemplate = {

            title: "{NAME}",
            expressionInfos: [
                {
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
            content: [
                {
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
                }
            ]
        };

        nyt_layer_states.popupTemplate = usStateTemplate;


        var usCountyTemplate = {

            title: "{NAME}",

            expressionInfos: [
                {
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
            content: [
                {
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
                }
            ]
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
                show: function (point, text) {
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

                hide: function () {
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

            Chart.defaults.global.defaultFontSize = 15;
            Chart.defaults.global.defaultFontColor = '#777';

            var datasetList = [];

            var CasesArray = (graphic.getAttribute("cases_ts")).split(",");

            var IncreasedCases = [];
            for (i = 1; i < CasesArray.length; i++) {
                IncreasedCases.push(CasesArray[i] - CasesArray[i - 1])
            }
            ;
            IncreasedCases.unshift(0);

            var ExtendedCasesArray = CasesArray.slice(0);
            ExtendedCasesArray.unshift(0, 0, 0, 0, 0, 0, 0);

            var ExtendedIncreasedCases = IncreasedCases.slice(0);
            ExtendedIncreasedCases.unshift(0, 0, 0, 0, 0, 0, 0);

            var firstCaseIndex = ExtendedCasesArray.findIndex(val=>val > 0);
            SlicedCasesArray = ExtendedCasesArray.slice(firstCaseIndex);
            SlicedIncreasedCases = ExtendedIncreasedCases.slice(firstCaseIndex);

            if (graphic.getAttribute("deaths_ts") != undefined) {
                var DeathsArray = (graphic.getAttribute("deaths_ts")).split(",");
                
                var IncreasedDeaths = [];
                for (i = 1; i < DeathsArray.length; i++) {
                    IncreasedDeaths.push(DeathsArray[i] - DeathsArray[i - 1])
                }
                ;
                IncreasedDeaths.unshift(0);

                var ExtendedDeathsArray = DeathsArray.slice(0);            
                ExtendedDeathsArray.unshift(0, 0, 0, 0, 0, 0, 0);
                
                var ExtendedIncreasedDeaths = IncreasedDeaths.slice(0);           
                ExtendedIncreasedDeaths.unshift(0, 0, 0, 0, 0, 0, 0);

                SlicedDeathsArray = ExtendedDeathsArray.slice(firstCaseIndex);
                SlicedIncreasedDeaths = ExtendedIncreasedDeaths.slice(firstCaseIndex);
            }

            var LabelDates = [];
            var LabelDate = new Date(2020, 0, 13);
            for (i = 0; i < ExtendedCasesArray.length; i++) {
                LabelDate.setDate(LabelDate.getDate() + 1);
                LabelDates.push(LabelDate.toLocaleDateString());
            }

            SlicedLabelDates = LabelDates.slice(firstCaseIndex);
            ;

            const verticalLinePlugin = {
                getLinePosition: function (chart, pointIndex) {
                    const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
                    const data = meta.data;
                    return data[pointIndex]._model.x;
                },
                renderVerticalLine: function (chartInstance, pointIndex) {
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

                afterDatasetsDraw: function (chart, easing) {
                    if (chart.config.lineAtIndex) {
                        chart.config.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
                    }
                }
            };

            Chart.plugins.register(verticalLinePlugin);

            dic1={
                    data: SlicedCasesArray,
                    label: "Confirmed Cases ",//+"("+graphic.getAttribute("NAME")+")",
                    borderColor: "#ffab24",
                    pointStyle: "circle",
                    fill: false
                };
            dic2={
                    data: SlicedIncreasedCases,
                    label: "Increased Cases ",//+"("+graphic.getAttribute("NAME")+")",
                    borderColor: "#f25100",
                    pointStyle: "circle",
                    fill: false
                };
                
            if (graphic.getAttribute("deaths_ts") != undefined) {
                dic3={
                        data: SlicedDeathsArray,
                        label: "Deaths ",//+"("+graphic.getAttribute("NAME")+")",
                        borderColor: "#a10025",
                        pointStyle: "circle",
                        fill: false
                    }; 
                dic4={
                        data: SlicedIncreasedDeaths,
                        label: "Increased Deaths ",//+"("+graphic.getAttribute("NAME")+")",
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
                lineAtIndex: [slider.values[0]-firstCaseIndex],
                animation: {
                    duration: 0
                },
                responsiveAnimationDuration: 0
            });

            // Prevent the animation of redrawing the chart
            window.bar.update(0);

        }

        function setupHoverTooltip(layerview) {

            var highlight;
            activeAnimationLayerView = layerview;

            // if (tooltip == null) {
            //     tooltip = createTooltip();
            // }

            if (hitTest == null) {
                hitTest = promiseUtils.debounce(function (event) {
                    return view.hitTest(event).then(function (hit) {
                        var results = hit.results.filter(function (result) {
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
                view.on("click", function (event) {
                    //view.on("pointer-move", function (event) {
                    return hitTest(event).then(
                        function (hit) {
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

                                updateChart(graphic);

                                highlight = activeAnimationLayerView.highlight(graphic);
                                console.log(graphic);
                                console.log(screenPoint);
                                // tooltip.show(
                                //     screenPoint,
                                //     "Cases in " + graphic.getAttribute("NAME")
                                // );
                            } else {
                                // tooltip.hide();
                            }
                        },
                        function () {
                        }
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
            animation_layers.forEach(function (value) {
                if (value.visible == true && value.parent.visible == true) {
                    console.log(value.title);
                    if (value.title == illinois_report.title) {
                        level = "illinois";
                    } else if (value.title == nyt_layer_counties.title) {
                        level = "county";
                    } else if (value.title == nyt_layer_states.title) {
                        level = "state";
                    } else if (value.title == dph_illinois_county_dynamic.title) {
                        level = "dph_illinois";
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
            _layer.renderer = classRender(_date, _event_type = event_type, _level = level);

            // if (animation_type == "case") {
            //     _layer.renderer = dailyEventNumberRender(_date, _event_type = "case", _scale = "loge");
            // } else if (animation_type == "death" || animation_type == "death/case" ||
            //     animation_type == "new_case" || animation_type == "new_death") {
            //     _layer.renderer = dailyEventNumberRender(_date, _event_type = animation_type, _scale = "");
            // } else {
            //     let event_type = "case";
            //     if (animation_type == "first_death") {
            //         event_type = "death"
            //     }

            //     _layer.renderer = classRender(_date, _event_type = event_type, _if_log = if_log, _method = method, _level = level);
            // }

            //covid19_layer.renderer = dailyEventNumberRender(_date, _event_type="death/case", _scale="");
            //covid19_layer.renderer = firstEventRender(_date, _event_type="Deaths");
        }

        function getDailyEventNumberArcade(_date, _event_type = "case", _scale = "") { // get accumulated Case Number
            return `
  // be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!
  var d_thumb = Date(${_date.getFullYear()},${_date.getMonth()},${_date.getDate()});
  var event_type = '${_event_type}';
  event_type = Lower(event_type);
  var scale = '${_scale}';
  //Console(d_thumb);
  //Console($feature);

  var population = DefaultValue($feature.population, 0);

  var cases_num=0;
  var deaths_num=0;
  var cases_num_yesterday=0;
  var deaths_num_yesterday=0;
  var final_return_value = 0;


  if (IsEmpty($feature['cases_ts']))
  {
      cases_num = 0;
      deaths_num = 0;
      cases_num_yesterday=0;
      deaths_num_yesterday=0;
  }
  else
  {
    var dt_start_array = Split($feature.dt_start, '-');
    var dt_start = Date(Number(dt_start_array[0]), Number(dt_start_array[1])-1, Number(dt_start_array[2]));
      if (d_thumb < dt_start)
      {
         cases_num = 0;
         deaths_num = 0;
         cases_num_yesterday=0;
         deaths_num_yesterday=0;
      }
      else
      {
          //var cases_ts_array = Dictionary($feature["cases_ts"]).values;
          //var deaths_ts_array = Dictionary($feature["deaths_ts"]).values;
          var cases_ts_array = Split($feature["cases_ts"], ',');
          var deaths_ts_array = Split($feature["deaths_ts"], ',');


          var days=DateDiff(d_thumb, dt_start, "days");
          var index = Ceil(days);
          //Console(days);
          if(HasKey($feature, "dt_unit"))
          {
            if($feature["dt_unit"]=="week")
            {
              index=Ceil(days/7);
            }
          }

          cases_num = Number(cases_ts_array[index]);
          deaths_num = Number(deaths_ts_array[index]);
          if(index>0)
          {
            cases_num_yesterday=Number(cases_ts_array[index-1]);
            deaths_num_yesterday=Number(deaths_ts_array[index-1]);
          }
          else
          {
            cases_num_yesterday=cases_num;
            deaths_num_yesterday=deaths_num;
          }

      } //if (d_thumb < dt_start)
  } //if (fea_dt_start==-1)

  if (event_type=="case")
  {
     final_return_value = cases_num;
  }
  else if (event_type=="death")
  {
     final_return_value = deaths_num;
  }
  else if (event_type=="death/case")
  {
     if (cases_num>0)
     {
        final_return_value = deaths_num/cases_num;
     }
     else
     {
        final_return_value=0;
     }
  }
  else if(event_type=="case/population")
  {
     if (population >0 )
     {
     final_return_value = cases_num/population;
     }
     else
     {
     final_return_value=0;
     }
  }
  else if(event_type=="death/population")
  {
     if(population >0 )
     {
     final_return_value = deaths_num/population;
     }
     else
     {
     final_return_value=0;
     }
  }
  else if(event_type=="new_case")
  {
     final_return_value = cases_num - cases_num_yesterday;
  }
  else if(event_type=="new_death")
  {
     final_return_value = deaths_num - deaths_num_yesterday;
  }
  else
  {
     final_return_value = 0;
  }

  // scaling
  if (scale=="loge")
    {
    final_return_value = Log(final_return_value+1);
    }

    //Console(final_return_value);
    return final_return_value;

  `;
        }

        // Deprecated
        function getDailyEventNumberArcade2(_date) {
            // get accumulated Case Number if daily increase is stored
            return `
// start date; Month 0-based in Arcade Date class
// be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!
var end_dt = Date(${_date.getFullYear()},${_date.getMonth()},${_date.getDate()});
//var end_dt = Date(2020,2,26);
var start_dt = Date(2020,0,21);
var days=DateDiff(end_dt, start_dt, "days");
var sum=0;
for(var i=0; i<=days; i++) {
var d = DateAdd(start_dt, i, "days");
var key=Text(d, "FY_MM_DD");
// if attribute value is null, use 0
var day_value = IIf(IsEmpty($feature[key]), 0, $feature[key]);
sum += day_value;
}
return sum;

    `;
        }

        function dailyEventNumberRender(_date, _event_type = "case", _scale = "") {

            const colors = ["#000000", "#fef0d9", "#fdcc8a", "#fc8d59", "#e34a33", "#b30000"];
            let stops = [0, 0.01, 0.05, 0.10, 0.15, 0.2];
            let labels = ["0", "1%", "5%", "10%", "15%", "20%"];

            let event_type = _event_type.toLowerCase();

            if (event_type == "case") {
                //let case_max = Math.max.apply(Math, counties_data.metadata.cases);
                let case_max = 500;

                let interval = Math.ceil(case_max / 20);
                stops = [0, 1, interval, 2 * interval, 3 * interval, case_max];
                labels = stops.map(x => x.toString());
                stops = [0, 1, interval, 2 * interval, 3 * interval, case_max];
                stops = stops.map(x => Math.log(x));

            } else if (event_type == "death") {
                //let death_max = Math.max.apply(Math, counties_data.metadata.deaths);
                let death_max = 200;

                let interval = Math.ceil(death_max / 10);
                stops = [0, 1, interval, 2 * interval, 3 * interval, death_max];
                labels = stops.map(x => x.toString());

            } else if (event_type == "death/case") {
                stops = [0, 0.01, 0.05, 0.10, 0.15, 0.2];
                labels = ["0", "1%", "5%", "10%", "15%", "20%"];
            } else {
                stops = [0, 1, 100, 500, 1000, 5000];
                labels = stops.map(x => x.toString());

            }

            let stops_array = [];
            for (let i = 0; i < colors.length; i++) {
                let stop_item = {
                    value: stops[i],
                    color: colors[i],
                    label: labels[i].toString()
                };
                stops_array.push(stop_item);
            }


            return {
                type: "simple",
                symbol: {
                    type: "simple-fill",
                    color: [0, 0, 0, 0],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [128, 128, 128, 0.5],
                    }
                },
                visualVariables: [{
                    type: "color",
                    //field: 'F'+String(_date.getFullYear()).padStart(4, '0')+"_"+String(_date.getMonth()+1).padStart(2, '0')+"_"+String(_date.getDate()).padStart(2, '0'),
                    valueExpression: getDailyEventNumberArcade(_date, _event_type = _event_type, _scale = _scale),
                    //normalizationField: "population",
                    valueExpressionTitle: _event_type,
                    stops: stops_array.reverse(),
                }]
            };
        }

        function firstEventRender(_date, _event_type = "Case") {

            return {
                type: "simple",
                symbol: {
                    type: "simple-fill",
                    color: [0, 0, 0, 0],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [128, 128, 128, 0.5],
                    }
                },
                visualVariables: [{
                    type: "color",
                    valueExpression: firstEventArcade(_date, _event_type = _event_type),
                    //valueExpressionTitle: "Voter Turnout",
                    stops: [{
                        value: 1,
                        color: [241, 138, 98, 1],
                        label: _event_type + "(s) Reported"
                    }, {
                        value: 0,
                        color: [0, 255, 255, 1],
                        label: "First " + _event_type
                    }, {
                        value: -1,
                        //color: "#000000",
                        color: [0, 0, 0, 0],
                        label: "No " + _event_type
                    },],
                }]
            };
        }

        function classRender(_date, _event_type = "case", _level = "county") {
            const colors = ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#e34a33", "#b30000"];
            const background_color = [0, 0, 0];
            let constant_class = classes_data;
            let dynamic_class = dynamic_classes_data;
            //Specify the methods
            let source = null;
            _method = visualizationSchema[_level][_event_type]['breaks'];
            _if_log = visualizationSchema[_level][_event_type]['value'];
            // 5 Common type: Constant Classes
            if (_event_type == "case" || _event_type == "death" || _event_type == "case_per_100k_capita"
                || _event_type == "death_per_100k_capita" || _event_type == "death_case_ratio") {
                source = constant_class[_level][_event_type][_if_log][_method];
                let bins = source.bins.split(",")
                let stop_array = [{
                    value: -1,
                    color: background_color,
                    label: 0
                }];
                // bins.length <= colors.length
                // e.g. if only 2 classes, get [4,5] colors
                for (let i = 0; i < bins.length; i++) {
                    var label = bins[i];
                    if (parseFloat(label) < 0) {
                        label = parseFloat(label);
                    } else {
                        label = parseInt(label);
                    }
                    stop_array.push({
                        value: i,
                        color: colors[i],
                        label: label,
                    })
                }
                return {
                    type: "simple",
                    symbol: {
                        type: "simple-fill",
                        outline: {  // autocasts as new SimpleLineSymbol()
                            color: [128, 128, 128, 50],
                        }
                    },
                    visualVariables: [
                        {
                            type: "color",
                            valueExpression: classArcade(_date, _class = bins, _event_type = _event_type, _if_log = _if_log),
                            //valueExpressionTitle: "Voter Turnout",
                            stops: stop_array.reverse(),
                        }
                    ]
                };

            }
            // Two Situation: Dynamic Classes
            else if (_event_type == "new_case" || _event_type == "new_death") {
                console.log(dynamic_class)
                source = dynamic_class[_level][_event_type];

                return {
                    type: "simple",
                    symbol: {
                        type: "simple-fill",
                        outline: {  // autocasts as new SimpleLineSymbol()
                            color: [128, 128, 128, 0],
                        }
                    },
                    visualVariables: [
                        {
                            type: "color",
                            valueExpression: dynamicClassArcade(_date, _class = bins, _event_type = _event_type),
                            //valueExpressionTitle: "Voter Turnout",
                            stops: stop_array.reverse(),
                        }
                    ]
                };
            }


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

        function dynamicClassArcade(_date, _class, _event_type = "case") {

            // Drew: return must be followed by the open ` on the same line, and a semi-colon ";" is required after the close `!!!
            return `
                //be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!

                var dt_thumb = Date(${_date.getFullYear()}, ${_date.getMonth()}, ${_date.getDate()});
                var event_type = Lower('${_event_type}');
                var val = 0;
                var class = 0;
                var population = Number($feature['population'])/100000;
                var dt_start_array = Split($feature.dt_start, '-');
                var dt_start = Date(Number(dt_start_array[0]), Number(dt_start_array[1])-1, Number(dt_start_array[2]));
                if(dt_thumb < dt_start){
                    class = -1;
                    return class;
                }
                var days=DateDiff(dt_thumb, dt_start, "days");
                var index = Ceil(days);
                // New Case & New Death: Dynamic Classes
                if(event_type == "new_case" || event_type == "new_death"){
                    var yesterday = index - 1;
                    var bins = Dictionary(${_class})[index]
                    if(yesterday < 0){
                        return 0;
                    }else{
                        if(event_type == "new_case"){
                            var case_ts = Split($feature['cases_ts'],',');
                            val = Number(case_ts[index]) - Number(case_ts[yesterday]);
                        }
                        if(event_type == "new_death"){
                            var death_ts = Split($feature['deaths_ts'],',');
                            val = Number(death_ts[index]) - Number(death_ts[yesterday]);
                        }
                    }

                }
                // Other 5 situations: Constant Classes
                else{
                    var bins = [${_class}];
                    if(event_type == "case" || event_type == "case_per_100k_capita"){
                        var case_ts = Split($feature['cases_ts'],',');
                        val = case_ts[index];
                        if(event_type == "case_per_100k_capita"){
                            val = val/population;
                        }
                    }
                    else if(event_type == "death" || event_type == "death_per_100k_capita"){
                        var death_ts = Split($feature['deaths_ts'],',');
                        val = death_ts[index];
                        if(event_type == "death_per_100k_capita"){
                            val = val/population;
                        }
                    }
                    else if(event_type == "death_case_ratio"){
                        var case_ts = Split($feature['cases_ts'],',');
                        var death_ts = Split($feature['deaths_ts'],',');
                        val = death_ts[index]/case_ts[index];
                    }
                    
                }
                // Find Class from bins
                if(Count(bins) == 1){
                    return -1;
                }
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

        function dynamicClassArcade(_date, _class, _event_type = "case") {

            // Drew: return must be followed by the open ` on the same line, and a semi-colon ";" is required after the close `!!!
            return `
                //be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!

                var dt_thumb = Date(${_date.getFullYear()}, ${_date.getMonth()}, ${_date.getDate()});
                var event_type = Lower('${_event_type}');
                var val = 0;
                var class = 0;
                var case_ts = null;
                var death_ts = null;
                var population = Number($feature['population'])/100000;
                var bins = [${_class}];
                var dt_start_array = Split($feature.dt_start, '-');
                var dt_start = Date(Number(dt_start_array[0]), Number(dt_start_array[1])-1, Number(dt_start_array[2]));
                if(dt_thumb < dt_start){
                    class = -1;
                    return class;
                }
                var days=DateDiff(dt_thumb, dt_start, "days");
                var index = Ceil(days);

                if(event_type == "case" || event_type == "case_per_100k_capita"){
                    case_ts = Split($feature['cases_ts'],',');
                    val = case_ts[index];
                    if(event_type == "case_per_100k_capita"){
                        val = val/population;
                    }
                }
                else if(event_type == "death" || event_type == "death_per_100k_capita"){
                    death_ts = Split($feature['deaths_ts'],',');
                    val = death_ts[index];
                    if(event_type == "death_per_100k_capita"){
                        val = val/population;
                    }
                }
                else if(event_type == "death_case_ratio"){
                    case_ts = Split($feature['cases_ts'],',');
                    death_ts = Split($feature['deaths_ts'],',');
                    val = death_ts[index]/case_ts[index];
                }
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

        function firstEventArcade(_date, _event_type = "Case") {
            // Drew: return must be followed by the open ` on the same line, and a semi-colon ";" is required after the close `!!!
            return `
  //be sure to use .getDate() for Day value!  NOT .getDay()!!!!!!!

  var dt_thumb = Date(${_date.getFullYear()}, ${_date.getMonth()}, ${_date.getDate()});
  var event_type = Lower('${_event_type}');
  var dt_first_event = null;
  var dt_null_string = '2099-01-01-';

   var field_name = "";
   if (event_type=="case")
   {field_name="dt_first_case";}
   else
   {field_name="dt_first_death";}
  var dt_first_event = DefaultValue($feature[field_name], dt_null_string);
  var dt_first_event_array = Split(dt_first_event, '-');
  var dt_first_event = Date(Number(dt_first_event_array[0]),
                          Number(dt_first_event_array[1])-1,
                          Number(dt_first_event_array[2]));

  var days=DateDiff(dt_thumb, dt_first_event, "days");
  return days;

  // // For UniqueValueRender or ClassBreakRender
  // if (days==0)
  // { return 0; }
  // else
  // {
  //   if (days>0)
  //       {return 1; }
  //   else
  //       {return -1;}
  // }

  `;
        }

        function firstEventRender2(_date, _event_type = "Case") {
            var sym1 = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: "red",
                outline: { // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.5],
                    width: "0.5px"
                }
            };
            var sym0 = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: "#0ff",
                outline: { // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.5],
                    width: "0.5px"
                }
            };
            var sym_1 = {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: "rgb(0, 0, 0)",
                outline: { // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.5],
                    width: "0.5px"
                }
            };


            // return {
            //   type: "unique-value",
            //     //defaultSymbol: { type: "simple-fill",color: "yellow" },
            //     valueExpression: firstEventArcade(_date, _event_type=_event_type),
            //       //valueExpression: "return 0",
            // valueExpressionTitle:
            //   "First Event: " + _event_type,
            //     uniqueValueInfos: [
            //               {
            //           value: 1,
            //           symbol: sym1,
            //           label: _event_type+"(s) Reported",
            //         },
            //         {
            //           value: 0,
            //           symbol: sym0,
            //           label: "First " + _event_type,
            //         },
            //           {
            //           value: -1,
            //           symbol: sym_1,
            //           label: "No " + _event_type,
            //         },
            //       ],
            // };
            return {
                type: "class-breaks", // autocasts as new ClassBreaksRenderer()

                valueExpression: firstEventArcade(_date, _event_type = _event_type),
                classBreakInfos: [{
                    minValue: 0,
                    maxValue: 0,
                    symbol: sym0,
                    label: "First Case" // label for symbol in legend
                }, {
                    minValue: 1,
                    maxValue: 1,
                    symbol: sym1,
                    label: "Case(s) Reported" // label for symbol in legend
                }, {
                    minValue: -1,
                    maxValue: -1,
                    symbol: sym_1,
                    label: "No Case" // label for symbol in legend
                },]
            };
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
            if(_event_type == "tested" || _event_type == "zipcode_tested"){
                fieldName = "total_tested"
            }else if(_event_type == "zipcode_case"){
                fieldName = "confirmed_cases"
            }
            return {
                type: "simple",
                symbol: {
                    type: "simple-fill",
                    outline: {  // autocasts as new SimpleLineSymbol()
                        color: [128, 128, 128, 50],
                    }
                },
                visualVariables: [
                    {
                        type: "color",
                        valueExpression: dphStaticArcade(bins,fieldName),
                        //valueExpressionTitle: "Voter Turnout",
                        stops: stop_array.reverse(),
                    
                    }
                ]
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
            animation = animate(slider.values[0]);
            playButton.classList.add("toggled");
        }

        /**
         * Stops the animations
         */
        function stopAnimation() {
            if (!animation) {
                return;
            }

            animation.remove();
            animation = null;
            playButton.classList.remove("toggled");
        }

        /**
         * Animates the color visual variable continously
         */
        function animate(startValue) {
            var animating = true;
            var value = startValue;

            var frame = function (timestamp) {
                if (!animating) {
                    return;
                }

                value += 1;
                if (value > slider.max) {
                    value = slider.max;
                }
                var dt_thumb = date.add(dt_start, dt_interval_unit, Math.floor(value));
                setDate(dt_thumb, animation_type = animation_type);

                // Update at 30fps
                setTimeout(function () {
                    requestAnimationFrame(frame);
                    updateChart(hitGraphic);
                }, 1000 / 10);
            };

            frame();

            return {
                remove: function () {
                    animating = false;
                }
            };
        }

    }; //main


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

        let counties_request = request(counties_data_json_url, {handleAs: "json"});
        let states_request = request(states_data_json_url, {handleAs: "json"});
        let classes_request = request(classes_json_url, {handleAs: "json"});
        let dynamic_classes_request = request(dynamic_classes_json_url, {handleAs: "json"});

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

        let promise = new Promise(function (resolve, reject) {
            // the function is executed automatically when the promise is constructed

            // after 1 millisecond signal that the job is done with the result "done"
            setTimeout(() => resolve("Load JSON Done"), 1);
        });
        return promise;
    }

    //pre_main().then(main);
    pre_main().then(main);

});