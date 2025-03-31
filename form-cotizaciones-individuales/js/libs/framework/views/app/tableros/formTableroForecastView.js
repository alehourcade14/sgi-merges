define([
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    'bootstrap',
    'ace',
    'encoding',
    '/form-cotizaciones-individuales/js/libs/settings.js',
    'util',
    '/form-smg-commons/js/libs/asyncProcessor.js',
    'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/tableros/formTableroForecastTemplate.html',
    'session',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util,
             AsyncProcessor, formTemplate, Session, AjaxScreenLockUtil
    ){

	var newView = Backbone.View.extend ({

        datosAsesor :{
                forecastPesos : "15487.05 $$",
                forecastCapitas : 985 ,
                forecastPesosPonderado : 3097.41
        },
    
		events: {
			'click 	#btn-saveConfigPmpm' 					: 'saveConfigPmpm',
			'click 	.view-adminVentasUcom' 					: 'viewAdminVentasUcom',
            'click 	.new-adminVentasUcom' 					: 'newAdminVentasUcom',
			'click 	.edit-adminVentasUcom' 					: 'editAdminVentasUcom',
			'click 	.delete-adminVentasUcom' 				: 'deleteAdminVentasUcom',
			'click 	#edit-adminVentasUcom' 					: 'showEditAdminVentasUcom',
            'click	.view-list' 							: 'viewList',
            'change #zona'                                  : 'changePlanesPorZona'
        },

        alertMessage: function(message, severity, icon, title) {
            $.gritter.add({
                title: "<i class=\"icon-" + icon + "bigger-120\"></i>&nbsp;" + title,
                text: message,
                class_name: "gritter-" + severity
            });
        },

        obtenerUrlDatosForecast: function () {
            var url = "";
            //no existe este servicio en form-smg-commons
            url = SettingsModel.get("tablero_forecast_rest_api_url") + "tableroForecastInd/";
            if (Util.hasRole("SGI_ASESOR_FFVV")) {
                var codigoAsesor = Session.getLocal('userName');;
                url += "asesor?codigoAsesor=" + codigoAsesor;

            } else {
                if (Util.hasRole("SGI_SUPERVISOR_FFVV")) {
                    var userName = Session.getLocal('userName');
                    url += "supervisor?codigoAsesor=" + userName;
                    /*
                    LoginService.userInformation(userName, false,
                        function (data) {
                            url = url + data.legajo;
                        },
                        function () {},
                        function () {});
                    */
                }
            }
            return url;
        },
        
		list: function () {
            self = this;

            var asyncFunctions = [];

            asyncFunctions.push(function (successFunction, context) {
                AjaxScreenLockUtil.lock();
                successFunction();
            });

            
            asyncFunctions.push(function (successFunction, context) {
                self.urlPeticion = self.obtenerUrlDatosForecast();
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                self.labels = [],
                self.datosPesos = [],
                self.datosCapitas = [],

                $.ajax({
                    url: self.urlPeticion,
                    type: 'GET',
                    contentType: "application/json; charset=UTF-8",
                    accept: "application/json; charset=UTF-8",
                    encoding: "UTF-8",
                    async: true,
                    cache: false,
                    success: function (datosTableroForecast) {
                        self.datosTableroForecast = datosTableroForecast;
                        for (var i = 0; i < datosTableroForecast.length; i++) {
                            self.labels.push(datosTableroForecast[i].asesor);
                            self.datosPesos.push(datosTableroForecast[i].forecastPesos);
                            self.datosCapitas.push(datosTableroForecast[i].capitasAVender);
                        }
                        successFunction();
                        
                    }
                });
            });
            
            asyncFunctions.push(function(successFunction, context) {	
				$("#content1").empty();
				$("#content1").append(self.render(self.datosTableroForecast).el);
				successFunction()
            })
            
            
            asyncFunctions.push(function(successFunction, context) {	
				self.renderTableros(successFunction);
            })
            
           
            asyncFunctions.push(function(onSuccess, context) {
				AjaxScreenLockUtil.unlock();
				onSuccess();
			});
			
			AsyncProcessor.process(asyncFunctions, {});

        },

        render: function (datosAsesores) {
            var compiledTemplate = Handlebars.compile(formTemplate);
            this.$el.html (compiledTemplate({datosAsesores : datosAsesores}));
            return this;
        },

        renderTableros: function (successFunction) {
            $("[id*='ChartContainer']").each(function(){
                self.renderChar( $(this).data("title"), $(this).data("type"), $(this));
               });
            
            successFunction();
        },

        renderChar: function(titulo, formato, target){
            var self = this;
            var datos = self.datosCapitas;
            if(formato == 'pesos'){
                var datos = self.datosPesos;
                
            }
            var options = {
                chart: {
                    backgroundColor: '#eaeaea',
                    plotBackgroundColor: '#eaeaea',
                    renderTo: 'container',
                    type: 'column',
                    fitToPlot: true,
                    options3d: {
                        enabled: false,
                        alpha: 15,
                        beta: 0,
                        depth: 40
                    }
                },
                title: {
                    text: titulo,
                    style: {
                        fontWeight: 'bold'
                    }
                },
                plotOptions: {
                    enableMouseTracking: false,
                    series: {
                        pointWidth: 50
                    },
                    column: {
                        stacking: 'normal',
                        depth: 60
                    }
                },
                series: [{
                    data: datos,
                    text: '',
                    backgroundColor: '#cb3234',
                    name: 'Forecast Pesos'
                }],
                xAxis: {
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    categories: self.labels

                },
                credits: {
                    enabled: false
                },
                legend: {
                    enabled: false
                },
                yAxis: {
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    title: {
                        text: ''
                    },
                    labels: {
                        format: '${value} ',
                    }
                },
                exporting: {
                    enabled: false
                },
                tooltip: {
                    valuePrefix: "$ ",
                    valueDecimals: 2
                }
            }

            if(formato != 'pesos'){
                delete options.tooltip;
                delete options.yAxis.labels
            }

            target.highcharts(options);
        }
    });

    return newView;
});