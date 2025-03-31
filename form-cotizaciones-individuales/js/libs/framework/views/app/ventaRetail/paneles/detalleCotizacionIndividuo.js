define ([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	'bootstrap',
	'ace',
	'encoding',
	'libs/settings',
	'util',
	'text!libs/framework/templates/app/ventaRetail/paneles/panelAccionesWizard.html',
	'text!libs/framework/templates/app/taskDetailTemplate.html',
	'libs/framework/views/util/viewConfiguration',
	'/form-smg-commons/js/libs/asyncProcessor.js',
	'/form-smg-commons/js/libs/objectSerializer.js',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
	'/form-smg-commons/js/libs/services/gisService.js',
	'/form-smg-commons/js/libs/services/configProbabilidadService.js',
	'/form-smg-commons/js/libs/services/configForecastIndividuoService.js',
	'session',
	'/static/js/libs/thirds/jquery/moment-with-locales.js',
	'text!libs/framework/templates/app/ventaRetail/paneles/listPlanesCotizados.html',
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util,
			 accionesWizard, taskDetailTemplate, ViewConfiguration, AsyncProcessor, 
			 ObjectSerializer, AjaxScreenLockUtil, GisService, configProbabilidadService,
			 configForecastIndividuoService, Session, Moment, ListPlanesTemplate){

	var panelDetalleCotizacion = Backbone.View.extend ({
		
		events: {
			'click 			#btnSaveTask'					: 'saveTask',
			'change			#prov'							: 'cargaPartPorProv',
			'change			#partido'						: 'cargarLocPorPart',
			'click			#cerrado-s-venta'				: 'verificarCheckVenta',
			'change			#cerrado-s-venta'				: 'verificarCheckVenta',
			'change			#probExitoVenta'				: 'actualizarForecast',
		},

		alertMessage: function(message, severity, icon, title) {
            $.gritter.add({
                title: "<i class=\"icon-" + icon + "bigger-120\"></i>&nbsp;" + title,
                text: message,
                class_name: "gritter-" + severity
            });
        },

		verificarCheckVenta: function(){
			var venta = $('.cerrado-s-venta').is(':checked');
			if(venta == true){
				row.find('.excepSubs').css('display', '');
			}else{
				row.find('.excepSubs').css('display', 'none');
			}
		},

		closeTask: function () {
			window.top.location.href= SettingsModel.get("open_task");
		},

		backboneHistoryNavegate: function (template) {
			Backbone.history.navigate('error', { trigger: true });
			$("#content1").empty();
			var compiledTemplate = Handlebars.compile(template);
			$("#content1").html(compiledTemplate());
		},
		
		getViewConfiguration: function (onSuccess) {
			var self = this;
			self.viewsConfig = ViewConfiguration.viewsConfiguration;
			$.each(self.viewsConfig, function(index, config) {
				if ( config.taskName === self.task.config.taskName ) {
					self.viewConfig = config;
				}
			});
			onSuccess();
		},

		renderAsyncElements: function () {
			var self = this;
			AsyncProcessor.process([
				function(successFunction, context) {
					AjaxScreenLockUtil.lock();
					successFunction();
				},
				function (successFunction) {
					self.getProbabilidadExito(successFunction);
				},

				function (successFunction) {
					self.getPmpm(successFunction);
				},

				function (successFunction) {
					self.calcularForecast(successFunction);
				},
				
				function (successFunction) {
					self.renderTemplate(successFunction);
				},

				function (successFunction) {
					self.renderTemplateAccions(successFunction);
				},

				function(successFunction, context) {
					AjaxScreenLockUtil.unlock();
					successFunction();
				}
			], self.context);

		},

		renderTemplate: function (onSuccess) {

			var self = this;
			
			var fecha = Moment().format("YYYY/MM/DD");
			var error;
			var compiledTemplate = Handlebars.compile(ListPlanesTemplate);

			if(self.context.cotizacion){
				//Cambio wizard
				$('.ace-wizard').ace_wizard();
				$('.ace-wizard').wizard('next');
				ocultarDescuento = false;
				if(!self.aplicarDescuento()){
					ocultarDescuento = true;
				}
			}

			self.$el.html(compiledTemplate({ 
				cotizacion : self.context.cotizacion,
				fecha : fecha,
				error : error,
				processDetail: self.context.processDetail,
				proceso : self.context.task.processId,
				forecast : self.context.forecast
			}));

			$("#detalleStep").html(
				self.el,
			);

			onSuccess();	
		},

		renderTemplateAccions: function (onSuccess) {
			var self = this;
			if(self.context.integrantes){
				var compiledTemplate = Handlebars.compile(accionesWizard);
				var acciones = {};
				acciones.mostrarTransicionarStepTres = true;
				if(self.context.viewConfig.taskName === "Cerrar Venta"){
					acciones.mostrarDocumentacionFaltante=true;
					acciones.enviarLink=true;
				}

				if( self.context.viewConfig.taskName === 'Contactar' ) {
					acciones.enviarLink=false;
				} else {
					acciones.enviarLink=true;
				}

				$("#wizard-acciones").html(compiledTemplate({ acciones: acciones , context: self.context}));
			}
			onSuccess();	
		},

		
		reRenderDetail: function (self, successFunction) {
			var compiledTemplate = Handlebars.compile(taskDetailTemplate);
			$("#processDetail").empty ();
			$("#processDetail").css("background", "");
            $("#processDetail").append (compiledTemplate({context: self}));
            $("#observacion").val("");
            self.initAttachmentControllerDetail(self);
            if ( successFunction ) {
            	successFunction();
            }
		},

		// Render method.
		render: function (context) {
			var self = this;
			self.context = context;
			self.renderAsyncElements();
	  		self.delegateEvents();
		},
		
		getForm: function () {
			var self = this;
			var form =  $("#validation-form");
			self.validate.rules = self.viewConfig.rules;
            self.validate.messages = self.viewConfig.messages;
			form.validate(self.validate);

			return form;
		},

		serializeObject: function () {
			var self = this;

			return ObjectSerializer.serializeObject(self.getForm());
		},

		validateForm: function (serializedObject, validate, onSuccess) {
			var self = this;
			
			if ( validate ) {
				var form = self.getForm();
				if( !form.valid() ){
	        		self.onValidationFailure();
	        		return false;
	            }
			}
			onSuccess(serializedObject);
			
		},

		getPrepagaOs: function (onSuccess){
			self.prepagasOs = new Array();

			$.ajax({
				type: "GET" ,
				url: "prepaga-obrasocial.json?date="+new Date().getTime(),
				async: false,
				success : function(data) {
					self.prepagasOs = data;
				},
				error : function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				complete: function () {
					onSuccess();
				}
			});

		},

		getOrigenProspecto: function (onSuccess){
			self.prepagasOs = new Array();

			$.ajax({
				type: "GET" ,
				url: "origenProspecto.json?date="+new Date().getTime(),
				async: false,
				success : function(data) {
					origen = data;
				},
				error : function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				complete: function () {
					onSuccess();
				}
			});

		},

		cargaProvincias: function (onSuccess) {
			var self = this;
			GisService.getProvincias('01',
				function(data) {
					self = data;	
					$("#prov").empty();
					$("#prov").append("<option disabled selected value> Provincia.. </option>");
					for(var i=0; i < self.provincias.length; i++) {
						$("#prov").append("<option value='"+self.provincias[i].pk.id+"'> "+self.provincias[i].descripcion + "</option>");
					}
				}, function (xhr, err) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}, function () {
					onSuccess();
				}
			);
			
		},

		cargaPartPorProv: function(){
			this.cargaPartidos();
			this.cargaLocalidades();
		},

		cargarLocPorPart: function(){
			this.cargaLocalidades();
		},

		cargaPartidos: function(provIdParam){
			self.provId;
			Util.debug("cargaPartidos");
			Util.debug( "provIdParam", provIdParam);
			Util.debug( '$("#prov").val()', $("#prov").val());
			Util.debug( "provId", self.provId);
			this.unValidateAddress();
			self.provId = null;
			if(Util.isEmpty(provIdParam)){
				self.provId = $("#prov").val();
			}else{
				self.provId = provIdParam;
			}
			GisService.getPartidos('01', self.provId,
				function(data) {
					self = data;	
					$("#partido").empty();
					$("#partido").append("<option disabled selected value> Partido.. </option>");
					for(var i=0; i < self.partidos.length; i++) {
						$("#partido").append("<option value='"+self.partidos[i].pk.id+"'> "+self.partidos[i].descripcion + "</option>");
					}
				}, function (xhr, err) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}, function () {
					
				}
			);

		},

		cargaLocalidades: function(partIdParam){
			self.partId;
			Util.debug("cargaLocalidades");
			Util.debug( "partIdParam", partIdParam);
			Util.debug( '$("#partido").val()', $("#partido").val());
			Util.debug( "partId", self.partId);
			this.unValidateAddress();
			self.partId = null;
			var partido = false;
			if(Util.isEmpty(partIdParam)){
				self.partId = $("#partido").val();
				self.provId = $("#prov").val();
				if(self.partId != ""){partido = true;}
				
			}else{
				self.partId = partIdParam;
				self.provId = provIdParam;
			}
			if(partido == true){
				GisService.getLocalidadesPartidos('01', self.provId , self.partId,
				function(data) {
					self = data;	
					$('#loc').empty();
					$('#loc').append("<option disabled selected value> Localidad.. </option>");
					for(var i=0; i < self.localidades.length; i++) {
						$('#loc').append("<option value='"+self.localidades[i].pk.id+"'> "+self.localidades[i].descripcion + "</option>");
					}
				}, function (xhr, err) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}, function () {
					
				}
			);

			}else{
				GisService.getLocalidadesProvincias('01', self.provId,
				function(data) {
					self = data;	
					$('#loc').empty();
					$('#loc').append("<option disabled selected value> Localidad.. </option>");
					for(var i=0; i < self.localidades.length; i++) {
						$('#loc').append("<option value='"+self.localidades[i].pk.id+"'> "+self.localidades[i].descripcion + "</option>");
					}
				}, function (xhr, err) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}, function () {
					
				}
			);

			}
			
		},

		unValidateAddress: function(e){
			$("#valid-address").prop('checked', false);
		},

		getProbabilidadExito: function (successFunction) {
			var self = this;
			var filtro = new Object();
			self.context.forecast = new Object();
			filtro.idMedio = self.context.processDetail.medio.id
			filtro.idCanal = self.context.processDetail.canal.id
			filtro.idTarea = self.obtenerIdTarea(self.context.viewConfig.taskName);

			onSuccess = function (data) {
                if(data.length >0){
					self.context.forecast.confProbabilidad = data[0];
					if(self.context.viewConfig.taskName != "Entrevistar"){
						self.context.forecast.confProbabilidad.readOnly = true;
					}
				}
            };

            onError = function (xhr, err) {
                Util.error("Sample of error data:", err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                self.alertMessage("No se pudo recuperar la probabilidad de éxito", "warning", "exclamation-sign", "Atenci\u00F3n");
            };

            onComplete = function () {
				successFunction();
            };

			configProbabilidadService.getListConfProbabilidad(filtro, true, onSuccess,onError,onComplete);
		},

		obtenerIdTarea: function (tareaDescripcion) {
			var self = this;
			var idTarea = null;
			$.each(self.context.tareas, function (index, tarea) {
				if (tarea.descripcion === tareaDescripcion) {
					idTarea = tarea.id
					return false;
				}
			});
			return idTarea;
		},

		getPmpm: function (successFunction) {
			var self = this;

			onSuccess = function (data) {
				self.context.forecast.pmpm = eval(data.pmpm);
				self.context.forecast.codigoPlan = data.codigoPlan; 
				
				if(self.context.cotizacion){
					$.each(self.context.cotizacion.planes, function(index, cotizacion) {
						if ( cotizacion.codigo === data.codigoPlan) {
							self.context.forecast.pmpm = cotizacion.valorTotal
						}
					});
				}
            };

            onError = function (xhr, err) {
                Util.error("Sample of error data:", err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                self.alertMessage("No se pudo recuperar la última configuracion de forecast guardada", "warning", "exclamation-sign", "Atenci\u00F3n");
            };

            onComplete = function () {
				successFunction();
            };

			configForecastIndividuoService.getLastConfigPmpmForecastIndividuo(true, onSuccess,onError,onComplete);
		},

		calcularForecast: function(successFunction){
			var self = this;
			self.context.forecast.capitas = self.context.integrantes ? self.context.integrantes.length : null;
			//Si existe, ya viene calculado, y sino se n 2 cápitas como referencia
			var capitas	= self.context.forecast.capitas ? 1 : 2;
			self.context.forecast.probExitoVenta	= self.context.forecast.confProbabilidad ? self.context.forecast.confProbabilidad.probabilidad : 0;
			var ponderado = ((capitas * self.context.forecast.probExitoVenta * self.context.forecast.pmpm)/100).toFixed(2);
			var sinPonderar = (capitas * self.context.forecast.pmpm).toFixed(2);
			self.context.forecast.ponderado = self.changeDecimalSeparator(ponderado);
			self.context.forecast.sinPonderar = self.changeDecimalSeparator(sinPonderar);
			self.context.forecast.capitas = capitas;
			successFunction();
		},

		actualizarForecast: function(){
			var self = this;
			self.context.forecast.probExitoVenta = $("#probExitoVenta").val();
			var ponderado = ((self.context.forecast.capitas * self.context.forecast.probExitoVenta * self.context.forecast.pmpm)/100).toFixed(2);
			var sinPonderar = (self.context.forecast.capitas * self.context.forecast.pmpm).toFixed(2);
			self.context.forecast.ponderado = self.changeDecimalSeparator(ponderado);
			self.context.forecast.sinPonderar = self.changeDecimalSeparator(sinPonderar);
			$("#ponderado").val(self.context.forecast.ponderado);
		},

		changeDecimalSeparator: function(number){
			var x = number.split('.');
			return x[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ',' + x[1]
		},

		aplicarDescuento: function(){

			var self = this.context;
			var primerProceso;
			var aplicarDescuento = false;

			for(var i=0;i<self.processesDetail.length;i++){
				if(self.processesDetail[i].idEtapa===1){
					primerProceso=self.processesDetail[i];
					break;
				}
			}

			if((primerProceso.datosVenta['seguros'] != null && primerProceso.datosVenta['seguros'].producto == "Otros") || primerProceso.datosVenta['life'] != null){
				aplicarDescuento = true;
			}
			return aplicarDescuento;
		},


	});

	return panelDetalleCotizacion;
});