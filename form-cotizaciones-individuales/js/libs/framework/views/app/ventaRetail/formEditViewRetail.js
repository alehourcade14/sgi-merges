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
	'inboxService',
	'/form-smg-commons/js/libs/services/fuseService.js',
    'text!libs/framework/templates/app/ventaRetail/formEditRetailTemplate.html',
	'text!libs/framework/templates/app/ventaRetail/paneles/panelAccionesWizard.html',
	'text!libs/framework/templates/app/ventaRetail/taskDetailRetailTemplate.html',
	'text!libs/framework/templates/app/taskDetailIntegrantesTemplate.html',
	'text!libs/framework/templates/app/ventaRetail/taskDetailRetailPlanesTemplate.html',
	'text!libs/framework/templates/app/taskNotFoundTemplate.html',
	'text!libs/framework/templates/app/ventaRetail/paneles/panelMotivosRechazo.html',
	'text!libs/framework/templates/app/ventaRetail/paneles/panelMotivosNoVenta.html',
    'text!libs/framework/templates/app/ventaRetail/paneles/listPlanesCotizados.html',
    'libs/framework/views/util/ventaUtil',
	'libs/framework/views/util/viewConfiguration',
	'/form-smg-commons/js/libs/asyncProcessor.js',
	'/form-smg-commons/js/libs/objectSerializer.js',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
	'/form-smg-commons/js/libs/services/loginService.js',
	'/form-smg-commons/js/libs/services/promotorService.js',
	'/form-smg-commons/js/libs/services/cotizacionesService.js',
	'session',
	'/static/js/libs/thirds/jquery/moment-with-locales.js', 
	'/form-cotizaciones-individuales/js/libs/framework/views/helpers/ovUtil.js',
	'/form-smg-commons/js/libs/prospectoUtil.js',
	'libs/framework/views/commons/alertMessageView',
	'/form-smg-commons/js/libs/services/gisService.js',
	'text!libs/framework/templates/app/ventaRetail/paneles/addressTemplate.html',
	'libs/framework/views/app/ventaRetail/paneles/completarProspecto',
	'libs/framework/views/app/ventaRetail/paneles/completarGrupoFamiliarView',
	'/form-smg-commons/js/libs/services/prospectoService.js',
	'/form-smg-commons/js/libs/services/empresasService.js',
	'libs/framework/views/app/ventaRetail/util/cotizadorUtil',
	'/form-smg-commons/js/libs/services/terinService.js',
	'text!libs/framework/templates/app/ventaRetail/paneles/listExAfiliadosTable.html',
	'text!libs/framework/templates/app/ventaRetail/paneles/listExAfiliadosTableFormulario.html',
    '/form-smg-commons/js/libs/services/obraSocialService.js',
    'text!libs/framework/templates/app/ventaRetail/paneles/modalLinkToolTemplate.html',
	'/form-smg-commons/js/libs/services/propertiesService.js',
	'/form-cotizaciones-individuales/js/libs/framework/views/commons/servicios.js'
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, InboxService,
			 FuseService, formEditTemplate, accionesWizard, taskDetailTemplate, taskDetailIntegrantesTemplate, taskDetailPlanesTemplate, taskNotFoundTemplate, 
			 panelMotivosRechazo, panelMotivosNoVenta, ListPlanesTemplate, VentarRetailUtil, ViewConfiguration, AsyncProcessor, ObjectSerializer, AjaxScreenLockUtil,
			 LoginService, PromotorService, CotizacionesService, Session, Moment, OvUtil, ProspectoUtil, AlertMessageView, GisService, addressTemplate,
			  completarProspectoView, completarGrupoFamiliarView, ProspectoService, EmpresasService, CotizadorUtil, TerinService, ListaControlExAfiliados,
			  ListExAfiliadosTableFormulario, ObraSocialService, ModalLinkToolTemplate, PropertiesService, Servicios){
	
	var newView = Backbone.View.extend ({

		task: {
			processName: "Venta Salud Individuos",
			name: "Contactar"
		},
		
		actionStepUnoContactar: [ { "id": 5, "action": "aCerradoSinVenta", "rolesToHide": [], "description": "Finalizado sin Venta", "status" : { "id": 5, "description": "Cerrado sin Venta"} }],
		actionStepDosContactar: [ { "id": 5, "action": "aCerradoSinVenta", "rolesToHide": [], "description": "Finalizado sin Venta", "status" : { "id": 5, "description": "Cerrado sin Venta"} }, { "id": 2, "action": "aEntrevistar", "rolesToHide": [], "description": "Entrevistar", "cargaObservacion": true, "status" : { "id": 2, "description": "Contactado" } } ],
		motivosRechazo: [{"id": 1, "descripcion": "Sin cobertura en la zona"}, {"id": 2, "descripcion": "Zona peligrosa"}, {"id": 3, "descripcion": "Otros"}],
		motivosNoVenta: [{"id": 1, "descripcion": "Sin venta por precio"}, {"id": 2, "descripcion": "Sin venta por producto"}, {"id": 3, "descripcion": "Sin venta imposible contactar"}, {"id": 4, "descripcion": "Sin venta por Preexistencia"}, {"id": 5, "descripcion": "Sin venta por servicio"}, {"id": 23, "descripcion": "Sin venta por falta de prestadores"}, {"id": 17, "descripcion": "Sin venta por retención de clientes / cambio de Plan / socio Activo"}, {"id": 18, "descripcion": "Sin venta por CorRe / Corporativo / Pyme"}, {"id": 19, "descripcion": "Sin venta por no desregula – Decreto 2021/438"}, {"id": 20, "descripcion": "Sin venta por reasignación a otro asesor"}, {"id": 21, "descripcion": "Sin venta por dato con errores / dato incompleto"}, {"id": 22, "descripcion": "Sin venta por rango de edad incorrecto"}],
		tiposCotizacion: [{"id": 1, "descripcion": "Nueva AP"}, {"id": 2, "descripcion": "Apertura Sucursal"}, {"id": 3, "descripcion": "Licitacion AP"}],
		switchOptions: [{id: 0, value: "NO"}, {id: 1, value: "SI"}],
		idDeCotizacion : 0,
		planesSeleccionados: "",
		 
		
		validate: {
			ignore:":hidden:not(.validable), .notValidable, :disabled",
			errorElement: 'span',
			errorClass: 'help-inline',
			focusInvalid: false,
			invalidHandler: function (event, validator) {},
			highlight: function (e) {
				$(e).closest('.control-group').removeClass('info').addClass('error');
			},
			success: function (e) {
				$(e).closest('.control-group').removeClass('error').addClass('info');
				$(e).remove();
			},
			errorPlacement: function (error, element) {
				if(element.is('.period-date-picker')) {
					error.insertAfter(element.next());
				} else {
					error.insertAfter(element);
				}
			},
			submitHandler: function (form) {},
			invalidHandler: function (form) {}
		},
		
		events: {
			'click 		#btnSaveAndEndTask' 			: 'saveAndEndTask',
			'click 		#btnSaveTask'					: 'saveTask',
			'click 		#btnCloseTask'					: 'closeTask',
			'click 		#processTabDetail'				: 'showProcessTabDetail',
			'click 		#formTabDetail'					: 'showFormTabDetail',
			'click 		#entityTabDetail'				: 'showEntityTabDetail',
			'click 		#btnPrintTask'					: 'onClickBtnPrintTask',
			'click 		#btnExportPDF'					: 'onClickBtnPrintTask',
			'change		#actions'						: 'onChangeActions',
			'click		.ace-wizard-btn-next'			: 'next',
			'click		.ace-wizard-btn-prev'			: 'prev',
			'click 		.selectAddress'					: 'selectAddress',
			'change		.selectZona'					: 'cambiarAccionesWizard',
			'change		.selectParentesco'				: 'cambiarAccionesWizard',
			'change		.selectSexo'					: 'cambiarAccionesWizard',
			'change		.inputEdad'						: 'cambiarAccionesWizard',
			'change		.selectCondicion'				: 'cambiarAccionesWizard',
			'change		.inputRemuneracion'				: 'cambiarAccionesWizard',
			'change 	.txtNroDocumento' 				: 'cambiarAccionesWizard',
            'change     .tipoDoc'                       : 'cambiarAccionesWizard',
			'change 	.txtNombre' 					: 'cambiarAccionesWizard',
            'change     .txtApellido'                   : 'cambiarAccionesWizard',
			'click		.btnAddIntegrante'				: 'cambiarAccionesWizard',
			'blur		.inputNacimiento'				: 'cambiarAccionesWizard',
			'change		#probExitoVenta'				: 'actualizarForecast',
			'click 	 	#btnEnviarLink' 				: 'showModalEnviarLink',
			'click 	 	.closeModalLinkTool' 			: 'closeModalLinkTool',
			'click 	 	#copiarLink'		 			: 'copiarLinkTool',
			'click 	 	#btnEnviarWhatsapp'		 		: 'enviarToolPorWhatsapp',
			'click 	 	#btnEnviarMailTool'		 		: 'enviarToolPorMail',
			'click		.inputNacimiento'				: 'verificarValidacion',

		},

		cambiarAccionesWizard: function(){
			var self = this;
			var solicitud =  this.buildObjectGFamiliar();
			var solicitudGFamiliar = JSON.stringify(solicitud.grupoFamiliar);
			var solicitudZona = solicitud.zona;
			var cotizadoGFamiliar;
			var cotizadoZona;
			if (this.cotizarForm != undefined){
				cotizadoGFamiliar =  JSON.stringify(this.cotizarForm.grupoFamiliar);
				cotizadoZona = this.cotizarForm.zona;
			}
			if (this.cotizarForm != undefined && (cotizadoGFamiliar != solicitudGFamiliar || solicitudZona != cotizadoZona) && self.task.name != 'Contactar'){
				$("#btnContinuar").hide();
				$("#btnCotizar").show();
				if(self.idDeCotizacion !=0){
					self.idDeCotizacionAnterior = self.idDeCotizacion;
					self.idDeCotizacion = 0;
				}
			}else{
				if (this.cotizarForm != undefined){
					$("#btnContinuar").show();
					$("#btnCotizar").hide();
					self.idDeCotizacion = self.idDeCotizacionAnterior;
					if(self.task.name == 'Contactar' && this.cotizacion != undefined){
						self.mostrarMensajeAdvertenciaCot();
					}
				}else{
					if(self.task.name == 'Contactar' && this.cotizacion != undefined){
						self.mostrarMensajeAdvertenciaCot();
					}
				}
			}
		},

		
		mostrarMensajeAdvertenciaCot: function(){
			var self=this;
			bootbox.dialog('Solamente será posible realizar una nueva cotización en las tareas “Entrevistar” o “Cerrar Venta”', [{
				"label": "Aceptar",
				"class": "btn-small btn-success",
				"callback": function () {
					self.reloadFamilyGroup();
				}
			}]);
		},

		reloadFamilyGroup:function(){
			var self=this;
			$.each(self.panelViews, function (index, panel) {
				if (panel instanceof completarGrupoFamiliarView) {	
					panel.initIntegrantes(null);
					$("#slZonas").val(self.cotizacion.zona.id);
				} 
			});
		},
		
		closeTask: function () {
			window.top.location.href= SettingsModel.get("open_task");
		},
		
		showEntityTabDetail: function () {
            $("#controlActions").hide();
            $("#btnSaveTask").hide();
            $("#btnPrintTask").hide();
        },
		
		showProcessTabDetail: function () {
			$("#controlActions").hide();
			$("#btnSaveTask").hide();
			$("#btnPrintTask").show();
		},

		showFormTabDetail: function () {
			$("#controlActions").show();
			$("#btnSaveTask").show();
			$("#btnPrintTask").hide();
		},
		
		backboneHistoryNavegate: function (template) {
			Backbone.history.navigate('error', { trigger: true });
			$("#content1").empty();
			var compiledTemplate = Handlebars.compile(template);
			$("#content1").html(compiledTemplate());
		},
		
		/////No se usa
		renderMotivosRechazo: function(onSuccess){
			var self = this;
			
            var compiledTemplate = Handlebars.compile(panelMotivosRechazo);
            $("#motivosRechazoContainer").html(compiledTemplate({ context: self }));
            onSuccess();
        },
        
        renderMotivosNoVenta: function(onSuccess){
			var self = this;
			
            var compiledTemplate = Handlebars.compile(panelMotivosNoVenta);
            $("#motivosRechazoContainer").html(compiledTemplate({ context: self }));
            onSuccess();
        },

		validacionYCargaDeDatosInicial: function (onSuccess) {
			var self = this;
			if (self.taskId != 0) {

				self.task = InboxService.getTaskById(self.taskId);

				if (self.task && self.task.end == null) {
					self.isTaskOwner = (self.task.actorId && self.task.actorId == self.userId);
					self.workflowId = InboxService.getBussinessKey(self.taskId);
				}
				onSuccess();
			}
		},
		
		getEjecutivo: function(onComplete) {
			var self = this;
			
			self.getUserInformation(self.processesDetail[ self.processesDetail.length -1 ].user.userName, 
				function( ejecutivo ){
                	self.ejecutivo = ejecutivo;
				}, onComplete
			);
		},
		
		getUser: function(onComplete) {
			var self = this;
			
			self.getUserInformation(Session.getLocal("userName"), 
				function( user ){
					self.userNombreApe = user.nombre + " " + user.apellido;
					console.log("Usuario que trabaja la etapa", self.userNombreApe);
				}, onComplete
			);
		},
		
		getUserInformation: function(username, onSuccess, onComplete) {
			var self = this;
			
			LoginService.userInformation(username, true, 
                function( user ){
                    onSuccess(user);
                },
                function( xhr, err ){
                    Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
                },
                function(){
                	onComplete();
                }
            );
		},
		
		getProcessDetail: function (onSuccess) {
			var self = this;

			var success = function (data) {
				Util.debug('processDetail', data);
				self.processesDetail = data;
				self.processDetail = self.processesDetail[0];
				self.ventaSmmpRetail = data[0];

				self.lookUpLastDetailByTask();
				self.lookUpTasksName();
				self.fixDomicilios();
				
				if (onSuccess) {
					onSuccess();
				}
			}
			var error = function (xhr, error) {
				Util.debug('getProcessDetail', error);
			}
			var complete = function () { }

			FuseService.getDetallePorProcessId(self.processId, true, success, error, complete)
		},

		fixDomicilios: function() {
			var self = this;

			$.each(self.processesDetail, function(index, detail) {
				if ( detail.domicilios && detail.domicilios.length > 0 ) {
					detail.domicilios = $.grep(detail.domicilios, function( domi, index ) { return !VentarRetailUtil.isNull( domi.id ) });
				}
			});
		},
		
		lookUpLastDetailByTask: function() {
			var self = this;
			
			self.detalle = self.processesDetail.find(function(detail) {
				return detail.taskAbbre == self.viewConfig.abbre;
			});
		},
		
		lookUpTasksName: function() {
			var self = this;
			
			$.each(self.processesDetail, function(index, detail) {
				$.each(self.viewsConfig, function(i, config) {
					if ( detail.taskAbbre === config.abbre ) {
						detail.taskName = config.taskName;
					}
				});
			});
		},

		getProcessConfiguration: function (onSuccess) {
			var self = this;
			$.ajax({
				url: 'processRetail.json?date=' + new Date(),
				type: 'GET',
				async: true,
				success: function (data) {
					var processTypes = eval(data);
					for (var i = 0; i < processTypes.length; i++) {
						Util.debug(processTypes[i].processNameJBPM, self.task.processName, processTypes[i].processNameJBPM === self.task.processName);
						if (processTypes[i].processNameJBPM === self.task.processName) {
							self.encontrado = true;
							self.processNameJBPM = processTypes[i].processNameJBPM;
							self.tasksConfig = processTypes[i].tasks;
							for (var x = 0; x < self.tasksConfig.length; x++) {
								if (self.tasksConfig[x].taskName === self.task.name) {
									self.task.actions = self.tasksConfig[x].actions;
									self.task.config = self.tasksConfig[x];
									self.task.tarea =self.tasksConfig[x].id;
								}
							}
							break;
						}
					}
					onSuccess();
				},
				error: function (xhr, err) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					self.backboneHistoryNavegate(taskNotFoundTemplate);
				}
			});
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
		
		getWorkContext: function () {
			
			var self = this; 
			
			self.rolesDeUsuario = Session.getLocal("roles");
			self.rolesDeUsuario = self.rolesDeUsuario.split(",");
			self.worContextUsuario = 'AMB_COMERCIAL';
			
			$.ajax({
				type: "GET" ,
				url: "workContextPorRol.json?date="+new Date().getTime(),
				async: false,
				success : function(data) {
					
					for(var i=0; i < data.length; i++ ) {
						if( self.rolesDeUsuario.includes( data[i].rol ) ) {
							self.worContextUsuario = data[i].workContext;
						}
					}
				},
				error : function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				complete: function () {
					
				}
			});

			return self.worContextUsuario;
		},
		
		crearTelefonoDeProspecto: function(codigo_pais, codigo_nacional, numero,  extension, tipo_tele) {
			
			var telefono = {};
			
			telefono.codigo_nacional = codigo_nacional; 
			telefono.codigo_pais = codigo_pais; 
			telefono.extension   = extension; 
			telefono.numero   = numero;
			telefono.tipo_tele= tipo_tele;
			
			return telefono;
		},
		
		crearEmailProspecto: function(denominacion, email_tipo) {
			
			var email = {};
			
			email.denominacion = denominacion;
            email.email_tipo   = email_tipo;
            
            return email;
		},
		
		buildObject: function (end) {
			
			var self = this;
			var user = Session.getLocal("userName");
			var userName = Util.getUserNameComplete(Session.getLocal("userId"));
			var form =  $("#validation-form-retail");
			var finalObject = ObjectSerializer.serializeObject(form);
			var accionSeleccionada =  parseInt($("#actions option:selected").data("status"),10);
			var observacion = finalObject.observacion;
			var detalle;
			var arrayEmails = null;
			var inteCotizacion = self.buildDetalleIntegrantes();
			finalObject.inteCotizacion = inteCotizacion;

			if(self.idDeCotizacion > 0 || self.ventaSmmpRetail.cotizacion) {
				finalObject.idCotizacion = self.idDeCotizacion > 0 ? self.idDeCotizacion: self.ventaSmmpRetail.cotizacion.id;				
			} else {
				finalObject.idCotizacion = null;
			}
			
			finalObject.user = {};
			finalObject.user.id = Session.getLocal("userId");
			finalObject.user.userName = self.userNombreApe;
			finalObject.user.user = user;
			finalObject.user.nombreApe = self.userNombreApe;

			finalObject.task = {};
			
			finalObject.task.id = self.task.id;
			finalObject.task.name = self.task.name;
			
			var action=$('#actions').val() != "" ?  $('#actions').val() : null;
			if(!end){
				action=null;
			}
			finalObject.process = {
				variables : {
					workContext : self.getWorkContext(),
					processInfo :{
						id : "0",
						name: self.task.processName,
						description: self.task.processName,
						credencial : self.entityPrefix + self.entityId,
						registradoUsuario : user,
						registradoNombre : finalObject.user.id,
						detalle : observacion,
					},
					finalizado: "false",
					action: action,
					processOwner: user,
					processOwner : finalObject.user.id,
					actorId : Session.getLocal('userId')
				},
				id : self.task.processId,
				processId : null,
				key : null,
				start : new Date().getTime(),
				version : "1",
				processName : self.task.processName,
				detalle : observacion,
				credencial : self.entityPrefix + self.entityId,
				action : action,
				workContext : self.getWorkContext()
			};
			// cuando se omite el completar, no encuentra el pk
			if(self.task.name == "Contactar" && !self.omitirCompletarProspecto) {
								
				// para actualizar el prospecto con lo ingresado en completarDatos
				finalObject.prospecto.pk = self.prospecto.pk;

				if( finalObject.prospecto.emails.generico ) {
					arrayEmails = new Array(); 
					arrayEmails.push(finalObject.prospecto.emails.generico);
				}

				var arrayTelefonos = null;
                
                if( finalObject.prospecto.telefonos && finalObject.prospecto.telefonos.generico ) {
					
					arrayTelefonos = new Array();
					
					var telefono = finalObject.prospecto.telefonos.generico;
					
					if( telefono.tipo_tele == "celular" ) {
						arrayTelefonos.push( self.crearTelefonoDeProspecto(telefono.codigo_pais, telefono.codigo_nacional, telefono.numero,  telefono.extension, 'C') );
					} else {
						arrayTelefonos.push( self.crearTelefonoDeProspecto(telefono.codigo_pais, telefono.codigo_nacional, telefono.numero,  telefono.extension, 'P') );
					}     
                }
				
                finalObject.prospecto.domicilio = finalObject.domicilio;
                finalObject.prospecto.domicilio.paisId = "1";
                finalObject.prospecto.domicilio.pais = "ARGENTINA";
                finalObject.prospecto.domicilio.validado = "0";
                
				finalObject.prospecto.emails    = arrayEmails; 
				finalObject.prospecto.telefonos = arrayTelefonos; 
				finalObject.prospecto.persTipo = 'F';
				
				finalObject.process.variables.crearProspecto = "false";
				finalObject.process.variables.actualizarProspecto = "true";				
			} else {
				finalObject.prospecto = {};
				finalObject.prospecto.pk = self.prospecto.pk;
			}
			
			finalObject.idVenta = self.ventaSmmpRetail.idVenta;

			//Observacion en bandeja
			detalle = this.prospecto.apellido + "," + this.prospecto.nombre + " - " + this.prospecto.docTipo + "-" + this.prospecto.docNum + "-" + this.prospecto.domicilio.provincia  + "-" + this.prospecto.domicilio.partido;
			if(observacion != undefined){
                detalle = detalle + " - " + observacion
            }
			finalObject.process.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle;
	

		
			var medio = ProspectoUtil.getMedioPorUserTipo().id == undefined ? 14 : ProspectoUtil.getMedioPorUserTipo().id
			finalObject.medio = {
				id: medio,
				numero: null
			};
			
			finalObject.canalOrigen = {};
			finalObject.canalOrigen.id = 2; //CANAL SGI
			finalObject.canalOrigen.subCanal = Session.getLocal("subsidiary");
			finalObject.vendedorAsignado = user;
			finalObject.vendedorNombre = self.userNombreApe != " " ? self.userNombreApe: userName;	
			//finalObject.pool = 0;

			finalObject.plan = planesSeleccionados;		
			finalObject.sucursal = {};
			finalObject.sucursal.id = Session.getLocal("subsidiary");

			
			//Debe ir la tarea en la que actualmente se encuentra salvo para los casos que cierra la venta
			finalObject.estado = {};
			if(isNaN(accionSeleccionada) || !end)
				finalObject.estado.id = self.task.tarea			
			else
				finalObject.estado.id = accionSeleccionada;	

			if( finalObject.estado.id == 5 ) {
				// sin venta seleccionado
				finalObject.motivo = {};
				finalObject.motivo.id = parseInt( $("#motivosCerradoSinVentaSelect option:selected").val(), 10);
			} else {
				finalObject.motivo = {};
				finalObject.motivo.id = 0;
			}
			
			if( this.cotizacionProcessId  != 0 ) {
				finalObject.process.variables.processInfo.procesoRelacionadoId = this.cotizacionProcessId ;				
			}
			
			finalObject.credencial = self.entityPrefix + self.entityId;

			
			//Reconversión a Float Forecast
			if(finalObject.forecast){
				finalObject.forecast.sinPonderar = self.convertToFloat(finalObject.forecast.sinPonderar);
				finalObject.forecast.ponderado = self.convertToFloat(finalObject.forecast.ponderado);
			}
			else {
				if( self.forecast && self.forecast.sinPonderar && self.forecast.ponderado && self.forecast.capitas ) {
					
					finalObject.forecast = {};
					finalObject.forecast.sinPonderar = self.convertToFloat(self.forecast.sinPonderar);
					finalObject.forecast.ponderado = self.convertToFloat(self.forecast.ponderado);
					finalObject.forecast.capitas = self.forecast.capitas;
				}
			}
			
			// RUDI
//			$.each(self.attachmentControllers, function(i, attachmentController) {
//				attachmentController.fillObject(finalObject);
//			});
			
/*
			$.each(self.panelViews, function(i, view) {
				view.fillObject(finalObject);
			});*/
			
			if( self.ventaSmmpRetail && self.ventaSmmpRetail.vendedorCodigo ) {
				finalObject.vendedorCodigo = self.ventaSmmpRetail.vendedorCodigo;
				
				if( self.ventaSmmpRetail && self.ventaSmmpRetail.esVentaAsistida && Util.hasRole('SGI_ASESOR_FFVV') ) {
					finalObject.vendedorCodigo = "-";
				}
				
			} else {
				if( Util.hasRole('SGI_PAS') || Util.hasRole('SGI_BROKER') || Util.hasRole('SGI_ASESOR_FFVV') ) {
					// se setea el codigo de productor o del broker o del asesor
					var vendedor = self.getDatosVendedor();
					finalObject.vendedorCodigo = vendedor.productor && vendedor.productor.codigoProductor != null && vendedor.productor.codigoProductor != "" ? $.trim(vendedor.productor.codigoProductor) : "";
				}
			}
			
			finalObject.esVentaAsistida = self.ventaSmmpRetail.esVentaAsistida;
			
			if( self.ventaSmmpRetail && self.ventaSmmpRetail.rolUserIniciaTramite ) {
				finalObject.rolUserIniciaTramite = self.ventaSmmpRetail.rolUserIniciaTramite;
			}

			//agrego datos de condExAfiliado
			if (self.hasExAfiliadosData) {
				finalObject.condExAfiliado = self.formatCondExAfi(self.processDetail.condExAfiAux);
			} else {
				finalObject.condExAfiliado = self.formatCondExAfi(self.processDetail.condExAfi);
			}
			
			self.serializedObject = finalObject;
			
			console.log(finalObject);
			
			
			
			return finalObject;
		},
		
		getDatosVendedor: function() {
	    	
	    	var userName = Session.getLocal("userName");
			
	    	var result = {}; 
	    	
	    	result.ejecutivo = {};
			result.productor= {};
			
	        EmpresasService.getProductorByUserName(userName,
	                function (productor) {
	                    Util.debug("productor", productor);
	                    result.productor = productor;
	                },
	                function (xhr,err,urlRest,typeCall) {
	                    Util.error( 'Sample of error data:', err );
	                    Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
	                },
	                function (data) {
	                }
	        );
	        
	        return result;
	    },
		
	    saveCotizar: function (serializedObject, onSuccess, validate) {

			var self = this;

			//Analizo el panel activo y la accion a realizar para ver si valido o no
			validate = self.verificoValidacion();

			VentarRetailUtil.blockScreen();

			self.validateForm(serializedObject, validate, function (serializedObject) {
				var message = JSON.stringify(serializedObject)
				FuseService.actualizarProceso(serializedObject, true, function (data) {
					onSuccess();
					VentarRetailUtil.unblockScreen();
					}, function ( xhr, err ) {
						Util.error("Sample of error data:", err);
						Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					},
					function(){
						
					},
					true,
				);
			});
		},
	    
	    saveTaskCotizar: function () {
			var self = this;
			
			planesSeleccionados= "";
			
			var countPlanes = self.checkPlanes();
			
			var serializedObject = self.buildObject( false );
			var onSuccess = function() {
				self.getProcessDetail(function() {self.reRenderDetail(self)});
			};
			
			self.saveCotizar( serializedObject, onSuccess, false );
		},
	    
		
		
		saveTask: function () {
			var self = this;

			planesSeleccionados= "";

			var countPlanes = self.checkPlanes();
			
			var serializedObject = self.buildObject( false );
			var onSuccess = function() {
				self.getProcessDetail(function() {
					self.filtrarDetExAfiliados(function() {self.reRenderDetail(self)});
					});
				VentarRetailUtil.alertMessage("Datos guardados.", "success", "ok", "Exito");
			};
			
			self.save( serializedObject, onSuccess, false );
		},
		
		saveAndEndTask: function() {
			
			var self = this;
			var panelActivo = $('.ace-wizard').find('li.active').attr('data-target');

			var countPlanes = self.checkPlanes();
			var validoContactar=true;
			if(($("#actions option:selected").val() === "aEntrevistar" || $("#actions option:selected").val() == "aCerradoSinVenta") && !self.omitirCompletarProspecto && panelActivo == "#step1-contactar"){
				validoContactar=self.checkValidacionContactar();
			}
			//Debe seleccionar al menos un plan desde el "Detalle Cotización", si selecciona "Cerrado con Venta" debe elegir un único plan
			if ($("#actions option:selected").val() == "aCerradoConVenta" && countPlanes > 1){
				VentarRetailUtil.unblockScreen();
				VentarRetailUtil.alertMessage("Por favor seleccione un \u00FAnico plan para cerrar la venta", "warning", "exclamation-sign", "Atenci\u00F3n");

			}else if($("#actions option:selected").val() == "aCerradoConVenta" && countPlanes == 0 && (panelActivo == "#step3-contactar" || panelActivo == "#step2-entrevistar" || (panelActivo == "#step2-contactar" && countPlanes.length > 0))){
				VentarRetailUtil.unblockScreen();
				VentarRetailUtil.alertMessage("Debe seleccionar un plan", "warning", "exclamation-sign", "Atenci\u00F3n");
			
			}else if($("#actions option:selected").val() != "aCerradoSinVenta" && countPlanes == 0 && (panelActivo == "#step3-contactar" || panelActivo == "#step2-entrevistar" || (panelActivo == "#step2-contactar" && countPlanes.length > 0))){
				VentarRetailUtil.unblockScreen();
				VentarRetailUtil.alertMessage("Debe seleccionar al menos un plan", "warning", "exclamation-sign", "Atenci\u00F3n");
			
			}else if (!validoContactar) {
				VentarRetailUtil.unblockScreen();
				VentarRetailUtil.alertMessage("Por favor ingrese los datos necesarios", "warning", "exclamation-sign", "Atenci\u00F3n");
				
			}else if($("#actions option:selected").val() == "") {
				VentarRetailUtil.unblockScreen();
				VentarRetailUtil.alertMessage("Por favor seleccione una acci\u00F3n", "warning", "exclamation-sign", "Atenci\u00F3n");
			}
			else{
				if(self.cotizacion){
					var fechaVencimiento = new Date(self.cotizacion.altaFecha);
					fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
					if( new Date() > fechaVencimiento){
						VentarRetailUtil.unblockScreen();
						VentarRetailUtil.alertMessage("Cotizaci\u00F3n vencida, volver a cotizar", "warning", "exclamation-sign", "Atenci\u00F3n");
						return;
					}
				}
				//validamos que al cerrar con venta, los integrantes del grupo familiar tengan el dni cargado
				if ($("#actions option:selected").val() == "aCerradoConVenta" && !self.validDniGrupoFamiliar()) {
					VentarRetailUtil.unblockScreen();
					bootbox.dialog('Debés validar el control de ex afiliados previamente para continuar', [{
						"label": "Aceptar",
						"class": "btn-small btn-success",
						"callback": function () {
							var action = $("#actions option:selected").val();
							$('#btnVolver').click();
							var form = self.getForm(action);
							if(!form.valid()){
								self.showValidatorErrors();
							}
						}
					}]);
					return;
				}
				var serializedObject = self.buildObject( true );
					
				var onSuccess = function() {
					VentarRetailUtil.unblockScreen();
					self.updateDetailVariable(serializedObject.process.detalle);
					window.top.location.href = SettingsModel.get("open_task");
				};
				
				self.save( serializedObject, onSuccess, true );
			}
		},

		save: function (serializedObject, onSuccess, validate) {

			var self = this;
			var guardado = false;

			//Analizo el panel activo y la accion a realizar para ver si valido o no
			validate = self.verificoValidacion();

			VentarRetailUtil.blockScreen();

			self.validateForm(serializedObject, validate, function (serializedObject) {
				var message = JSON.stringify(serializedObject)
				FuseService.actualizarProceso(serializedObject, true, function (data) {
					guardado = true;
					
					}, function ( xhr, err ) {
						Util.error("Sample of error data:", err);
						Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);

						VentarRetailUtil.unblockScreen();
						VentarRetailUtil.alertMessage("No se pudo grabar el llamado", "warning", "exclamation-sign", "Atenci\u00F3n");
					},
					function(){

						if(guardado == true){

							var asyncFunctions = [];

							asyncFunctions.push(function( successFunction, context) {
								$.gritter.add({	
									title : '<i class="icon-ok bigger-120"></i>&nbsp;Exito',
									text : 'Datos guardados correctamente',
									class_name : 'gritter-success'
								});
								successFunction();
							});
	
							asyncFunctions.push(function( successFunction, context) {
								self.sendEmail(serializedObject, successFunction);
							});
	
							asyncFunctions.push(function( successFunction, context) {
								onSuccess();
								VentarRetailUtil.unblockScreen();
								successFunction();
								});
						
							AsyncProcessor.process(asyncFunctions, {});
						}
						
					},
					true,
				);
			});
		},
		
		list: function (taskId,processId){

			var self = this;
			
			self.userId = Session.getLocal("userId");
			self.taskId = parseInt(taskId);
			self.processId = processId;
			self.initView();
		},
		
		initView: function() {
	
			var self = this;
			
			var asyncFunctions = [];
			
			asyncFunctions.push(function(successFunction, context) {
				AjaxScreenLockUtil.lock();
                
				VentarRetailUtil.showLoadingBubble($("#content1"));
				
				successFunction();
			});
			
			asyncFunctions.push(function(successFunction, context) {
				self.validacionYCargaDeDatosInicial(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {
				self.getMotivosRetail(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {
				self.getTareasVentaSalud(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {
				self.getProcessConfiguration(successFunction);
			});
			
			asyncFunctions.push(function(successFunction, context) {
				self.getViewConfiguration(successFunction);
			});
			
			asyncFunctions.push(function(successFunction, context) {
				self.getProcessDetail(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {
				VentarRetailUtil.getTareaPorEtapa(self.processesDetail,successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {
				self.getUser(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.getDocumentacionFaltante(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.getContacto(successFunction);
			});
			
			asyncFunctions.push(function(successFunction, context) {
				self.initEntity(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {	
				$("#content1").empty();
				$("#content1").append(self.render().el);
				successFunction()
			});
			
			
			asyncFunctions.push(function(successFunction, context) {
				self.renderEntityDetailTab(successFunction);
			});
			
			asyncFunctions.push(function (successFunction, context) {
                /*
                Si la tarea es contactar se consulta si se tiene que omitir completar
                el prospecto
                 */
				if (self.task.name === "Contactar")
					self.isOmitirCompletarProspecto(successFunction);
				else {
					self.omitirCompletarProspecto = false;
					successFunction();
				}
			});

			asyncFunctions.push(function(successFunction, context) {
				self.buildDetalleCotizacion(successFunction);
			});
			
			asyncFunctions.push(function(successFunction, context) {
				self.initPanels(successFunction);
			});

			
			/*
			asyncFunctions.push(function(successFunction, context) {
				self.initFilePanels(successFunction);
			});
			*/

			asyncFunctions.push(function(successFunction, context) {			
				self.getAseguradoras(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.convertForecastToMoney(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.getCodigoProductor(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {		
				self.filtrarDetExAfiliados(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {		
				self.loadObrasSociales(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.reRenderDetail(self, successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.controlAfiliadosCheck(successFunction);
				successFunction();
			});

			asyncFunctions.push(function(onSuccess, context) {
				AjaxScreenLockUtil.unlock();
				onSuccess();
			});
			
			AsyncProcessor.process(asyncFunctions, {});
		},
		
		// ========================== INIT'S================================== //
		
		initEntity: function(successFunction) {		
			var self = this;
			self.prospecto = self.processDetail.prospecto;
			self.entityPrefix = "PRO-";
			self.entityId = self.prospecto.pk.idProsp;
			self.entityType = "Prospecto";
			successFunction();
		},

		isOmitirCompletarProspecto: function (successFunction) {
			var self = this;
			var success = function (variable) {
                /*
                obtener el valor de la variable completaProspecto
                la niego para hacer referencia a omitir, ya que esta variable hace referencia
                a completar y no a omitir.
                 */
				self.omitirCompletarProspecto = !(variable.stringValue.toLowerCase() === 'true');
				successFunction();
			};
			var error = function (error) {
				//si falla obligo a completar el prospecto
				self.omitirCompletarProspecto = false;
				successFunction();
			};
			//servicio que obtiene las variable del proceso segun el nombre
			FuseService.getVariableByName(self.processId, "completaProspecto", false, success, error, null);
		},
		
		initPanels: function(successFunction) {
			
			var self = this;
			
			self.panelViews = [];

			self.actionStepUnoContactarList = self.actionStepUnoContactar;
			self.actionStepDosContactarList = self.actionStepDosContactar;
			
			self.omitirCompletarProspecto = self.omitirCompletarProspecto && self.task.name === "Contactar";
			
			$.each(self.viewConfig.panels, function (index, panel) {
				var panelView = new panel();
				//si la vista es instancia de completarProspectoView
				if (panelView instanceof completarProspectoView) {
					//si no hay que omitir ejecuta el metodo render, en cambio no hace nada (la omite)
					if (!self.omitirCompletarProspecto) {
						panelView.render(self);
						self.panelViews.push(panelView);
					}
				} else {
					panelView.render(self);
					self.panelViews.push(panelView);
				}
			});
			successFunction();
		},
		
		initFilePanels: function(successFunction) {
			var self = this;
			
			self.filePanelViews = [];
			self.attachmentControllers = [];
			$.each( self.viewConfig.files, function(index, fileConfig) {
				if ( VentarRetailUtil.isNull(fileConfig.types) || fileConfig.types.includes(self.ventaEccoAP.tipoCotizacion.id) ) {
					var filePanel = new archivosAdjuntosView();
					filePanel.render(fileConfig.id, fileConfig.label, self);
					self.filePanelViews.push(filePanel);
					require(["/form-venta-ecco-ap/js/libs/framework/views/app/attachments/attachmentController.js"], function (AttachmentController) {
						var attachmentController = new AttachmentController();
						attachmentController.init(".btnAdjuntos" + fileConfig.id, fileConfig.id, null, false);
						self.attachmentControllers.push(attachmentController);
					});
				}
			});
			successFunction();
		},
		// ========================== /INIT'S================================== //
		
		entityDetailTabProspecto: function (onSuccess) {		
			var self = this;
			var target = $("#entityDetail");

			var view = '/form-prospectos/js/libs/framework/views/prospectos/prospectosDetailView.js';

			require([view], function (View) {
				var target = $('#entityDetail');
				var view = new View();
				var objetoForzadoPorDetalleProspecto = {};
				objetoForzadoPorDetalleProspecto.id_prosp = self.prospecto.pk.idProsp;
				objetoForzadoPorDetalleProspecto.id_tipo_pros = self.prospecto.pk.idTipoUnidadNegocio;
				objetoForzadoPorDetalleProspecto.pro_version = self.prospecto.pk.version;
				objetoForzadoPorDetalleProspecto.processId = self.processId;
				objetoForzadoPorDetalleProspecto.processName = self.processNameJBPM;
				objetoForzadoPorDetalleProspecto.editar = true;
				view.list(objetoForzadoPorDetalleProspecto, target, true);
				self.prospecto = view.getProspecto();
				self.entity = self.prospecto;
				self.entity.empresas = $.parseJSON(Session.getLocal("empresasAsociadas"));
				self.empresasDomicilio = $.parseJSON(Session.getLocal("empresasAsociadas"));
				onSuccess();
			});
		},
		
		entityDetailTabEmpresa: function (onSuccess) {
			var self = this;
			var target = $("#entityDetail");

			var view = '/form-empresas/js/libs/framework/views/empresas/empresasDetailView.js';

			require([view], function (View) {
				var target = $('#entityDetail');
				var view = new View();
				view.list(self.entityId, target);
				self.empresa = view.getEmpresa();
				self.entity = self.empresa;
				onSuccess();
			});
		},
		
		entityDetailTabGrupo: function (onSuccess) {
			var self = this;
			var target = $("#entityDetail");

			var view = '/form-empresas/js/libs/framework/views/empresas/groupsDetailView.js';

			require([view], function (View) {
				var target = $('#entityDetail');
				var view = new View();
				AsyncProcessor.process([
					function(successFunction, context) {
						view.list(self.entityId, target, successFunction);
					},
					function(successFunction, context) {
						self.grupo = view.getGrupo();
						self.entity = self.grupo;
						self.entity.empresas = $.parseJSON(Session.getLocal("empresasAsociadas"));
						self.empresasDomicilio = $.parseJSON(Session.getLocal("empresasAsociadas"));
						self.entity.razonSocial = self.entity.desc;
						self.entity.cuit = "";
						onSuccess();
						successFunction();
					}
				], self.context);
			});
		},
		
		renderEntityDetailTab: function (onSuccess) {
			var self = this;
			
			if ( self.prospecto != null && self.prospecto != undefined ) {
				self.entityDetailTabProspecto(onSuccess);
			} else if ( self.empresa != null && self.empresa != undefined ) {
				self.entityDetailTabEmpresa(onSuccess);
			} else {
				self.entityDetailTabGrupo(onSuccess);
			}
		},

		getAseguradoras: function (onSuccess) {
			var self = this;
			$.ajax({
				url: '/form-abm-prospectos/aseguradoras.json?date=' + new Date(),
				type: 'GET',
				async: false,
				success: function (data) {
					self.aseguradoras = data;
				},
				error: function (xhr, err) {
				},
				complete: function () {
				}
			});
			onSuccess();
		},

		
		getDocumentacionFaltante: function (onSuccess) {
			var self = this;
			$.ajax({
				url: '/form-cotizaciones-individuales/documentacionFaltante.json?date=' + new Date(),
				type: 'GET',
				async: false,
				success: function (data) {
					self.documentacionFaltante = data;
				},
				error: function (xhr, err) {
				},
				complete: function () {
				}
			});
			onSuccess();
		},

		getContacto: function (onSuccess) {
			var self = this;
			$.ajax({
				url: '/form-cotizaciones-individuales/contacto.json?date=' + new Date(),
				type: 'GET',
				async: false,
				success: function (data) {
					self.contacto = data;
				},
				error: function (xhr, err) {
				},
				complete: function () {
				}
			});
			onSuccess();
		},
		
		reRenderDetail: function (self, successFunction) {
			
			var compiledTemplate = Handlebars.compile(taskDetailTemplate);
			var compiledIntegTemplate = Handlebars.compile(taskDetailIntegrantesTemplate);
			var compiledPlanesTemplate = Handlebars.compile(taskDetailPlanesTemplate)

			if (self.processDetail.integrantes){
				self.titular=self.buildTitular(self.processDetail);
			}
			if(self.cotizacion){
				self.ultimaCotizacion=self.processCoticacion(self.cotizacion);
			}

			$("#processDetail").empty ();
			$("#processDetail").css("background", "");
			$("#processDetail").append (compiledTemplate({context: self}));
			
			if(self.processDetail.condExAfi){
				self.renderListaExAfliados();
				self.renderListaExAfliadosTabDatoCargado();
			}
            
            self.initAttachmentControllerDetail(successFunction);
			
			//self.armarCotizacion(),
			//$("#cotizacionIntegrante"+this.processDetail.idEtapa).empty ();
		    //$("#cotizacionIntegrante"+this.processDetail.idEtapa).append (compiledIntegTemplate({integrantes: this.integrantes}));
			//$("#cotizacionPlanes"+this.processDetail.idEtapa).empty ();
			//$("#cotizacionPlanes"+this.processDetail.idEtapa).append (compiledPlanesTemplate({cotizaciones: this.cotizaciones, vtaPuraPlan: this.processDetail}));
			
		},
		buildTitular: function(processDetail){
			var self=this;
			var titular={};
			for (var i = 0; i < processDetail.integrantes.length; i++) {
				var integrante = processDetail.integrantes[i];
				if(integrante.tipo_inte === "T"){
					titular=integrante;
					break;
				}
			}

			if (self.obrasSociales && processDetail.integrantes) {
				processDetail.integrantes.forEach(function(integrante) {
					if (integrante.cond_afi <= 0 || !integrante.cond_afi) {
						integrante.cond_description = "DIRECTO";
					} else {
						for (var i = 0; i < self.obrasSociales.length; i++) {
							var obraSocial = self.obrasSociales[i];
							if (obraSocial.codigoSSSalud === integrante.cond_afi) {
								integrante.cond_description = obraSocial.descripcion;
							}
						}
					}
				});
			}

			return titular
		},

		processCoticacion:function(cotizacion){
			var self=this;
			self.cotizacion.planesSeleccionados = [];
			self.cotizacion.fecha=self.processDetail.altaFecha;
			self.cotizacion.tarea=self.processDetail.tarea.descripcion;
			var planesSelected = self.processDetail.planVenta? self.processDetail.planVenta.split(",") : [];
			planesSelected.length > 1? planesSelected.pop() : null;

			$.each(cotizacion.planes, function (key, plan) {
				if (planesSelected.includes(plan.codigo) || planesSelected.includes(plan.PLAN_OS)) {
					plan.valorTotalString=self.changeDecimalSeparator(plan.valorTotalPlan.toString());
					self.cotizacion.planesSeleccionados.push(plan);
				}
			});

			cotizacion.integrantes.forEach(function(integrante) {
				var condicion = integrante.ID_CONDICION || integrante.obraSocial;
				if (!condicion) {
					integrante.cond_description = "DIRECTO";
				} else {
					for (var i = 0; i < self.obrasSociales.length; i++) {
						var obraSocial = self.obrasSociales[i];
						if (obraSocial.codigoSSSalud === condicion)  {
							integrante.cond_description = obraSocial.descripcion;
						}
					}
				}
			});

			return cotizacion;
		},

		armarCotizacion: function(){
			
			var self = this;
			var coti1, coti2;
			var cotizaciones = this.cotizacionSeleccionada;

			for (var i = 0; i < cotizaciones.length; i++) {
				coti1 = cotizaciones[i];
				coti1.VALOR_FLIAR_CARGO = 0;
				for (var j = i+1; j < cotizaciones.length; j++) {
					coti2 = cotizaciones[j];
					if (coti1.PLAN_OS === coti2.PLAN_OS) {
						coti1.IVA = coti1.IVA + coti2.IVA;
						if (coti2.COMPOSICION === "FAMILIAR A CARGO") {
							coti1.VALOR_FLIAR_CARGO += coti2.VALOR_TOTAL;
						}
						cotizaciones.splice(j,1);
						j--;
					}
				}
				coti1.TOTAL_A_COBRAR = parseFloat(coti1.VALOR_TOTAL) + parseFloat(coti1.VALOR_FLIAR_CARGO) + parseFloat(coti1.IVA) - parseFloat(coti1.APORTES_DESC);
			}
			
			self.cotizaciones = cotizaciones;
		},

		// Render method.
		render: function () {

			var self = this;
			var compiledTemplate = Handlebars.compile(formEditTemplate);
			$('#version-container').empty();
			var entorno = SettingsModel.get("entorno");

			$.ajax({
				type: "GET",
				url: "META-INF/maven/pom.xml?date=" + new Date().getTime(),
				dataType: "xml",
				success: function (xml) {
					$('#version-container').append(entorno + "-" + $(xml).find('version').eq(1).text());
				},
				error: function (date) {
					$('#version-container').remove();
				}
			});

			
			
			this.$el.html(compiledTemplate({ context: self }));
			
			return this;
		},
		
		getForm: function (accion) {
			var self = this;
			var form =  $("#validation-form-retail");
			form.removeData("validator");
			self.validate.rules = self.viewConfig.rules;
			if(accion && accion == "aCerradoConVenta"){
				self.validate.rules["solicitudCotizacion[grupoFamiliar][][num_doc]"] = {required : true};
				self.validate.rules["solicitudCotizacion[grupoFamiliar][][sexo]"] = {required : true};
			}
            self.validate.messages = self.viewConfig.messages;
			form.validate(self.validate);
			return form;
		},

		serializeObject: function () {
			var self = this;
			var form =  $("#validation-form-retail");
			return ObjectSerializer.serializeObject(form);
		},

		validateForm: function (serializedObject, validate, onSuccess) {
			var self = this;
			
			if ( validate ) {
				var form = self.getForm();
				if( !form.valid() ){
					self.showValidatorErrors();
					self.onValidationFailure();
					return false;
				}
			}
			onSuccess(serializedObject);
			
		},
		
		onValidationFailure: function () {
			VentarRetailUtil.alertMessage("Por favor ingrese los datos necesarios", "warning", "exclamation-sign", "Atenci\u00F3n");
			VentarRetailUtil.unblockScreen();
		},
		
		updateDetailVariable: function (detail) {
			var self = this;

			var processInfoDetalle = {
				detalle: detail
			};

			InboxService.updateVariable(self.processId, 'processInfo', processInfoDetalle, true,
				function (data) {},
				function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				function (data) {}
			)
		},
		
		formatMoney: function(amount, decimalCount, decimal, thousands ) {
			try {
			    decimalCount = Math.abs(decimalCount);
			    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
			    
			    var negativeSign = amount < 0 ? "-" : "";
			    
			    var i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
			    var j = (i.length > 3) ? i.length % 3 : 0;

			    return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
			  } catch (e) {
			    console.log(e)
			  }
		},
		
		printPDF: function() {
			var self = this;
			var planSeleccionado = $('#hiddenExportPDF').val();
			var planCotizacion;
			var zonaCotizacion;

			$.each(this.cotizacion.planes, function (key, value) {
				if (value.codigo == planSeleccionado) {
					planCotizacion = value;
					return;
				}
			});
			
			ProspectoService.findZonas(0, true,
				function (data) {

					$.each(data, function (key, value) {
						if (value.id == self.cotizacion.zona.id) {
							zonaCotizacion = value.descripcion;
						}
					});
					
					
					var integrante = self.cotizacion.integrantes[0];
					var integrantesConcat = integrante.parentescoDescripcion + " " + integrante.edad;

					//Titular 48, Cónyuge 45, Hijo 15, Hijo 12, Hijo 10, Hijo 8
					for (var i = 1; i < self.cotizacion.integrantes.length; i++) {
						integrante = self.cotizacion.integrantes[i];
						integrantesConcat += ", " + integrante.parentescoDescripcion + " " + integrante.edad;
					}

					var plan = "" + planSeleccionado;
					var descuento = 40;
					var grupo = integrantesConcat;
					var zona = zonaCotizacion;
					var valor=  "$ " + self.formatMoney( planCotizacion.valorTotalPlan, 2, ",", "." );
					var aCargo= "$ " + self.formatMoney( planCotizacion.valorFamiliar, 2, ",", "." );
					var aporte = "$ "+ self.formatMoney( planCotizacion.valorAporte, 2, ",", "." );
					var descMulti = "$ 0,00";
					var iva = "$ " + self.formatMoney( planCotizacion.valorIva, 2, ",", "." );
					var total = "$ "+ self.formatMoney( planCotizacion.valorTotal, 2, ",", "." );
					
					
					CotizacionesService.getCotizacionPDF(plan, descuento, grupo, zona, valor, aCargo, aporte, descMulti, iva, total,
						function(data) {
								
							$("#modal-form-show").modal("show");
							
							var url = window.URL.createObjectURL( data );
							
							$('#iframeShow').attr('src', url );
							
							var elemToChange = document.getElementById("iframeShow");
							elemToChange.style.height = $(window).height() - 200 + "px";
						},
						function (xhr, err) {
                            $.gritter.add({
                                title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Error',
                                text: "No se pudo obtener la cotización ",
                                class_name: 'gritter-error'
                            });
						},
						function (xhr) {
							
						});

				},
				function (xhr, err) {
							
				},
				function (data) {
					
				});
		},
		
		// ==================================================================== //
		// ============================== EVENTS ============================== //
		// ==================================================================== //

		onChangeActions: function (e) {
			
			var self = this;
			var descripcion = $("#actions option:selected").data("statusDescription")
		
			if ( $("#actions option:selected").val() == "aCerradoSinVenta" ) {//cerrado sin venta
				VentarRetailUtil.blockScreen();
				self.renderMotivosNoVenta(function(){ });
				$("#lblMotivosRechazoContainer").show();
				
			} else {
				$("#motivosRechazoContainer").empty();
				$("#lblMotivosRechazoContainer").hide();
				
			}

			VentarRetailUtil.unblockScreen();

		},
		
		onClickBtnPrintTask: function(e) {
			var self = this;
			self.printPDF();
		},

		identificarAcciones: function (volver,  panel) {
			//Segun la etapa de wizard en la que esta voy indicando que botones mostrar
			var acciones = {};
			var self = this;
			var panelActivo = panel!=null ? panel : $('.ace-wizard').find('li.active').attr('data-target');
			switch (panelActivo) {
				case '#step1-contactar':
					acciones.mostrarActionStepDosContactar = true;
					acciones.mostrarCheckCerrado = true;
					acciones.mostrarFinalizarHide = true;
					acciones.mostrarSiguiente = true;
					this.renderTemplateWizard(acciones);
					break;
				case '#step2-contactar':
					if (self.omitirCompletarProspecto){
						acciones.mostrarActionStepDosContactar = true;
						acciones.mostrarCheckCerrado = true;
						acciones.mostrarFinalizarHide = true;
						acciones.mostrarCotizar = true;
						if(volver){
							acciones.mostrarSiguiente = true;
							acciones.mostrarCotizar = false;
						}
					}else{
						if (self.idDeCotizacion>0){
							acciones.mostrarSiguiente = true;
							acciones.mostrarCotizar = false;
						}else{
							acciones.mostrarSiguiente = false;
							acciones.mostrarCotizar = true;
						}
						acciones.mostrarActionStepDosContactar = true;
						acciones.mostrarVolver = true;
					}
					this.renderTemplateWizard(acciones);
					break;
				case '#step1-entrevistar':
					
					acciones.mostrarActionStepUnoContactar = false;
					
					if (self.omitirCompletarProspecto) {
						acciones.mostrarTransicionarStepTres = true;
					} else {
						
						if( panelActivo == '#step2-contactar' ) {
							acciones.mostrarActionStepDosContactar = true;
						} else {
							acciones.mostrarActionStepDosContactar = false;
						}
						
						acciones.mostrarVolver = true;
						//Si ya existe cotizacion previa, muestra botón siguiete sino muestra boton para cotizar
						if(self.integrantes || self.cotizarForm.grupoFamiliar){
							acciones.mostrarSiguiente = true;
						}else{
							acciones.mostrarCotizar = true;
						}	
						acciones.mostrarTransicionarStepTres = true;	
						acciones.mostrarVolver = false;
						acciones.mostrarVolverTransicion = false;

					}
					this.renderTemplateWizard(acciones);
					break;
				case '#step3-contactar':
				case '#step2-entrevistar':
					if( panelActivo === '#step3-contactar' ) {
						acciones.enviarLink=false;
					} else {
						acciones.enviarLink=true;
					}
					acciones.mostrarActionStepUnoContactar = false;
					acciones.mostrarTransicionarStepTres = true;
					this.renderTemplateWizard(acciones);
					break;
			}
		},

		renderTemplateWizard: function(acciones){
			var compiledTemplate = Handlebars.compile(accionesWizard);
			$("#wizard-acciones").html(compiledTemplate({acciones: acciones, context: this}));
		},

		next: function(){
			var self = this;
			var form = self.getForm();

			self.panelActivo = $('.ace-wizard-btn-prev').data('stepActual');
			if(!self.panelActivo){
				self.stepActivo = $('.ace-wizard').find('li.active').attr('data-target');
			}
            if( self.panelActivo == "#step1-entrevistar" && $('#btnCotizar').is(":visible")) {
            	form =  $("#validation-form-retail");
        		
    			var fecha = Moment().format("YYYY/MM/DD");
    			var conyuges = $(".parentezcoConyuge:selected").length;
    			
    			Util.debug("conyuges",$(".parentezcoConyuge:selected").length);

    			if (conyuges > 1) {
    				$.gritter.add({
    					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
    					text : 'No puede existir más de un conyuge',
    					class_name : 'gritter-warning'
    				});
    				return false;
    			} else {
    				this.validateStep()	
    			}
            }
			
			if(!form.valid()){
				
				self.showValidatorErrors();
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Por favor ingrese los datos necesarios',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				return false;
			}else{

				self.panelActivo = $('.ace-wizard').find('li.active').attr('data-target');

				if(self.panelActivo == "#step1-contactar" && !self.omitirCompletarProspecto){
					self.validarProspecto();
				}
				if(self.panelActivo == "#step2-contactar" || self.panelActivo == "#step1-entrevistar" || self.omitirCompletarProspecto){
					
					if($('#btnCotizar').is(":visible")){
						this.generarContacto();
					}else{
						$('.ace-wizard').ace_wizard();
						$('.ace-wizard').wizard('next');
					}
				}
				self.identificarAcciones();
			}
		},

		prev: function() {
			var self = this;
			var form = self.getForm();
			var volver=true;
			if(!form.valid() && self.task.config.taskName!='Contactar'){
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Por favor ingrese los datos necesarios',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				return false;
			} else {
				
				self.panelActivo = $('.ace-wizard-btn-prev').data('stepActual');
				if(!self.panelActivo){
					self.stepActivo = $('.ace-wizard').find('li.active').attr('data-target');
				}
				
				$('.ace-wizard').ace_wizard();
				$('.ace-wizard').wizard('previous');
				
				self.identificarAcciones(volver);
			}
			
		},

		generarContacto: function(){
			
			var self = this;
			
			var form =  $("#validation-form-retail");
		
			var fecha = Moment().format("YYYY/MM/DD");
			var conyuges = $(".parentezcoConyuge:selected").length;

			Util.debug("conyuges",$(".parentezcoConyuge:selected").length);

			if (conyuges > 1) {
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'No puede existir más de un conyuge',
					class_name : 'gritter-warning'
				});
				return false;
			} else {

				
				if (this.validateStep()) {
					
					setTimeout(function() {
						$("#btnNext").hide(); 	
						$("#actionSelected").show();
					},100);
					
					self.cotizar();
					return true;
				} else {
					$.gritter.add({
						title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text : 'Por favor ingrese los datos necesarios',
						class_name : 'gritter-warning'
					});
					Util.unBlockBody();
					return false;
				}
				
			}
			
		},

		validateStep: function () {
			
			var valid = true;
			
			var zona = $('#slZonas').val();
			var num = $('.inputRemuneracion').length;
			var numero = Number(num);
			//var numero = 1
			
			for (var i = 0; i < numero; i++) {

				var edad = $('#txtEdad_' + i).val();
				var sexo = $('#slsexo_' + i).val();
				
				var condicion = $('.selectCondicion')[i].value;
				var paren = $('.selectParentesco')[i].value;
				var remuneracionBruta = $('.inputRemuneracion')[i].value;
				
				if (edad === '' || paren === '' || sexo === '') {
					valid = false;
					break;
				}

				if (paren === 'T' || paren === 'E') {
					if (condicion != '0' && condicion != '-1') {
						if (remuneracionBruta === '') {
							valid = false;
							break;
						}
					}
				}
			}

			return valid;
		},

		cotizar: function() {
			var self = this;
			var fecha = Moment().format("YYYY/MM/DD");
			var cotizacionNoBPM = false;
			var error;
			if(cotizacionNoBPM == false){
				var solicitud = this.buildObjectCotizar();
			}else{
				var solicitud = this.buildObjectCotizarNOBPM();
			}
			
			self.forecast.capitas = solicitud.grupoFamiliar.length;
			self.cotizarForm = solicitud;
			Util.blockBody();

			FuseService.crearProceso(
				solicitud,
				false,
				function(data) {
					self.cotizacionProcessId = data.jbpmProcess;
					self.cotizacion = eval(data.mapBodyResponseBundleEspecifico);
					
					
					
					Util.info(self.cotizacion);
				},
				function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					$("#div-form-3").empty();
					
					Util.unBlockBody();
				}						
			);

			if (this.cotizacion === undefined) {
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Ha ocurrido un problema en Afilmed, por favor contacte al área de Planeamiento para su análisis.',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				return false;
			} 
			
			
			
			if (this.cotizacion != null) {
				
				if(cotizacionNoBPM == false){
					this.cotizacion = CotizadorUtil.buildObjectCotizacion(this.cotizacion.cotizaciones);
					
					if( !this.cotizacion.integrantes && solicitud.grupoFamiliar) {
						
						this.cotizacion.integrantes = solicitud.grupoFamiliar;
						
						$.each(this.cotizacion.integrantes, function(index, integrantex) {
							integrantex.parentescoDescripcion = $(".selectParentesco").find('option[value="'+integrantex.parentesco+'"]')[0].text;
						});
					}
				}
				
				Util.info("COTIZ: ", this.cotizacion);

				this.idDeCotizacion = this.cotizacion.cotizacionId;

				var compiledTemplate = Handlebars.compile(ListPlanesTemplate);
			
				self.calcularForecastPonderado();

				//Cambio wizard
				$('.ace-wizard').ace_wizard();
				$('.ace-wizard').wizard('next');
						
				$("#detalleStep").empty();
				$("#detalleStep").append(compiledTemplate({
					cotizacion : this.cotizacion,
					proceso : this.cotizacionProcessId,
					fecha : fecha,
					error : error,
					forecast : this.forecast
				}));
				
				
				self.saveTaskCotizar();
				
				Util.unBlockBody();

			} else {
				Util.error("Error: " + cotizaciones.mapBodyResponseBundleEspecifico.deno_error);
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Ha ocurrido un problema en Afilmed, por favor contacte al área de Planeamiento para su análisis.',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				return false;
			}

		},

		buildObjectGFamiliar : function() {
			/**
			 * al usar build object para comparar si se modifico el grupo familiar se tarda
			 * por eso genere este metodo mas sencillo solo para grupo familiar
			 */
			var solicitud = {};
			var self = this;
			var form =  $("#validation-form-retail");
			var solicitudCotizacion = ObjectSerializer.serializeObject(form).solicitudCotizacion;

			solicitud.zona = parseInt($("#slZonas").val(),10);
			solicitud.grupoFamiliar = solicitudCotizacion.grupoFamiliar;
			for (var i = 0; i < solicitud.grupoFamiliar.length; i++) {
				solicitud.grupoFamiliar[i].inte = i + 1;
				!solicitud.grupoFamiliar[i].remuneracion ? solicitud.grupoFamiliar[i].remuneracion = 0 : null;
				solicitud.grupoFamiliar[i].obraSocial = solicitud.grupoFamiliar[i].obraSocial === '-1' ? null : parseInt(solicitud.grupoFamiliar[i].obraSocial, 10)
				solicitud.grupoFamiliar[i].fecha_nac=solicitud.grupoFamiliar[i].fecha_nac === "" || solicitud.grupoFamiliar[i].fecha_nac === null ? null:solicitud.grupoFamiliar[i].fecha_nac; 
			}

			return solicitud;
		},

		buildObjectCotizar : function() {
			var self = this;
			var form =  $("#validation-form-retail");
			var solicitudCotizacion = ObjectSerializer.serializeObject(form).solicitudCotizacion;
			var prospecto = self.actualizarProspecto();
			var teltipo = (prospecto.telefonos[0])?prospecto.telefonos[0].tipo_tele:((prospecto.telefonos.generico)?prospecto.telefonos.generico.tipo_tele:null);
			var telpais = (prospecto.telefonos[0])?prospecto.telefonos[0].codigo_pais:((prospecto.telefonos.generico)?prospecto.telefonos.generico.codigo_pais:null);
			var telNac = (prospecto.telefonos[0])?prospecto.telefonos[0].codigo_nacional:((prospecto.telefonos.generico)?prospecto.telefonos.generico.codigo_nacional:null);
			var telMun = (prospecto.telefonos[0])?prospecto.telefonos[0].numero:((prospecto.telefonos.generico)?prospecto.telefonos.generico.numero:null);
			var solicitud = {};
			solicitud.tipoCotizador = 0;
			solicitud.secuencia = 1;
			//Para recotizacion
			var zonaId = parseInt($("#slZonas").val(), 10);
			solicitud.zona = zonaId != null && !isNaN(zonaId) ? zonaId : (self.processDetail.detalleCotizacion?.zona?.id ?? null);
			solicitud.cuit = null;
			solicitud.nombre = prospecto.nombre;
			solicitud.apellido = prospecto.apellido;
			solicitud.dni = {};
			solicitud.dni.tipo = "1";
			if(prospecto.docTipo=="PA"){
				solicitud.dni.numero = parseInt(prospecto.pasaporte.replace(/[a-z]/gi, ''));
				solicitud.dni.tipo = "PA";
			}else{
				if (prospecto.docNum !== "" || prospecto.docNum !== null) {
					solicitud.dni.numero = parseInt(prospecto.docNum,10);
				} else {
					solicitud.dni.numero = 0;
				}
			}
			solicitud.telefono = {};
			solicitud.telefono.tipo = teltipo;
			solicitud.telefono.pais = telpais;
			solicitud.telefono.nacional = telNac;
			solicitud.telefono.numero = telMun;
			solicitud.telefono.extension = null;
			solicitud.codProductor = "A01";
			solicitud.codAsesor = "A01";
			solicitud.plan = null;
			solicitud.descuento = 0.0;
			ocultarDescuento = true;
			if(self.aplicarDescuento()){
				solicitud.descuento = 10;
				ocultarDescuento = false;
			}
			solicitud.email = (prospecto.emails[0])?prospecto.emails[0].email_tipo_den:null;
			solicitud.fecha = Moment().format("YYYYMMDD");

			if(!solicitudCotizacion){
                solicitud.grupoFamiliar = CotizadorUtil.buildObjectGFamiliarSMG();
            }else{
                solicitud.grupoFamiliar = solicitudCotizacion.grupoFamiliar;
                for (var i = 0; i < solicitud.grupoFamiliar.length; i++) {
                    solicitud.grupoFamiliar[i].inte = i + 1;
                    !solicitud.grupoFamiliar[i].remuneracion ? solicitud.grupoFamiliar[i].remuneracion = 0 : null;
                    solicitud.grupoFamiliar[i].obraSocial = solicitud.grupoFamiliar[i].obraSocial === '-1' ? null : parseInt(solicitud.grupoFamiliar[i].obraSocial, 10)
                }
            }
			var cantGrupoFamiliar =  solicitud.grupoFamiliar.length;
			var user = Session.getLocal("userName");
			var userId = Session.getLocal("userId");
			var supervisorAsesor = {};
			OvUtil.findSupervisor(user, function(supervisor) {supervisorAsesor = supervisor;});
			solicitud.nombreAsesor = Util.getUserNameComplete(userId);
			solicitud.usernameAsesor = user;
			solicitud.usernameSupervisor = supervisorAsesor.login;
			solicitud.nombreSupervisor = supervisorAsesor.nombre;
			var supervisorSuperior = {};
			OvUtil.findSupervisor(supervisorAsesor.login, function(supervisor) {supervisorSuperior = supervisor;});
			solicitud.usernameJefe = supervisorSuperior.login;
			solicitud.nombreJefe = supervisorSuperior.nombre;
			solicitud.process = {};
			solicitud.process.variables = {};
			solicitud.process.variables.workContext = 'AMB_COMERCIAL';
			solicitud.process.variables.finalizado = 'false';
			solicitud.process.variables.processOwner = userId;
			solicitud.process.variables.actorId = userId;
			solicitud.process.variables.processInfo = {};
			solicitud.process.variables.processInfo.id = "0";
			solicitud.process.variables.processInfo.name = "OV-VA-Individuos";
			solicitud.process.variables.processInfo.descripcion = "OV-VA-Individuos";
			//Para recotizacion
			var descripcionZona = $("#slZonas option:selected").text().trim() || self.zonas?.find(zona => zona.id === self.processDetail.detalleCotizacion?.zona?.id)?.descripcion || "";
			solicitud.process.variables.processInfo.detalle = "SGI - " + descripcionZona + " - " + cantGrupoFamiliar;
			solicitud.process.variables.processInfo.credencial = "DOC-" + self.prospecto.docNum;
			solicitud.process.variables.processInfo.procesoRelacionadoId = self.processId;
			solicitud.process.variables.processInfo.atencionRelacionadaId = null;
			solicitud.process.variables.processInfo.registradoUsuario = user;
			solicitud.process.variables.processInfo.registradoNombre = userId;

			solicitud.process.version = '1';
			solicitud.process.processName = "OV-VA-Individuos";
			solicitud.process.status = 'Running';
			solicitud.process.workContext = 'AMB_COMERCIAL';
			solicitud.process.credencial = "DOC-" + self.prospecto.docNum;
			solicitud.process.ambitoGestion = '';
			solicitud.process.id = null;
			solicitud.process.processId = null;
			solicitud.process.key = null;
			solicitud.process.start = new Date().getTime();
			solicitud.process.detalle = "SGI - " + $("#slZonas option:selected").text() + " - " + cantGrupoFamiliar;

			solicitud.canalOrigen = {};
			solicitud.canalOrigen.id = 2; //CANAL SGI
			solicitud.canalOrigen.subCanal = Session.getLocal("subsidiary");
			solicitud.canalOrigen.subCanal2 = null;

			var medio = ProspectoUtil.getMedioPorUserTipo().id == undefined ? 14 : ProspectoUtil.getMedioPorUserTipo().id
			solicitud.medio = {};
			solicitud.medio.id = medio

			return solicitud;
		},

		buildObjectCotizarNOBPM: function () {
			var self = this;

			var userName = Session.getLocal("userName");
			var userId = Session.getLocal("userId");
			var prospecto = self.prospecto;
			var form =  $("#validation-form-retail");
			var solicitudCotizacion = ObjectSerializer.serializeObject(form).solicitudCotizacion;
			var generico = {};

			//solicitado por afilmed para la cotizacion ordenado por sp
			generico.apellido = prospecto.apellido;
			generico.nombre = prospecto.nombre;
			generico.dni = {};
			generico.dni.tipo = prospecto.docTipo;
			generico.dni.numero = prospecto.docNum ? parseInt(prospecto.docNum, 10) : 0;
			generico.email = (prospecto.emails[0]) ? prospecto.emails[0].email_tipo_den : null;
			generico.telefono = {};
			generico.telefono.tipo = (prospecto.telefonos[0]) ? prospecto.telefonos[0].tipo_tele : null;
			generico.telefono.pais = (prospecto.telefonos[0]) ? prospecto.telefonos[0].codigo_pais : null;
			generico.telefono.nacional = (prospecto.telefonos[0]) ? prospecto.telefonos[0].codigo_nacional : null;
			generico.telefono.numero = (prospecto.telefonos[0]) ? prospecto.telefonos[0].numero : null;
			generico.telefono.extension = null;
			generico.zona = solicitudCotizacion.zona.id;

			generico.tipoCotizador = 0;
			//zona
			generico.cuit = null;
			//dni.numero
			generico.codProductor = "A01";
			generico.codAsesor = "A01";
			generico.plan = null;
			generico.secuencia = 1;
			generico.descuento = 0.0;
			generico.fecha = Moment().format("YYYYMMDD");

			generico.usernameAsesor = userName;
			generico.nombreAsesor = self.userNombreApe;
			var supervisorAsesor = {};
			OvUtil.findSupervisor(userName, function (supervisor) {
				supervisorAsesor = supervisor;
			});
			generico.usernameSupervisor = supervisorAsesor.login;
			generico.nombreSupervisor = supervisorAsesor.nombre;
			var supervisorSuperior = {};
			OvUtil.findSupervisor(supervisorAsesor.login, function (supervisor) {
				supervisorSuperior = supervisor;
			});
			generico.usernameJefe = supervisorSuperior.login;
			generico.nombreJefe = supervisorSuperior.nombre;

			generico.grupoFamiliar = solicitudCotizacion.grupoFamiliar;
			for (var i = 0; i < generico.grupoFamiliar.length; i++) {
				generico.grupoFamiliar[i].inte = i + 1;
				!generico.grupoFamiliar[i].remuneracion ? generico.grupoFamiliar[i].remuneracion = 0 : null;
				generico.grupoFamiliar[i].obraSocial = generico.grupoFamiliar[i].obraSocial === '-1' ? null : parseInt(generico.grupoFamiliar[i].obraSocial, 10)
			}

			//fin especifico
			//parte generica
			var detalle = "SGI - " + $("#slZonas option:selected").text() + " - " + generico.grupoFamiliar.length;

			generico.user = {};
			generico.user.id = userId;
			generico.user.userName = userName;
			generico.user.name = self.userNombreApe;

			generico.observacion = detalle;

			generico.motivo = {};
			generico.motivo.descripcion = "Cotizador Individuos";

			generico.canalOrigen = {};
			generico.canalOrigen.id = 2; //CANAL SGI
			generico.canalOrigen.subCanal = Session.getLocal("subsidiary");
			generico.canalOrigen.subCanal2 = null;

			var medio = ProspectoUtil.getMedioPorUserTipo().id == undefined ? 14 : ProspectoUtil.getMedioPorUserTipo().id
			generico.medio = {};
			generico.medio.id = medio

			generico.sucursal = {};
			generico.sucursal.id = Number(Session.getLocal("subsidiaryId"));
			generico.sucursal.descripcion = Session.getLocal("subsidiary");

			generico.typeEntity = {};
			generico.typeEntity.id = 4;
			generico.typeEntity.descripcion = "prospecto";

			generico.process = {};
			generico.process.version = "1";
			generico.process.processName = "Cotizador Individuos";
			generico.process.workContext = Session.getLocal("environment");
			generico.process.credencial = "DOC-" + self.prospecto.docNum;
			generico.process.ambitoGestion = Session.getLocal("subsidiary");
			generico.process.observacion = detalle;
			generico.process.detalle = detalle;
			generico.process.actorId = userId;
			
			generico.prospecto = {};
			generico.prospecto.id = self.prospecto.pk.idProsp;
			generico.prospecto.version = self.prospecto.pk.version;
			generico.prospecto.tipo = self.prospecto.pk.idTipoUnidadNegocio;

			generico.processId = self.task.processId;

			generico.taskName = self.task.name;

			//fin parte generica

			return generico;
		},

		buildDetalleIntegrantes: function(){
			var self = this;

			var solicitud = {};
			var form =  $("#validation-form-retail");
			solicitudCotizacion = ObjectSerializer.serializeObject(form).solicitudCotizacion;

			if(!solicitudCotizacion){
                solicitud.grupoFamiliar = CotizadorUtil.buildObjectGFamiliarSMG();
            }else{
                solicitud.grupoFamiliar = solicitudCotizacion.grupoFamiliar;
                for (var i = 0; i < solicitud.grupoFamiliar.length; i++) {
                    solicitud.grupoFamiliar[i].inte = i + 1;
                    !solicitud.grupoFamiliar[i].remuneracion ? solicitud.grupoFamiliar[i].remuneracion = 0 : null;
                    solicitud.grupoFamiliar[i].obraSocial = solicitud.grupoFamiliar[i].obraSocial === '-1' ? null : parseInt(solicitud.grupoFamiliar[i].obraSocial, 10)
                }
            }

			var inteCotizacion = [];
			
			for (var i = 0; i < solicitud.grupoFamiliar.length; i++) {
				var integrante = solicitud.grupoFamiliar[i];
	
				if (integrante.tipo_doc !== 'DU') {
					integrante.validado = Boolean(integrante.nombre && integrante.apellido && integrante.num_doc && integrante.sexo && integrante.fecha_nac);
				}

				var transformedIntegrante = {
					tipo_inte: integrante.parentesco || '',
					nombre: integrante.nombre || null,
					apellido: integrante.apellido || null,
					tipo_doc: integrante.tipo_doc || null,
					num_doc: integrante.num_doc || null,
					genero: integrante.sexo || null,
					fecha_nac: integrante.fecha_nac || null,
					cond_afi: integrante.obraSocial || -1,
					edad: integrante.edad || null,
					remuneracion: integrante.remuneracion ? parseFloat(integrante.remuneracion) : 0,
					validado: integrante.validado === true || integrante.validado === "true"
				};
				inteCotizacion.push(transformedIntegrante);
			}

			return inteCotizacion;
		},

		getMotivosRetail: function(onSucess){
			var self = this;
			
			$.ajax({
				url: 'motivosRechazoRetail.json?date=' + new Date(),
				type: 'GET',
				async: false,
				success: function (data) {
					self.motivos = data;
				},
				error: function (xhr, err) {
				},
				complete: function () {
				}
			});

			onSucess();
		},

		getTareasVentaSalud: function(onSucess){
			var self = this;
			$.ajax({
				url: 'tareasVentaSalud.json?date=' + new Date(),
				type: 'GET',
				async: false,
				success: function (data) {
					self.tareas = data;
				},
				error: function (xhr, err) {
				},
				complete: function () {
				}
			});
			onSucess();
		},

		///Nuevos metodos y heredados de formViewRetail
		validarProspecto: function(){
			var self = this;
			var valid = true;

			if(!this.validateTelefonos(form)){
				valid = false;
			}
			if(!this.validateEmails(form)){
				valid = false;
			}

			if(valid){
				$('.ace-wizard').ace_wizard();
				$('.ace-wizard').wizard('next');					
				
			}else{
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Por favor ingrese los datos necesarios',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				return false;
			}
		},

		validateAddress: function(e){

			var self = this;
			var provincia = $("#prov option:selected").text();
			var partido = $("#partido option:selected").text();
			var localidad = $("#loc option:selected").text();
			var calle = $("#street").val() ;
			var altura = $("#number").val() ;
			var addressFinal = new Array();

			GisService.validAddress(provincia, partido, localidad, calle, altura,
				function(data) {
					var respuesta = data;
						Util.debug("validateAddress", data);
	
						if(respuesta.validacion.listaopciones.opcion instanceof Array){
							for (var i=0;i<respuesta.validacion.listaopciones.opcion.length;i++){
								addressFinal.push(respuesta.validacion.listaopciones.opcion[i]);
							}
						}else{
							addressFinal.push(respuesta.validacion.listaopciones.opcion);
						}
	
						addressFinal = self.parseAddresses(addressFinal);
	
						$("#addressValidationTitle").removeClass ("orange");
						$("#addressValidationTitle").removeClass ("green");
	
						if(addressFinal.length > 0){
							$("#addressValidationTitle").addClass ("green");
							$("#addressValidationTitle").empty ();
							$("#addressValidationTitle").append('<i class="icon-ok"></i> Se encontraron los siguientes resultados!');
						}else{
							$("#addressValidationTitle").addClass ("orange");
							$("#addressValidationTitle").empty ();
							$("#addressValidationTitle").append('<i class="icon-warning-sign"></i> El domicilio no fue encontrado!');
						}
	
						$("#addressValidateDiv").empty ();
						var compiledTemplate = Handlebars.compile(addressTemplate);
						$("#addressValidateDiv").append (compiledTemplate({address: addressFinal}));
	
						$("#modal-form-validate-address").modal('show');

				}, function (xhr, err) {
					$("#addressValidationTitle").removeClass ("orange");
						$("#addressValidationTitle").removeClass ("green");
						$("#addressValidationTitle").addClass ("orange");
						$.gritter.add({
							title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text: 'El servicio de validación no responde',
							class_name: 'gritter-warning'
						});
						$("#addressValidationTitle").empty ();
						$("#addressValidationTitle").append('<i class="icon-warning-sign"></i> El domicilio no fue encontrado!');
						Util.error( 'Sample of error data:', err );
						Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
				
					}, function () {
					
				}
			);

		},

		parseAddresses: function(addressFinal){
			for (var i=0;i<addressFinal.length;i++){
				addressFinal[i] = this.parseAdress(addressFinal[i]);
			}
			Util.debug("addressFinal", addressFinal);
			return addressFinal;
		},
	
		parseAdress: function(address){
			address.barrio = this.parseReg(address.barrio);
			address.localidad = this.parseReg(address.localidad);
			address.partido = this.parseReg(address.partido);
			address.provincia = this.parseReg(address.provincia);
			return address;
		},

		parseReg: function(reg){
			var rta = JSON.parse('{"cod":"","desc":""}');
			if(reg != null && reg != ""){
				var arr = reg.split('|');
				rta.desc = arr[0];
				rta.cod = arr.length >1 ? arr[1] : "";
			}
			return rta;
		},

		validateTelefonos: function(){
			var self = this;
			var valid = false;
			var formPMT =  $("#validation-form-retail");
			var telefonos = formPMT.serializeObject().prospecto.telefonos;
			if(telefonos.generico.numero == ""){
				valid = false;
			}else{
				valid = true;
			}
			this.$('#errorViewTelefonos').empty ();
			if (!valid) {
				var alertMessageView = new AlertMessageView ();
				this.$('#errorViewTelefonos').append (alertMessageView.render ("Debe de completar al menos un teléfono.").el);
			}
			return valid;
		},

		checkTelefonoValido: function( tel, divId){
			this.$('#'+ divId + "telErrorMessage" ).remove();
			var telsCargados = 0;
	
			if ( !Util.isEmpty(tel.codigo_pais) ) {
				telsCargados+=1;
			}
			if ( !Util.isEmpty(tel.codigo_nacional) ) {
				telsCargados+=1;
			}
			if ( !Util.isEmpty(tel.numero) ) {
				telsCargados+=1;
			}
			if(!(telsCargados == 3 || telsCargados == 0 && Util.isEmpty(tel.extension))){
				ProspectoUtil.validationMessage(divId, "El teléfono debe contener los campos Cod. País, Cod. Nacional y Número.", divId + "telErrorMessage");
			}
			return telsCargados == 3;
		},

		validateEmails: function(formTarget){
			var self = this;
			var emailMsg = "";
			var formPMT =  $("#validation-form-retail");
			var emails = formPMT.serializeObject().prospecto.emails;
			
			this.$('#errorViewMails').empty ();
			
			if(Util.isEmpty(emails.generico.denominacion) /*Util.isEmpty(emails.princ.denominacion) && Util.isEmpty(emails.sec.denominacion)*/) {
				
				var alertMessageView = new AlertMessageView ();
				this.$('#errorViewMails').append (alertMessageView.render ("Debe de completar el email.").el);
				//this.$('#errorViewMails').append (alertMessageView.render ("Debe de completar al menos un email.").el);
				
				return false;
			} else {

				/*
				if( emails && emails.princ && !Util.isEmpty(emails.princ.denominacion) && !this.checkEmailValido(emails.princ) ) {
					emailMsg = "- Particular ";
				}
				
				if( emails && emails.sec && !Util.isEmpty(emails.sec.denominacion) && !this.checkEmailValido(emails.sec)) {
					emailMsg += "- Laboral ";
				}
				*/

				if( emails && emails.generico && !Util.isEmpty(emails.generico.denominacion) && !this.checkEmailValido(emails.generico) ) {
					emailMsg = "Generico";
				}

			}
			
			if (!Util.isEmpty(emailMsg)) {
				var alertMessageView = new AlertMessageView();
				//this.$('#errorViewMails').append (alertMessageView.render("Email " + emailMsg + " no v&aacute;lido.").el);
				this.$('#errorViewMails').append (alertMessageView.render("Email no v&aacute;lido.").el);
				return false;
			}
			
			return true;
		},
		
		checkEmailValido: function( tel){
			var regexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return regexp.test(tel.denominacion);
		},
		
		selectAddress: function(e){

			Util.debug('$(event.target).closest("tr").data("provincia")', $(event.target).closest("tr").data("provincia"));
			Util.debug('$(event.target).closest("tr").data("partido")', $(event.target).closest('tr').data("partido"));
			Util.debug('$(event.target).closest("tr").data("localidad")', $(event.target).closest('tr').data("localidad"));
			Util.debug('$(event.target).closest("tr").data("barrio")', $(event.target).closest('tr').data("barrio"));
	
			if(!Util.isEmpty($(event.target).closest('tr').data("provincia"))){
				$('#prov option[value='+$(event.target).closest('tr').data("provincia")+']').attr('selected','selected');
			}
			if(!Util.isEmpty($(event.target).closest('tr').data("partido"))){
				$('#partido option[value='+$(event.target).closest('tr').data("partido")+']').attr('selected','selected');
			}
			if(!Util.isEmpty($(event.target).closest('tr').data("localidad"))){
				$('#loc option[value='+$(event.target).closest('tr').data("localidad")+']').attr('selected','selected');
			}
			$("#neighbourhood").val($(event.target).closest('tr').data("barrio"));
			$("#street").val($(event.target).closest('tr').data("calle"));
			$("#number").val($(event.target).closest('tr').data("altura"));
			$("#cp").val($(event.target).closest('tr').data("cp"));
			$("#cpa").val($(event.target).closest('tr').data("cpa"));
			$("#coordX").val($(event.target).closest('tr').data("coordx"));
			$("#coordY").val($(event.target).closest('tr').data("coordy"));

			$("#valid-address").prop('checked', true);
			$('#modal-form-validate-address').modal('hide');
			//this.confirmSave();
		},

		showValidatorErrors: function () {
			var self = this;
			if(self.viewConfig.rules){
				$.each(self.viewConfig.rules, function (key, value) {
					$('[name="' + key + '"]').each(function () {
						$(this).focusout();
					});
				});
			}
		},
		
		verificoValidacion: function(){
			
			var panelActivo = $('.ace-wizard').find('li.active').attr('data-target');
			var accionSeleccionada = $("#actions option:selected").val() 

			if(panelActivo == '#step2-contactar' && accionSeleccionada == 'aEntrevistar'){
				return false;
			}
			
			if(panelActivo == "#step2-contactar" && accionSeleccionada == "aCerradoSinVenta" ) {
				return false;
			}
			
			if(panelActivo == '#step1-contactar' && accionSeleccionada == 'aEntrevistar'){
				return false;
			}
			
			if(panelActivo == "#step1-contactar" && accionSeleccionada == "aCerradoSinVenta" ) {
				return false;
			}
			
			if(panelActivo == "#step1-entrevistar" && accionSeleccionada == "aCerradoSinVenta" ) {
				return false;
			}
			
			return true;
		},

		actualizarProspecto: function(){
			var self = this;
			var prospecto = self.prospecto;
			var form =  $("#validation-form-retail");
			var prospectoActualizado = ObjectSerializer.serializeObject(form).prospecto;
			if(prospectoActualizado){
				prospecto.nombre = prospectoActualizado.nombre
				prospecto.apellido = prospectoActualizado.apellido
				prospecto.docNum = parseInt(prospectoActualizado.docNum)
				prospecto.emails = prospectoActualizado.emails
				prospecto.telefonos = prospectoActualizado.telefonos
			}
			return prospecto;
		},

		calcularForecastPonderado: function(){
			var self = this;
			//N° de capitas calculadas dentro de la cotizacion
			var capitas	= 1;
			if(self.cotizacion){
				$.each(self.cotizacion.planes, function(index, cotizacion) {
					if ( cotizacion.codigo === self.forecast.codigoPlan) {
						self.forecast.pmpm = cotizacion.valorTotal
					}
				});				
			}
			var ponderado = ((capitas * self.forecast.probExitoVenta * self.forecast.pmpm)/100).toFixed(2);
			var sinPonderar = (capitas * self.forecast.pmpm).toFixed(2);
			self.forecast.ponderado = self.changeDecimalSeparator(ponderado);
			self.forecast.sinPonderar = self.changeDecimalSeparator(sinPonderar);
		},

		actualizarForecast: function(){
			var self = this;
			self.forecast.probExitoVenta = $("#probExitoVenta").val();
			var ponderado = ((self.forecast.capitas * self.forecast.probExitoVenta * self.forecast.pmpm)/100).toFixed(2);;
			var sinPonderar = (self.forecast.capitas * self.forecast.pmpm).toFixed(2);
			self.context.forecast.ponderado = self.changeDecimalSeparator(ponderado);
			self.context.forecast.sinPonderar = self.changeDecimalSeparator(sinPonderar);
			$("#ponderado").val(self.forecast.ponderado);
		},

		convertToFloat: function(number){
			var x = number.split(',');
			return parseFloat(x[0].toString().replace(".", "") + "." + x[1]);	
		},

		convertForecastToMoney: function(successFunction){
			var self = this;
			$.each(self.processesDetail, function(index, processDetail) {
				if(processDetail.forecast && processDetail.forecast.ponderado){
					var ponderado = (processDetail.forecast.ponderado).toFixed(2);
					var sinPonderar = (processDetail.forecast.sinPonderar).toFixed(2);
					processDetail.forecast.ponderado = self.changeDecimalSeparator(ponderado);
					processDetail.forecast.sinPonderar = self.changeDecimalSeparator(sinPonderar);
				}
				
			});
			successFunction();
		},

		changeDecimalSeparator: function(number){
			var x = number.split('.');
			var despComa=x[1] === undefined ? '00':x[1];

			return x[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ',' + despComa;
		},
		
		initAttachmentControllerDetail: function (onFinish) {
			
			require(["/form-cotizaciones-individuales/js/libs/framework/views/app/attachments/attachmentController.js"], function (AttachmentController) {
				self.attachmentControllerDetail = new AttachmentController();
				self.attachmentControllerDetail.init(".viewAdjuntoPolizaNosmgBtn", "ExcepcionDetalle", null, true, onFinish);
			});
			
		},
		
		aplicarDescuento: function(){

			var self = this;
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

		buildDetalleCotizacion: function (onSuccess){
		
			var self = this; 
			//self.cotizacionProcessId = self.processDetail.detalleCotizacion.businessKey;
			if(self.processDetail.detalleCotizacion){
				//Cotizacion bpm
				self.cotizacion = self.processDetail.detalleCotizacion;
				self.integrantes = self.processDetail.detalleCotizacion.integrantes;
				onSuccess();
			}else{
				//Cotizacion Nobpm
				if(self.processDetail.cotizacion){
					var asyncFunctions = [];

					asyncFunctions.push(function (successFunction, context) {
						AjaxScreenLockUtil.lock();
						successFunction();
					});

					asyncFunctions.push(function (successFunction, context) {
						CotizadorUtil.obtenerCotizacion(self.processDetail.cotizacion.id, successFunction, context);
					});

					asyncFunctions.push(function (successFunction, context) {
						// Cargar zonas si se verifica que se debe realizar recotización por SMG
						if (context.detalleCotizacion && CotizadorUtil.verificarRecotizacionSMG(context.detalleCotizacion.integrantes)) {
							self.loadZonas(successFunction);
						} else {
							successFunction();
						}
					});

					asyncFunctions.push(function (successFunction, context) {
						//Recotización por SMG en casos donde existe una cotización previa y esta no fue realizada con SMG
						if(context.detalleCotizacion && CotizadorUtil.verificarRecotizacionSMG(context.detalleCotizacion.integrantes)){

							self.processDetail.detalleCotizacion = context.detalleCotizacion
			
							var solicitud = self.buildObjectCotizar();

							Util.blockBody();

							FuseService.crearProceso(
								solicitud,
								false,
								function(data) {
									self.cotizacionProcessId = data.jbpmProcess;
									self.cotizacion = eval(data.mapBodyResponseBundleEspecifico);
									if(data.mapBodyResponseBundleEspecifico && data.mapBodyResponseBundleEspecifico && !data.mapBodyResponseBundleEspecifico.cod_error){
										self.reCotizacionId  = self.cotizacion.cotizaciones[0].contactoId ? self.cotizacion.cotizaciones[0].contactoId : 0;
										self.idDeCotizacion = self.reCotizacionId;
									
									}
								},
								function(xhr, err) {
									Util.error('Sample of error data:', err);
									Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
									$("#div-form-3").empty();
									
									Util.unBlockBody();
								}						
							);
							if (self.cotizacion === undefined || self.cotizacion.cod_error == 2033) {
								$.gritter.add({
									title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
									text : 'Ha ocurrido un problema en Afilmed, por favor contacte al área de Planeamiento para su análisis.',
									class_name : 'gritter-warning'
								});
								Util.unBlockBody();
								if(self.cotizacion === undefined){
									return false;
								}
							} 
							self.saveTaskCotizar();
							successFunction();
						}else{
							successFunction();
						}
					});

					asyncFunctions.push(function (successFunction, context) {
						//Trae resultado de la recotizacion si se verifica que se realizó la recotización por SMG
						if (self.reCotizacionId) {
							CotizadorUtil.obtenerCotizacion(self.reCotizacionId, successFunction, context);
						} else {
							successFunction();
						}
					});
					
					asyncFunctions.push(function (successFunction, context) {
						if(context.detalleCotizacion){
							self.processDetail.detalleCotizacion = context.detalleCotizacion
							self.cotizacion = self.processDetail.detalleCotizacion;
							self.integrantes = self.processDetail.detalleCotizacion.integrantes;
						}
						successFunction();
					});

					asyncFunctions.push(function (successFunction, context) {
						AjaxScreenLockUtil.unlock();
						onSuccess();
						successFunction();
					});

					AsyncProcessor.process(asyncFunctions, {});
				}else{
					onSuccess();
				}
			}
		
		},

		sendEmail: function(generico, onSuccess){
			var self = this;
			var processId = generico.process.id;
			var action = $("#actions option:selected").val();

			if ( (action == "aCerradoSinVenta" || action == "aCerradoConVenta") && generico.rolUserIniciaTramite== 'SGI_PAS'){
				var subject = "";
				var observacionesMail = "";
				var subject = "SWISS MEDICAL ";
				var vtaTipo = "venta";
				vtaEstado = generico.estado.id === 5 ? "desestimada" : "realizada";
				var idProcess = processId; 
				if (generico.estado.id === 5) {
					subject = subject + idProcess + " - Desestimada";
					observacionesMail = "Motivo de rechazo: <b>" + $("#motivosCerradoSinVentaSelect option:selected").text() + "</b> <br/> <br/> Observaciones: <b>" + $("#observacion").val() + "</b><br/><br/>";
				} else {
					subject = subject + idProcess + " - Realizada";
					observacionesMail = "Observaciones: <b>" + $("#observacion").val() + "</b><br/><br/>";
				}

				var mailTo = null;
				var email = null;

				var asyncFunctions = [];

				var valorDocumento;

				if (self.prospecto.docTipo === 'PA') {
					valorDocumento = self.prospecto.pasaporte;
				} else {
					valorDocumento = self.prospecto.docNum;
				}
		
				asyncFunctions.push(function (successFunction, context) {
					PromotorService.getPromotorbyUsuarioRed(self.processesDetail[self.processesDetail.length-1].altaUsuario,true,
						function (data) {
							if(data.length > 0){
								context.email= data[0].email;
							}	
						},
						function (xhr,err) {
							Util.error( 'Sample of error data:', err );
							Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
						},
						function (data) {
							successFunction();
					});	
				});
				
				asyncFunctions.push(function( successFunction, context) {
					if (!context.email) {
						mailTo = "DVC@swissmedical.com.ar";
					} else {
						mailTo = context.email + ",DVC@swissmedical.com.ar";
					}

					context.mailJson = {
						"to": mailTo,
						"template": 'reserva-validacion-notif-sgi.htm',
						"subject": subject,
						"body": subject,
						custom: [
							{
								name: 'custom_nombre',
								value: self.processesDetail[self.processesDetail.length-1].usuario
							},
							{
								name: 'custom_prospecto',
								value: self.prospecto.apellido + ", " + self.prospecto.nombre
							},
							{
								name: 'custom_docTipo',
								value: self.prospecto.docTipo
							},
							{
								name: 'custom_du',
								value: valorDocumento
							},
							{
								name: 'custom_nroTramite',
								value: idProcess
							},
							{
								name: 'custom_fechaenvio',
								value: moment().format("DD/MM/YYYY")
							},
							{
								name: 'custom_tipo',
								value: vtaTipo
							},
							{
								name: 'custom_estado',
								value: vtaEstado
							},
							{
								name: 'custom_observaciones',
								value: observacionesMail
							}
						]
					};
					successFunction();
				});

				asyncFunctions.push(function( successFunction, context) {
					TerinService.sendTerinMailWithTemplate(context.mailJson, 
						function(data) {
							$.gritter.add({
								title : '<i class="icon-ok bigger-120"></i>&nbsp;Exito',
								text : 'El mail ha sido enviado',
								class_name : 'gritter-success'
							});
						}, function( xhr,err ) {
							Util.error( 'Sample of error data:', err );
							Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
							
							$.gritter.add({
								title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
								text : 'El mail no se pudo enviar',
								class_name : 'gritter-warning'
							});
							return false;
						},
						function (data) {
							successFunction();
							onSuccess();
					});
				});
				
				AsyncProcessor.process(asyncFunctions, {});

			}else{
				onSuccess();
			}
		},

		checkPlanes: function(){
			var count =0;
			
			var radios = $('*:checkbox');
			
			planesSeleccionados= "";
			
			for( var i=0; i < radios.length ; i++ ) {
					
				if( radios[i].checked ) {
					planesSeleccionados += radios[i].value + ",";
					count++;
				}
			}

			return count;
		},

		getCodigoProductor: function(successFunction){
			var self = this;

			for(var i=0;i<self.processesDetail.length;i++){
				if(self.processesDetail[i].esVentaAsistida == true && !(self.processesDetail[i].idEtapa===1)){
					self.processesDetail[i].vendedorCodigo = '-'
				}else{
					self.processesDetail[i].ocultarCodigo = false
					self.processesDetail[i].vendedorCodigo = 'mostrar'
				}
			}
			
			successFunction()
		},
		
		checkValidacionContactar: function () {
			var self = this;
			var valido = true;
			if (!this.validateTelefonos()) {
				valido = false;
			}
			if (!this.validateEmails()) {
				valido = false;
			}

			return valido;
		},

		renderListaExAfliadosTabDatoCargado: function () {
			var self = this;

			var target = this.$el.find('#listExAfiliadosTableContainer');
			var compiledTemplate = Handlebars.compile(ListaControlExAfiliados);
			
			target.empty();
			target.append(compiledTemplate({ context: self, hasExAfiliadosData: self.hasExAfiliadosData}));
		},
	
		renderListaExAfliados: function () {
			var self = this;

			var target = this.$el.find('#listExAfiliadoContainer');
			var compiledTemplate = Handlebars.compile(ListExAfiliadosTableFormulario);

			target.empty();
			target.append(compiledTemplate({ context: self, hasExAfiliadosData: self.hasExAfiliadosData }));
		},

		controlAfiliadosCheck: function (successFunction) {
			var self = this;

			if(self.processDetail && self.processDetail.condExAfi && self.processDetail.condExAfi.length > 0 ){
				bootbox.dialog("El o los DNIs ingresados presentan alguna situación bloqueante que se recomienda revisar para poder avanzar con el proceso de venta. Podés consultar el control desde esta pestaña “Formulario” o desde la pestaña “Datos Cargados”.", 
						[{
							"label" : "Aceptar",
							"class" : "btn-small btn-primary",
							"callback" : function() {
							}
						}]
					);
				return false;
			}
		},

		filtrarDetExAfiliados: function (successFunction) {
			var self = this;
      
			if (self.processDetail && self.processDetail.condExAfi) {
      
				var deudasPorDni = {};
				var isBloqueante=false;
				for (var i = 0; i < self.processDetail.condExAfi.length; i++) {
					var objeto = self.processDetail.condExAfi[i];
					if (!deudasPorDni[objeto.nro_doc]) {
						deudasPorDni[objeto.nro_doc] = 0;
					}
					deudasPorDni[objeto.nro_doc] += objeto.monto_notificado;
				}

				for (var i = 0; i < self.processDetail.condExAfi.length; i++) {
					var objeto = self.processDetail.condExAfi[i];
					
					if (objeto && objeto.monto_vig_config !== undefined && objeto.monto_notificado !== undefined) {
						var deudaTotalDni = deudasPorDni[objeto.nro_doc];

						if (objeto.monto_vig_config > objeto.monto_notificado && objeto.monto_vig_config > deudaTotalDni) {
							objeto.mensaje_monto = "La sumatoria de la deuda para este DNI NO es motivo bloqueante:<br> - Sumatoria de deuda: $"+self.changeDecimalSeparator(deudaTotalDni.toFixed(2)) +"<br>- Monto vigente configurado: $"+self.changeDecimalSeparator(objeto.monto_vig_config.toString());
							
							objeto.bloqueante = false;

						} else {
							objeto.mensaje_monto = "La sumatoria de la deuda para este DNI es motivo bloqueante por superar el monto tope configurado: <br> - Sumatoria de deuda: $"+ self.changeDecimalSeparator(deudaTotalDni.toFixed(2)) + "<br>- Monto vigente configurado: $"+ self.changeDecimalSeparator(objeto.monto_vig_config.toString());
							objeto.bloqueante = true;
							isBloqueante = true;
						}

						objeto.monto_notificado_format = objeto.monto_notificado != 0 ? self.changeDecimalSeparator(objeto.monto_notificado.toString()) : '0';
                        
					}
					
					var fechaActual = new Date();

					if (objeto.baja_fecha > fechaActual) {
						objeto.baja_futura = true;
					}

					if (objeto.situ_terapeuticas && objeto.situ_terapeuticas.length > 0) {
						self.procesarSituacionesTerapeuticas(objeto.situ_terapeuticas);
					}

					self.convertDatesToTimestamps(objeto, ['ingre_fecha', 'baja_fecha']);

					objeto.isBloqueante = self.validBloqueante(objeto);
					
					if (objeto.isBloqueante || objeto.bloqueante) {
						isBloqueante = true;
            
					}
          
				}

				var allNonBlockingNoDebt = !isBloqueante && Object.values(deudasPorDni).every(function(deuda) { return deuda === 0; });

				// Si hay datos de ex afiliados pero todos son no bloqueantes y sin deuda
				self.hasExAfiliadosData = (self.processDetail.condExAfi && self.processDetail.condExAfi.length > 0 && allNonBlockingNoDebt);

				for (var i = self.processDetail.condExAfi.length - 1; i >= 0; i--) {
					var objeto = self.processDetail.condExAfi[i];
					if (!objeto.isBloqueante && !objeto.bloqueante && !isBloqueante && objeto.monto_notificado === 0) {
						if (!self.hasExAfiliadosData) {
							self.processDetail.condExAfi.splice(i, 1);
						} else {
							self.processDetail.condExAfiAux = self.processDetail.condExAfiAux || [];
							self.processDetail.condExAfiAux.push(self.processDetail.condExAfi[i]);
							self.processDetail.condExAfi.splice(i, 1); 
						}
					}
				}
			} else {
				self.hasExAfiliadosData = false;
			}
			
			if(successFunction){
				successFunction();
			}

		},
		
		validBloqueante:function(objeto){

			if(objeto.bloqueante){
				return true;
			}

			if(objeto.deno_moti_baja === 'LEGALES'){
				return true;
			}

			if(!objeto.baja_fecha || objeto.baja_futura){
				return true;
			}

			if(objeto.situ_terapeuticas && objeto.situ_terapeuticas.length > 0){
				return true;
			}

			return false;
		},

		formatCondExAfi:function(condExAfi){
			var self=this;

			if(condExAfi && condExAfi.length > 0){
				for (var i = 0; i < condExAfi.length; i++) {
					var cond = condExAfi[i];
					if(cond.situ_terapeuticas && cond.situ_terapeuticas.length > 0){
						for (var j = 0; j < cond.situ_terapeuticas.length; j++) {
							var st = cond.situ_terapeuticas[j];
							if(st.sh_fecha_desde){
								st.sh_fecha_desde=self.formatDate(st.sh_fecha_desde);
							}
							if(st.sh_fecha_hasta){
								st.sh_fecha_hasta=self.formatDate(st.sh_fecha_hasta);
							}
						}
					}
				}	
			}

			return condExAfi;
		},

		formatDate:function(timestamp) {
			var date = new Date(timestamp);
		  
			var year = date.getUTCFullYear();
			var month = String(date.getUTCMonth() + 1).padStart(2, '0');
			var day = String(date.getUTCDate()).padStart(2, '0');
			var hours = String(date.getUTCHours()).padStart(2, '0');
			var minutes = String(date.getUTCMinutes()).padStart(2, '0');
			var seconds = String(date.getUTCSeconds()).padStart(2, '0');
			var milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
		  
			var formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+0000`;
		  
			return formattedDate;
		},
		
		convertDatesToTimestamps: function(objeto, dateProperties) {
			var self = this;
			for (var i = 0; i < dateProperties.length; i++) {
				var prop = dateProperties[i];
				if (objeto[prop] && self.isIsoDateString(objeto[prop])) {
					objeto[prop] = Date.parse(objeto[prop]);
				}
			}
		},
		
		isIsoDateString: function(dateString) {
			var isoDateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}$/;
			return isoDateFormat.test(dateString);
		},

		validDniGrupoFamiliar:function(){
			var self=this;
			var form =  $("#validation-form-retail");
			var solicitudCotizacion = ObjectSerializer.serializeObject(form).solicitudCotizacion;
			var valid=true;
			for (var i = 0; i < solicitudCotizacion.grupoFamiliar.length; i++) {
				if(solicitudCotizacion.grupoFamiliar[i].num_doc === ""){
					valid=false;
				}
			}

			return valid;
		},

		loadObrasSociales: function (successFunction) {
			var self = this;
            var version = 2;
			CotizadorUtil.loadObrasSociales(version, function (obrasSociales) {
				self.obrasSociales = obrasSociales;  
		
				if (successFunction) {
					successFunction();
				}
			});
		},
		
		showModalEnviarLink: function () {
			var self = this;

			PropertiesService.getProperty(
				'vsi.tool.asesores',
				false,
				function(data) {
					var url = data.value;
					var link = url + self.processDetail.vendedor + "/" + self.processDetail.vendedorCodigo + "/" + self.processId;
					self.link=link;
					if(self.link.responseOk){
						var compiledTemplate = Handlebars.compile(ModalLinkToolTemplate);
						$("#modal-link-asesores").html(compiledTemplate({ context: self, link: link.mensaje }));
						$("#modal-form-link-tool").modal("show");
						$(".modal-backdrop").remove();
					}else{
						bootbox.dialog("No es posible generar automáticamente el link del Tool de Asesores porque el usuario posee múltiples códigos de promotor asignados en Afilmed. Por favor, consulte a su supervisor para generarlo manualmente.", [{
							"label" : "OK",
							"class" : "btn-small",
							"callback": function() {
								$('#take-in').hide();
							}
							}]
						);
					}
					
				},
				function( xhr,err ) {
					Util.error('Error recuperando property para armar el link: ', err);
					Util.error("readyState:"+xhr.readyState+"\nstatus:"+xhr.status+"\nresponseText: "+xhr.responseText);
				}
			);
		},

		generarLink(url) {
			var self = this;
			var link={
				responseOk:true,
				mensaje:""
			};
			if(Session.getLocal("userName") === 'sgiasesor'){
				self.legajo = '28783';
			}
			EmpresasService.getInfoAsesorLegajo(self.legajo,false,
				function (asesor) {
					Util.debug("asesor", asesor);
					link.mensaje = url + Session.getLocal("userName") + "/" + asesor.codigoProductor.trim() + "/" + self.processId;
				},
				function (xhr, err, urlRest, typeCall) {
					link.responseOk=false;
					link.mensaje=url + "nombreUsuario/códigoAsesor/NroTramiteVSI";
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				function (data) {
				}
			);

			return link;
		},

		closeModalLinkTool: function(){
			$('#modal-form-link-tool').modal('hide');
		},

		copiarLinkTool: function() {
			var self = this;
			var $linkInput = $('#linkInput');
			$linkInput.select();
			document.execCommand('copy');
		},

		enviarToolPorWhatsapp: function() {
			var self = this;
			if(self.prospecto && self.prospecto.telefonos && self.prospecto.telefonos && self.prospecto.telefonos.length > 0){

				var validado = true;
				
				var teltipo = (self.prospecto.telefonos[0])?self.prospecto.telefonos[0].tipo_tele:null;
				var telpais = (self.prospecto.telefonos[0])?self.prospecto.telefonos[0].codigo_pais:null;
				var telNac = (self.prospecto.telefonos[0])?self.prospecto.telefonos[0].codigo_nacional:null;
				var telNum = (self.prospecto.telefonos[0])?self.prospecto.telefonos[0].numero:null;

				validado = Servicios.validarTelefono(teltipo,telpais,telNac,telNum);

				if(validado){
					var phone = telNum;				
					var urlTool = $('#linkInput').val(); 
					var mensaje = self.prospecto.nombre + " " + self.prospecto.apellido + ", para continuar con tu solicitud de alta, te comparto el link a nuestro formulario web para que puedas completar tus datos.";
					var mensajeCodificado = encodeURIComponent(mensaje) + "%0A" + urlTool + "%0A" + encodeURIComponent("Cualquier duda que tengas podés escribirme por este medio. ¡Gracias!");
					var url = "https://api.whatsapp.com/send?phone=" + phone + "&text=" + mensajeCodificado;
					window.open(url, '_blank');		
				}else{
					VentarRetailUtil.unblockScreen();
					VentarRetailUtil.alertMessage("El  n\u00FAmero ingresado no es v\u00E1lido", "warning", "exclamation-sign", "Atenci\u00F3n");
				}
				
			}
		},

		enviarToolPorMail: function () {
			var self = this;
			var prospectoEmail=self.prospecto.emails[0].denominacion;
			var subject = "Test envio mail Tool";

			
			var mailJson = {
				"to": prospectoEmail,
				"template": 'envio-link-tool-vsi.htm',
				"subject": subject,
				"body": subject,
				custom: [
					{
						name: 'custom_nombre',
						value: self.prospecto.nombre
					},
					{
						name:'custom_url',
						value:self.link.mensaje
					}
				]
			};

			TerinService.sendTerinMailWithTemplate(JSON.stringify(mailJson),
				function (data) {
					$.gritter.add({
						title: '<i class="icon-ok bigger-120"></i>&nbsp;Exito',
						text: 'Se ha enviado el mail correctamente.',
						class_name: 'gritter-success'
					});
				}, function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);

					$.gritter.add({
						title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
						text: 'El mail no se pudo enviar',
						class_name: 'gritter-warning'
					});
					return false;
				},
				function () {
				},
				false
			);
		},

		initializeDatepicker: function(inputNac) {
			if (!inputNac.prop('readonly') && !inputNac.data('datepicker-initialized')) {
				inputNac.datepicker({
					language: 'es',
					weekStart: 0,
					format: "dd/mm/yyyy",
					orientation: 'top top',
					autoHide: true,
				}).on('changeDate', function() {
					$(this).datepicker('hide');
				});
				inputNac.data('datepicker-initialized', true);
			}
		},
		
		destroyDatepicker: function(inputNac) {
			if (inputNac.data('datepicker')) {
				inputNac.datepicker('hide'); 
				inputNac.data('datepicker-initialized', false);
			}
		},
		
		verificarValidacion: function(event) {
			var self = this;
			var inputNac = $(event.target).closest('.inputNacimiento');
			if (inputNac.prop('readonly')) {
				event.preventDefault();
				self.destroyDatepicker(inputNac); 
				return false;
			} else {
				self.initializeDatepicker(inputNac); 
				inputNac.focus(); 
			}
		},

		loadZonas: function (successFunction) {
            var self = this;
            ProspectoService.findZonas(0, true,
                function (data) {
                    self.zonas = data;
                    successFunction();
                },
                function (xhr, err) {
                    self.onError(xhr, err, "las zonas");
                },
                function (data) {

                });
        },

		procesarSituacionesTerapeuticas: function(situacionesTerapeuticas) {
			var self = this;
			
			for (var v = 0; v < situacionesTerapeuticas.length; v++) {
				var situacion = situacionesTerapeuticas[v];
		
				if (situacion.st_situ && situacion.st_situ.length === 1) {
					[situacion.st_situ, situacion.st_deno] = [situacion.st_deno, situacion.st_situ];
				}
				
				self.convertDatesToTimestamps(situacion, ['sh_fecha_desde', 'sh_fecha_hasta']);
				
				if (Object.keys(situacion).length === 2 && 
					situacion.hasOwnProperty('stc_tipo_men') && 
					situacion.hasOwnProperty('stc_tipo_men_deno')) {
					situacionesTerapeuticas.splice(v, 1);
				}
			}
		}
	});

	return newView;
});