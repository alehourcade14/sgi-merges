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
	'text!libs/framework/templates/app/ventaRetail/paneles/completarProspecto.html',
	'text!libs/framework/templates/app/ventaRetail/paneles/panelAccionesWizard.html',
	'text!libs/framework/templates/app/taskDetailTemplate.html',
	'libs/framework/views/util/viewConfiguration',
	'/form-smg-commons/js/libs/asyncProcessor.js',
	'/form-smg-commons/js/libs/objectSerializer.js',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
	'/form-smg-commons/js/libs/services/gisService.js',
	'session',
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util,
			 completarProspectoForm, accionesWizard, taskDetailTemplate, ViewConfiguration,
			 AsyncProcessor, ObjectSerializer, AjaxScreenLockUtil, GisService, Session){

	var panelCompletarProspecto = Backbone.View.extend ({
		
		actionStepUnoContactar: [ { "id": 5, "action": "aCerradoSinVenta", "rolesToHide": [], "description": "Finalizado sin Venta", "status" : { "id": 5, "description": "Cerrado sin Venta"} }, { "id": 2, "action": "aEntrevistar", "rolesToHide": [], "description": "Entrevistar", "cargaObservacion": true, "status" : { "id": 2, "description": "Contactado" } } ],
		
		events: {
			'click 			#btnSaveTask'					: 'saveTask',
			'change			#prov'							: 'cargaPartPorProv',
			'change			#partido'						: 'cargarLocPorPart',
			'click			#cerrado-s-venta'				: 'verificarCheckVenta',
			'change			#cerrado-s-venta'				: 'verificarCheckVenta',
			'change			#loc'							: 'unValidateAddress',
			'change			#street'						: 'unValidateAddress',
			'change			#number'						: 'unValidateAddress',
			'change			#cp'							: 'unValidateAddress',
			'change			#cpa'							: 'unValidateAddress',
			'keypress		#txtApellido'					: 'verificarNombreApellido',
			'keypress		#txtNombre'						: 'verificarNombreApellido',
			'paste			#txtApellido'					: 'verificarPreventPaste',
			'paste			#txtNombre'						: 'verificarPreventPaste',
		},

		//regex los inputs para no permitir caracteres especiales (solo espacios, acentos y apostrofes)
		verificarNombreApellido: function(e){
			let regex = new RegExp(/[a-zA-Z\u00C0-\u017F\s]+[']?/g);
			if(!(e.key.match(regex) || e.key.match(/[']/g) )){
				e.preventDefault();
			}
		},

		verificarPreventPaste: function(e){
				e.preventDefault();
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
					self.getPrepagaOs(successFunction);
				},
				
				function (successFunction) {
					self.getOrigenProspecto(successFunction);
				},
				
				function (successFunction) {
					self.renderTemplate(successFunction);
				},

				function (successFunction) {
					self.renderTemplateAccions(successFunction);
				},
				
				function (successFunction, context) {
					self.cargaProvincias(successFunction, context, self.cargaPartidos, self.cargaLocalidades);
				},
				
				function(successFunction, context) {
					AjaxScreenLockUtil.unlock();
					successFunction();
				}
			], self.context);
	 
		},

		renderTemplate: function (onSuccess) {
			var self = this;
			var _prospecto = {};
			var isCreate = false;
			var compiledTemplate = Handlebars.compile(completarProspectoForm);
			self.validarRol();
			self.$el.html(compiledTemplate({ context: self.context,isCreate: isCreate,userId: self.context.userId, data: self.context.prospecto}));
			$("#completarProspectoStep").html(self.el);
			onSuccess();	
		},

		validarRol: function (){
			var self = this.context;
			//El domicilio no debe ser obligatorio si posee el rol 
			if(!Util.hasRole('CRM_ATENCION_SUCURSAL')) {
				self.domicilioObligatorio = true;
			}else{
				self.domicilioObligatorio = false;
			}
		},

		renderTemplateAccions: function (onSuccess) {
			var self = this;
			
			var compiledTemplate = Handlebars.compile(accionesWizard);
			var acciones = {};
			
			acciones.mostrarActionStepUnoContactar = true;
			
			var panelActivo = $('.ace-wizard').find('li.active').attr('data-target');
			
			if( panelActivo == '#step1-contactar' ) {
				
				self.actionStepUnoContactarList = self.actionStepUnoContactar;
				
				acciones.mostrarVolver=false;
				acciones.mostrarActionStepUnoContactar = true;
			} else {
				acciones.mostrarVolver=true;
			}
			
			acciones.mostrarCheckCerrado = true;
			acciones.mostrarFinalizarHide=true;
			acciones.mostrarSiguiente=true;
			$("#wizard-acciones").html(compiledTemplate({ acciones: acciones, context: self }));
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
		
		cargaProvincias: function (onSuccess, context, cargaPartidos, cargaLocalidades) {
			var self = this;
			GisService.getProvincias('01',
				function(data) {
					self = data;	
					$("#prov").empty();
					$("#prov").append("<option disabled selected value> Provincia... </option>");

					var domiProspecto;
					
					if( context && context.prospecto && context.prospecto.domicilio ) {
						domiProspecto = context.prospecto.domicilio;
					}
					
					for(var i=0; i < self.provincias.length; i++) {
						
						if( domiProspecto && domiProspecto.provincia == self.provincias[i].descripcion ) {
							$("#prov").append("<option selected value='"+self.provincias[i].pk.id+"'> "+self.provincias[i].descripcion + "</option>");	
							
							$("#provDescCompletarProsp").val(self.provincias[i].descripcion);
							
							cargaPartidos(self.provincias[i].pk.id, context, cargaLocalidades);
							
						} else {
							$("#prov").append("<option value='"+self.provincias[i].pk.id+"'> "+self.provincias[i].descripcion + "</option>");
						}
						
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
			
			if( !Util.isEmpty( $("#prov option:selected").val() ) ) {
				$("#provDescCompletarProsp").val($("#prov option:selected").text());
			}
		},

		cargarLocPorPart: function(){
			this.cargaLocalidades();
			
			if( !Util.isEmpty( $("#partido option:selected").val() ) ) {
				$("#partidoDescCompletarProsp").val($("#partido option:selected").text());
			}
		},
		
		cargaPartidos: function(provIdParam, context, cargaLocalidades){
			
			Util.debug("cargaPartidos");
			Util.debug( "provIdParam", provIdParam);
			Util.debug( '$("#prov").val()', $("#prov").val());
			Util.debug( "provId", self.provId);
			
			if(this.unValidateAddress) {
				this.unValidateAddress();
			}
			
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
					$("#partido").append("<option selected value> Partido... </option>");

					var domiProspecto;
					
					if( context && context.prospecto && context.prospecto.domicilio ) {
						domiProspecto = context.prospecto.domicilio;
					}
					
					for(var i=0; i < self.partidos.length; i++) {
						
						if( domiProspecto && domiProspecto.partido == self.partidos[i].descripcion ) {
							$("#partido").append("<option selected value='"+self.partidos[i].pk.id+"'> "+self.partidos[i].descripcion + "</option>");
							$("#partidoDescCompletarProsp").val(self.partidos[i].descripcion);
							
							cargaLocalidades(self.partidos[i].pk.id, context, provIdParam);
						} else {
							$("#partido").append("<option value='"+self.partidos[i].pk.id+"'> "+self.partidos[i].descripcion + "</option>");
						}
						
					}
				}, function (xhr, err) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}, function () {
					
				}
			);

		},

		cargaLocalidades: function(partIdParam, context, provIdParam){
			self.partId;
			Util.debug("cargaLocalidades");
			Util.debug( "partIdParam", partIdParam);
			Util.debug( '$("#partido").val()', $("#partido").val());
			Util.debug( "partId", self.partId);
			
			if(this.unValidateAddress) {
				this.unValidateAddress();				
			}
			
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
					$('#loc').append("<option selected value> Localidad.. </option>");

					var domiProspecto;
					
					if( context && context.prospecto && context.prospecto.domicilio ) {
						domiProspecto = context.prospecto.domicilio;
					}
					
					for(var i=0; i < self.localidades.length; i++) {
						
						if( domiProspecto && domiProspecto.localidad == self.localidades[i].descripcion ) {
							$('#loc').append("<option value='"+self.localidades[i].pk.id+"'> "+self.localidades[i].descripcion + "</option>");	
							$("#localidadDescCompletarProsp").val(self.localidades[i].descripcion);
							
						} else {
							$('#loc').append("<option value='"+self.localidades[i].pk.id+"'> "+self.localidades[i].descripcion + "</option>");
						}
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
					
					var domiProspecto;
					
					if( context && context.prospecto && context.prospecto.domicilio ) {
						domiProspecto = context.prospecto.domicilio;
					}
					
					for(var i=0; i < self.localidades.length; i++) {
						
						if( domiProspecto && domiProspecto.localidad == self.localidades[i].descripcion ) {
							$('#loc').append("<option selected value='"+self.localidades[i].pk.id+"'> "+self.localidades[i].descripcion + "</option>");							
						} else {
							$('#loc').append("<option value='"+self.localidades[i].pk.id+"'> "+self.localidades[i].descripcion + "</option>");
						}
						
					}
				}, function (xhr, err) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}, function () {
					
				}
			);

			}
			
		},
		
		unValidateAddress: function(e){
			
			if( !Util.isEmpty( $("#loc option:selected").val() ) ) {
				$("#localidadDescCompletarProsp").val($("#loc option:selected").text());				
			}
			
			if( !Util.isEmpty( $("#partido option:selected").val() ) ) {
				$("#partidoDescCompletarProsp").val($("#partido option:selected").text());
			}
			
			if( !Util.isEmpty( $("#prov option:selected").val() ) ) {
				$("#provDescCompletarProsp").val($("#prov option:selected").text());
			}
			
			$("#valid-address").prop('checked', false);
		},

		validateAddress: function(e){
			var self = this;
			GisService.validAddress(provincia, partido, localidad, calle, altura,
				function(data) {
				
				}, function (xhr, err) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}, function () {
					
				}
			);

		},

	});

	return panelCompletarProspecto;
});