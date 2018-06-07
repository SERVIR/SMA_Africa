/*****************************************************************************
 * FILE:    MAP JS
 * DATE:    7 JUNE 2018
 * AUTHOR: Sarva Pulla
 * COPYRIGHT: (c) SERVIR GLOBAL 2018
 * LICENSE: BSD 2-Clause
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/

var LIBRARY_OBJECT = (function() {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library

    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
    var base_map2,
        $confModal,
        current_layer,
        layers,
        map,
        $plotModal,
        proj_coords,
        public_interface,				// Object returned by the module
        sma_layer,
        sma_source,
        wms_source,
        wms_layer;



    /************************************************************************
     *                    PRIVATE FUNCTION DECLARATIONS
     *************************************************************************/

    var get_plot,
        generate_chart,
        generate_forecast,
        init_all,
        init_events,
        init_vars,
        init_map;

    /************************************************************************
     *                    PRIVATE FUNCTION IMPLEMENTATIONS
     *************************************************************************/

    init_vars = function(){
        $confModal = $("#conf-modal");
        $plotModal = $("#plot-modal");
    };

    init_map = function(){
        var attribution = new ol.Attribution({
            html: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/rest/services/">ArcGIS</a>'
        });

        var base_map = new ol.layer.Tile({
            crossOrigin: 'anonymous',
            source: new ol.source.OSM()
        });

        base_map2 = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });



        var west_africa = new ol.Feature(new ol.geom.Polygon(([[[-2011131.59904,-4292739.30185],
            [6070402.5275,-4292739.30185],
            [6070402.5275,4603427.95377],
            [-2011131.59904,4603427.95377],
            [-2011131.59904,-4292739.30185]]])));

        var boundary_layer = new ol.layer.Vector({
            title:'Boundary Layer',
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "red",
                    width: 1
                })
            })
        });
        boundary_layer.getSource().addFeatures([west_africa]);

        var vector_source = new ol.source.Vector({
            wrapX: false
        });

        var vector_layer = new ol.layer.Vector({
            name: 'my_vectorlayer',
            source: vector_source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        sma_source = new ol.source.XYZ();

        sma_layer = new ol.layer.Tile({
            source: sma_source
        });

        layers = [base_map,base_map2,boundary_layer,sma_layer,vector_layer];
        map = new ol.Map({
            target: 'map',
            layers: layers,
            view: new ol.View({
                center: ol.proj.fromLonLat([34.5,8.7832]),
                zoom: 4
            })
        });

        map.getLayers().item(1).setVisible(false);

        //Code for adding interaction for drawing on the map
        var lastFeature, draw, featureType;

        //Clear the last feature before adding a new feature to the map
        var removeLastFeature = function () {
            if (lastFeature) vector_source.removeFeature(lastFeature);
        };

        //Add interaction to the map based on the selected interaction type
        var addInteraction = function (geomtype) {
            if (draw)
                map.removeInteraction(draw);

            draw = new ol.interaction.Draw({
                source: vector_source,
                type: geomtype
            });


            map.addInteraction(draw);
            if (geomtype === 'Polygon') {

                draw.on('drawend', function (e) {
                    lastFeature = e.feature;

                });

                draw.on('drawstart', function (e) {
                    vector_source.clear();
                });

            }

        };

        vector_layer.getSource().on('addfeature', function(event){
            //Extracting the point/polygon values from the drawn feature
            var feature_json = saveData();
            var parsed_feature = JSON.parse(feature_json);
            var feature_type = parsed_feature["features"][0]["geometry"]["type"];

            $confModal.find('.info').html('');
            var coords = parsed_feature["features"][0]["geometry"]["coordinates"][0];
            proj_coords = [];
            coords.forEach(function (coord) {
                var transformed = ol.proj.transform(coord,'EPSG:3857','EPSG:4326');
                proj_coords.push('['+transformed+']');
            });
            var json_object = '{"type":"Polygon","coordinates":[['+proj_coords+']]}';
            $("#poly-lat-lon").val(json_object);
            $confModal.find('.info').html('<b>You have selected the following polygon object '+proj_coords+'. Click on Show plot to view the Time series.</b>');
            $confModal.modal('show');
        });

        function saveData() {
            // get the format the user has chosen
            var data_type = 'GeoJSON',
                // define a format the data shall be converted to
                format = new ol.format[data_type](),
                // this will be the data in the chosen format
                data;
            try {
                // convert the data of the vector_layer into the chosen format
                data = format.writeFeatures(vector_layer.getSource().getFeatures());
            } catch (e) {
                // at time of creation there is an error in the GPX format (18.7.2014)
                $('#data').val(e.name + ": " + e.message);
                return;
            }
            // $('#data').val(JSON.stringify(data, null, 4));
            return data;

        }
        addInteraction('Polygon');

    };

    init_events = init_events = function() {
        (function () {
            var target, observer, config;
            // select the target node
            target = $('#app-content-wrapper')[0];

            observer = new MutationObserver(function () {
                window.setTimeout(function () {
                    map.updateSize();
                }, 350);
            });
            $(window).on('resize', function () {
                map.updateSize();
            });

            config = {attributes: true};

            observer.observe(target, config);
        }());


        //Map on zoom function. To keep track of the zoom level. Data can only be viewed can only be added at a certain zoom level.
        map.on("moveend", function () {
            var zoom = map.getView().getZoom();
            // var zoomInfo = '<p style="color:white;">Current Zoom level = ' + parseFloat(zoom,3)+'.</p>';
            // document.getElementById('zoomlevel').innerHTML = zoomInfo;
            if (zoom > 14) {
                base_map2.setVisible(true);
            } else {
                base_map2.setVisible(false);
            }
            // Object.keys(layersDict).forEach(function(key){
            //     var source =  layersDict[key].getSource();
            // });
        });

    };



    generate_chart = function(container,data,name,title){
        Highcharts.stockChart(container,{
            chart: {
                type:'line',
                zoomType: 'x'
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: true
                    }
                }
            },
            title: {
                text:title
                // style: {
                //     fontSize: '13px',
                //     fontWeight: 'bold'
                // }
            },
            xAxis: {
                type: 'datetime',
                labels: {
                    format: '{value:%d %b %Y}'
                    // rotation: 90,
                    // align: 'left'
                },
                title: {
                    text: 'Date'
                }
            },
            yAxis: {
                title: {
                    text: '%'
                }
            },
            exporting: {
                enabled: true
            },
            series: [{
                data:data,
                name: name
            }]
        });
    };

    get_plot = function(){
        var start_date = $("#start_date").val();
        var end_date = $("#end_date").val();
        var polygon = $("#poly-lat-lon").val();
        var $loading = $('#view-file-loading');
        var $loading2 = $('#f-view-file-loading');
        var $loading3= $('#n-view-file-loading');
        var $loading4= $('#c-view-file-loading');
        $loading.removeClass('hidden');
        $loading2.removeClass('hidden');
        $loading3.removeClass('hidden');
        $loading4.removeClass('hidden');
        $("#bsf-plotter").addClass('hidden');
        $("#pvf-plotter").addClass('hidden');
        $("#npvf-plotter").addClass('hidden');
        $("#comb-plotter").addClass('hidden');
        $confModal.modal('hide');
        $plotModal.modal('show');
        var xhr = ajax_update_database("get-plot",{"polygon":polygon,"start_date":start_date,"end_date":end_date});
        xhr.done(function(data) {
            $plotModal.find('.info').html('');
            $plotModal.find('.warning').html('');
            if("success" in data) {

                var mapid = data["ee_obj"]["mapid"];
                var token = data["ee_obj"]["maptoken"];
                generate_chart('bsf-plotter',data["ee_obj"]["bsf_ts_values"],'Bare Substrate Fraction','Mean bare substrate fraction');
                generate_chart('pvf-plotter',data["ee_obj"]["pvf_ts_values"],'PV Fraction','Mean photosynthetic vegetation (PV) fraction');
                generate_chart('npvf-plotter',data["ee_obj"]["npvf_ts_values"],'NPV Fraction','Mean non-photosynthetic vegetation (NPV) fraction');
                Highcharts.stockChart('comb-plotter',{
                    chart: {
                        type:'line',
                        zoomType: 'x'
                    },
                    plotOptions: {
                        series: {
                            marker: {
                                enabled: true
                            }
                        }
                    },
                    title: {
                        text:'Combined Graph'
                        // style: {
                        //     fontSize: '13px',
                        //     fontWeight: 'bold'
                        // }
                    },
                    xAxis: {
                        type: 'datetime',
                        labels: {
                            format: '{value:%d %b %Y}'
                            // rotation: 90,
                            // align: 'left'
                        },
                        title: {
                            text: 'Date'
                        }
                    },
                    yAxis: {
                        title: {
                            text: '%'
                        },
                        max:1
                    },
                    exporting: {
                        enabled: true
                    },
                    series: [{
                        data:data["ee_obj"]["bsf_ts_values"],
                        name: 'Bare Substrate Fraction'
                    },
                    {
                        data:data["ee_obj"]["pvf_ts_values"],
                        name: 'PV Fraction'
                    },
                    {
                        data:data["ee_obj"]["npvf_ts_values"],
                        name: 'NPV Fraction'
                    }]
                });
                $loading.addClass('hidden');
                $loading2.addClass('hidden');
                $loading3.addClass('hidden');
                $loading4.addClass('hidden');
                $("#bsf-plotter").removeClass('hidden');
                $("#pvf-plotter").removeClass('hidden');
                $("#npvf-plotter").removeClass('hidden');
                $("#comb-plotter").removeClass('hidden');

                map.getLayers().item(3).getSource().setUrl("https://earthengine.googleapis.com/map/"+mapid+"/{z}/{x}/{y}?token="+token);
            }else {
                $plotModal.find('.warning').html('<b>'+data.error+'</b>');
                $loading.addClass('hidden');
                $loading2.addClass('hidden');
                $loading3.addClass('hidden');
                $loading4.addClass('hidden');
            }
        });
    };

    $("#btn-get-plot").click(get_plot);

    init_all = function(){
        init_vars();
        init_map();
        init_events();
    };


    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/
    /*
     * Library object that contains public facing functions of the package.
     * This is the object that is returned by the library wrapper function.
     * See below.
     * NOTE: The functions in the public interface have access to the private
     * functions of the library because of JavaScript function scope.
     */
    public_interface = {

    };

    /************************************************************************
     *                  INITIALIZATION / CONSTRUCTOR
     *************************************************************************/

    // Initialization: jQuery function that gets called when
    // the DOM tree finishes loading

    $(function() {
        init_all();


    });

    return public_interface;

}()); // End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.