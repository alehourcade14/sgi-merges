define ([
         'jquery',
         'underscore',
         'backbone',
         'handlebars',
         'bootstrap',
         'ace',
		 'encoding',
         '/form-smg-commons/js/libs/objectSerializer.js',
         '/form-cotizaciones-individuales/js/libs/settings.js',
         'util',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/tableros/formTableroFunnelTemplate.html',
         'session'
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, ObjectSerializer, SettingsModel, Util,
             formTemplate, Session){
 
	var validate  = {
		errorElement: 'span',
		errorClass: 'help-inline',
		focusInvalid: false,
		rules: null,
		messages: null,
		invalidHandler: function (event, validator) { //display error alert on form submit
		},
		highlight: function (e) {
			$(e).closest('.control-group').removeClass('info').addClass('error');
		},
		success: function (e) {
			$(e).closest('.control-group').removeClass('error').addClass('info');
			$(e).remove();
		},
		errorPlacement: function (error, element) {
			if(element.is(':checkbox') || element.is(':radio')) {
				var controls = element.closest('.controls');
				if(controls.find(':checkbox,:radio').length > 1) controls.append(error);
				else error.insertAfter(element.nextAll('.lbl:eq(0)').eq(0));
			}
			else if(element.is('.select2')) {
				error.insertAfter(element.siblings('[class*="select2-container"]:eq(0)'));
			}
			else if(element.is('.chzn-select')) {
				error.insertAfter(element.siblings('[class*="chzn-container"]:eq(0)'));
			}
			else error.insertAfter(element);
		},

		submitHandler: function (form) {
		},
		invalidHandler: function (form) {
		}
	};

	rulesSave= {
        'configuraciones[0][valor]':{
            required: true
        },
        'configuraciones[1][valor]':{
            required: true
        },
        'configuraciones[2][valor]':{
            required: true
        },
        'configuraciones[3][valor]':{
            required: true
        }
	};

	messagesSave = {
        'configuraciones[0][valor]':{
            required: 'Debe seleccionar una zona'
        },
        'configuraciones[1][valor]':{
            required: 'Debe seleccionar un rango etario'
        },
        'configuraciones[2][valor]':{
            required: 'Debe seleccionar un plan'
        },
        'configuraciones[3][valor]':{
            required: 'Debe seleccionar una condici&oacute;n'
        }
	};


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

        buildObject: function (form) {
            var configPmpmForecastPyme = ObjectSerializer.serializeObject(form);
            for(var i=0; i < configPmpmForecastPyme.configuraciones.length; i++ ){
                configPmpmForecastPyme.configuraciones[i].modifUsuario = Session.getLocal('userName');
            }
            return configPmpmForecastPyme;
        },

        obtenerUrlDatosFunnel: function(){
        	//no existe este service en form-smg-commos
        	var url = SettingsModel.get("tablero_forecast_rest_api_url") + "funnelVentaSaludInd/";
        	
        	if( Util.hasRole("SGI_ASESOR_FFVV") ) {
                var codigoAsesor =  Session.getLocal('userName');
                url += "?codigoAsesor=" + codigoAsesor;
            } else {
                if( Util.hasRole("SGI_SUPERVISOR_FFVV") ) {
	                var userName = Session.getLocal('userName');
	                url += "?codigoSupervisor=";
	                url += userName;
                }
            }
            ;
            return url;
        },
        
		list: function () {
                self = this;
                var urlPeticion = null;
                $("#content1").empty();
                urlPeticion = self.obtenerUrlDatosFunnel();
                $.ajax({
                    url: urlPeticion,
                    type: 'GET',
                    contentType: "application/json; charset=UTF-8",
                    accept: "application/json; charset=UTF-8",
                    encoding: "UTF-8",
                    async: true,
                    cache: false,
                    success: function (datosFunnelVentaPyme) {  
                        $("#content1").append(self.render(datosFunnelVentaPyme).el);
                    }
                });
        },

            /*
            var self = this;
            var onSuccess = function (data) {
                self.lastConfigForecastPyme = data;
            };
            var onError = function (xhr, err) {
                Util.error('Sample of error data:', err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                
                Util.unBlockBody();
                
                $.gritter.add({
                    title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
                    text: 'No hay configuraciones Guardadas',
                    class_name: 'gritter-warning'
                });
            };
            
            var onComplete = function () {
                successFunction();
            };
            ConfigForecastPymeService.getLastConfigPmpmForecast(onSuccess, onError, onComplete,true);*/


        render: function (datosFunnelVentaPyme) {
            var self = this;
            var compiledTemplate = Handlebars.compile(formTemplate);
            this.$el.html (compiledTemplate({datosFunnelVentaPyme : datosFunnelVentaPyme}));
			return this;
        }
        
	});

    return newView;
});