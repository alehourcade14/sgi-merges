define ([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	'/form-cotizaciones-individuales/js/libs/settings.js',
	'util',
	'session',
	'/form-smg-commons/js/libs/services/fuseService.js',
	'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/ventaRetail/formRetailTemplate.html',
	'/form-cotizaciones-individuales/js/libs/framework/views/util/ventaUtil.js',
	'/form-smg-commons/js/libs/asyncProcessor.js',
	'/form-smg-commons/js/libs/objectSerializer.js',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
	'/form-smg-commons/js/libs/prospectoUtil.js',
	'/form-smg-commons/js/libs/services/inboxService.js',
	'/form-smg-commons/js/libs/services/empresasService.js',
	'/form-cotizaciones-individuales/js/libs/framework/views/app/ventaRetail/paneles/panelDatosVenta.js',
	'/form-smg-commons/js/libs/services/afiliadoService.js',
	'/form-smg-commons/js/libs/services/loginService.js',
], function ($, _, Backbone, Handlebars, SettingsModel, Util, Session, FuseService, formTemplate, VentarRetailUtil,
	AsyncProcessor, ObjectSerializer, AjaxScreenLockUtil, ProspectoUtil, InboxService, EmpresasService, PanelDatosVenta,
	 AfiliadoService, LoginService){
	
	var prospectoIdRedir= null;
	
	var newView = Backbone.View.extend ({
		
		panelDatosVenta: null,
		
		events: {
			'change 	#tipoDeVta' 			: 'onChangeTipoVenta',
			'change 	#checkbox-life' 		: 'onChangeCheckboxLife',
			'change 	#checkbox-seguro' 		: 'onChangeCheckboxSeguro',
			'change 	#checkboxTipoSMGId' 	: 'onChangeTipoSMG',
			//'click 		.botonCargaDeArchivos'  : 'onShowModalCargarArchivos',
			'change 	#checkboxProductosActivosId'  : 'onChangeProductosActivos',
			'click		#btnGrabarDatosVenta'		  : 'onClickBtnGrabarDatosVenta',
			'blur		#fechaSeguros'				: 'validateDate',
			'blur		#fechaLife'					: 'validateDate',
			'blur		#fechaAseguradora'			: 'validateDate'
		},

		validateDate: function(){
			var self = this;
				
			var fechaSeguros = $("#fechaSeguros").val();
			var fechaLife = $("#fechaLife").val();
			var fechaAseguradora = $("#fechaAseguradora").val();

			if(!fechaAseguradora){
				var actualDate = moment();
				var validDateS = moment(fechaSeguros,"DD-MM-YYYY");
				var validDateL = moment(fechaLife,"DD-MM-YYYY");
		
				if(validDateS > actualDate || validDateL > actualDate){
					
					$.gritter.add({
						title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text: 'La fecha ingresada debe ser menor o igual a la fecha actual.',
						class_name: 'gritter-error'
					});
				}
			}else{
				var actualDate = moment();
				var validDateA = moment(fechaAseguradora,"DD-MM-YYYY");
		
				if(validDateA > actualDate ){
					$.gritter.add({
						title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text: 'La fecha ingresada debe ser menor o igual a la fecha actual.',
						class_name: 'gritter-error'
					});
				}
			}
			
			

		},
		
		getWorkContext: function () {
			
			var self = this; 
			
			self.rolesDeUsuario = Session.getLocal("roles");
			self.rolesDeUsuario = self.rolesDeUsuario.split(",");
			self.worContextUsuario = 'AMB_COMERCIAL';
			
			$.ajax({
				type: "GET" ,
				url: "/form-cotizaciones-individuales/workContextPorRol.json?date="+new Date().getTime(),
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
		
		buildObject: function (atencionProspecto) {
			var self = this;

			var finalObject = ObjectSerializer.serializeObject(self.getForm());
			var actorId = Session.getLocal("userId");
			var user = Session.getLocal("userName");
			var userName = Util.getUserNameComplete(Session.getLocal("userId"));
			var userInformation = self.getUserInformation(user);
			var detalle = "";
			var actorIdSelected = $("#selAsesorId option:selected");
			var tipoDeVentaSeleccionado = $("#tipoDeVta option:selected");

			var completaProspecto = "false";
			if (atencionProspecto) {
				completaProspecto = "true"
			}

			finalObject.assignment = {};
			finalObject.assignment.actorId = actorId;

			finalObject.prospecto = self.prospecto;
			finalObject.user = {};
			finalObject.user.id = actorId;
			finalObject.user.userName = userName;
			finalObject.user.user = user;

			detalle = this.prospecto.apellido + "," + this.prospecto.nombre + " - " + this.prospecto.docTipo + "-" + this.prospecto.docNum;
			
			finalObject.process = {
				variables: {
					workContext: self.getWorkContext(),
					processInfo: {
						id: "0",
						name: "Venta Salud Individuos",
						description: "Venta Salud Individuos",
						credencial: self.entityPrefix + self.entityId,
						registradoUsuario: user,
						registradoNombre: finalObject.user.id,
						detalle: detalle
					},
					finalizado: "false",
					action: 'aContactar',
					completaProspecto: completaProspecto, // es para saber si se completa el prospecto o no
					processOwner: user,
					processOwner: finalObject.user.id,
					actorId: actorId
				},
				id: null,
				processId: null,
				key: null,
				start: new Date().getTime(),
				version: "1",
				processName: "Venta Salud Individuos",
				detalle: detalle,
				credencial: self.entityPrefix + self.entityId,
				workContext: self.getWorkContext()
			};

			var medio = ProspectoUtil.getMedioPorUserTipo() == undefined ? 14 : ProspectoUtil.getMedioPorUserTipo();

			if (atencionProspecto) {
				medio = 4;
			}

			finalObject.medio = {
				id: medio,
				numero: null
			};

			finalObject.sucursal = {};
			finalObject.sucursal.id = Session.getLocal("subsidiary");
			finalObject.canalOrigen = {};
			finalObject.canalOrigen.id = 2; // SGI
			finalObject.canalOrigen.subCanal = Session.getLocal("subsidiary");

			finalObject.vendedorAsignado = user;
			finalObject.vendedorNombre = self.getVendedorNombre(userName, userInformation);

			if(tipoDeVentaSeleccionado.text() === "Asistida" && actorIdSelected.val()!= ""){
				finalObject.vendedorAsignado = actorIdSelected.data("user-name");
				finalObject.vendedorNombre = actorIdSelected.data("nombre") + " " +actorIdSelected.data("apellido");
			}
			
			finalObject.estado = {};
			finalObject.estado.id = 1;
			finalObject.motivo = {};
			finalObject.motivo.id = 0;
			finalObject.credencial = self.entityPrefix + self.entityId;
			
			if( Util.hasRole('SGI_PAS') || Util.hasRole('SGI_BROKER') || Util.hasRole('SGI_ASESOR_FFVV') ) {
				// se setea el codigo de productor o del broker o del asesor
				var vendedor = self.getDatosVendedor();
				finalObject.vendedorCodigo = vendedor.productor && vendedor.productor.codigoProductor != null && vendedor.productor.codigoProductor != "" ? $.trim(vendedor.productor.codigoProductor) : "";

				if(Util.hasRole('SGI_BROKER') ) {
					finalObject.datosVenta = {};
					finalObject.datosVenta.tipo =  1;	//Tipo Directa
					finalObject.datosVenta.codigoVendedor = {};
					finalObject.datosVenta.codigoVendedor.broker = finalObject.vendedorCodigo;
				}
			}
			
			finalObject.esVentaAsistida = false;
			
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
		
		save: function (atencionProspecto) {
			var self = this;

			VentarRetailUtil.showLoadingBubble($(self.target));
			var serializedObject = self.buildObject();

			FuseService.crearProceso(serializedObject, true, function (data) {
				var processInstance = data;
				VentarRetailUtil.hideLoadingBubble($(self.target));
				self.reAbrirTramite(processInstance.jbpmProcess);
				/*
				bootbox.dialog("Se gener&oacute; el n&uacute;mero de Tr&aacute;mite #" + processInstance.jbpmProcess, [{
					"label": "Aceptar",
					"class": "btn-small btn-success",
					"callback": function () {
						window.top.location.href = SettingsModel.get("remove_tab_url") + 1003;
					}
				}]);
				*/

			}, function (xhr, err) {
				Util.error("Sample of error data:", err);
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				VentarRetailUtil.alertMessage("No se pudo grabar el llamado", "warning", "exclamation-sign", "Atenci\u00F3n");
			}, function () {});
			
		},

		list: function (id, idSubmotive,atencionProspecto) {
			var self = this;

			self.target = "#content1";
			$(self.target).empty();
			$(self.target).append(this.render().el);
			// Inicializo componentes
			self.initView(atencionProspecto);

		},

		initView: function (atencionProspecto) {
			var self = this;

			var asyncFunctions = [];

			asyncFunctions.push(function (successFunction, context) {
				AjaxScreenLockUtil.lock();
				successFunction();
			});

			asyncFunctions.push(function (successFunction, context) {
				self.initEntity(successFunction);
			});

			asyncFunctions.push(function (successFunction, context) {
				self.validarAfiliado(successFunction);
			});

			asyncFunctions.push(function (successFunction, context) {
				
				context.trataDeIniciarSinDatosVenta = false;
				
				if(atencionProspecto){
					self.saveAtencionProspecto(successFunction,atencionProspecto);
				}else{
					if(!Util.hasRole('SGI_PAS')) {
						self.initQuestionVenta(successFunction);
					} else {
						//self.renderDatosVenta(successFunction);
						context.trataDeIniciarSinDatosVenta = true;
						self.panelDatosVenta = new PanelDatosVenta({ id : "TEST"});
						
						self.panelDatosVenta.provinciaProspecto = self.prospecto.domicilio.provincia;
						self.panelDatosVenta.partidoProspecto   = self.prospecto.domicilio.partido;
						self.panelDatosVenta.localidadProspecto = self.prospecto.domicilio.localidad;
						
						$("#tituloFormTemplate").html("Carga Inicial - Datos de Venta");
						
						self.panelDatosVenta.initDatosVenta(successFunction);
					}
				}
				
			});
			
			asyncFunctions.push(function(successFunction, context) {
				if(context.trataDeIniciarSinDatosVenta){
					self.initAttachmentControllerDetail(successFunction);					
				} else {
					successFunction();
				}
			});
			
			asyncFunctions.push(function (onSuccess, context) {
				AjaxScreenLockUtil.unlock();
				onSuccess();
			});

			AsyncProcessor.process(asyncFunctions, {});
		},
		
		initAttachmentControllerDetail: function (onFinish) {
			var self = this;
			require(["/form-cotizaciones-individuales/js/libs/framework/views/app/attachments/attachmentController.js"], function (AttachmentController) {
				self.attachmentControllerDetail = new AttachmentController();
				self.attachmentControllerDetail.init(".botonCargaDeArchivos", "DatosVentaDetalle", null, false, onFinish);
				
				self.panelDatosVenta.attachmentController = self.attachmentControllerDetail;
				
			});
		},
		
		onChangeTipoVenta: function() {
			var self = this;
			self.panelDatosVenta.changeTipoVenta();
		},
		
		onChangeCheckboxLife: function() {
			var self = this;
			self.panelDatosVenta.changeCheckboxLife();
		},
		
		onChangeCheckboxSeguro: function() {	
			var self = this;
			self.panelDatosVenta.changeCheckboxSeguro();
		},
		
		onChangeTipoSMG: function() {	
			var self = this;
			self.panelDatosVenta.changeTipoSMG();
		},
		
		onShowModalCargarArchivos: function() {
			var self = this;
			self.panelDatosVenta.showModalCargarArchivos();
		},
		
		onChangeProductosActivos: function() {
			var self = this;
			self.panelDatosVenta.changeProductosActivos();
		},
		
		onClickBtnGrabarDatosVenta: function() {
			var self = this;
			var datosVentaBuildObject = self.panelDatosVenta.saveDatosVenta();
			
			if( datosVentaBuildObject && datosVentaBuildObject != null ) {
				
				VentarRetailUtil.showLoadingBubble($(self.target));
				var serializedObject = self.buildObject();
				
				serializedObject.datosVenta = datosVentaBuildObject.datosVenta;
				
				serializedObject.rolUserIniciaTramite = datosVentaBuildObject.rolUserIniciaTramite;	
				serializedObject.codigoAsesor = datosVentaBuildObject.codigoAsesor;
				serializedObject.codigoBroker = datosVentaBuildObject.codigoBroker;
				serializedObject.esVentaAsistida = datosVentaBuildObject.esVentaAsistida;
				serializedObject.vendedorAsignado = datosVentaBuildObject.vendedorAsignado;
				serializedObject.vendedorNombre = datosVentaBuildObject.vendedorNombre;
				serializedObject.vendedorCodigo = datosVentaBuildObject.vendedorCodigo;
				serializedObject.observacion = datosVentaBuildObject.observacion;

				serializedObject.datosVenta.codigoVendedor = {};

				if( Util.hasRole('SGI_PAS') ) {
					serializedObject.datosVenta.codigoVendedor.pas = serializedObject.vendedorCodigo;
				}else{
					serializedObject.datosVenta.codigoVendedor.broker = serializedObject.vendedorCodigo;
				}
				//
				//Cuando es venta asistida SIEMPRE se debe derivar el tramite a un Asesor, ya sea el que se seleccione o el que corresponda, 
				//de acuerdo a la Provincia-Partido-Localidad.
				//NUNCA deberia quedar asignado al PAS, la unica forma de que el tramite quede asignado al Pas es cuando selecciona Tipo de Venta=DIRECTA.
				
				
				serializedObject.assignment = datosVentaBuildObject.assignment;
				
				serializedObject.user.id 		= datosVentaBuildObject.user.id;
				serializedObject.user.userName 	= datosVentaBuildObject.user.userName;
				serializedObject.user.user		= datosVentaBuildObject.user.user;
				
				serializedObject.process.variables.workContext = datosVentaBuildObject.process.variables.workContext;
				
				if(datosVentaBuildObject.canal) {
					serializedObject.canal = datosVentaBuildObject.canal;
				}
				
				
				if(datosVentaBuildObject.rudiFiles) {
					serializedObject.rudiFiles = datosVentaBuildObject.rudiFiles;					
				}
				
				if(!datosVentaBuildObject.esVentaAsistida) {
					FuseService.crearProceso(serializedObject, true, function (data) {
						var processInstance = data;
						VentarRetailUtil.hideLoadingBubble($(self.target));
						self.reAbrirTramite(processInstance.jbpmProcess);

					}, function (xhr, err) {
						Util.error("Sample of error data:", err);
						Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						VentarRetailUtil.alertMessage("No se pudo grabar el llamado", "warning", "exclamation-sign", "Atenci\u00F3n");
					}, function () {});
				} else {
					
					prospectoIdRedir= serializedObject.prospecto;
					
					FuseService.crearProceso(serializedObject, true, function (data) {
						var processInstance = data;
						VentarRetailUtil.hideLoadingBubble($(self.target));
						
						bootbox.dialog("Se gener&oacute; el n&uacute;mero de Tr&aacute;mite #" + processInstance.jbpmProcess, [{
							"label": "Aceptar",
							"class": "btn-small btn-success",
							"callback": function () {
								
								//Si es Tipo de Venta=Asistida, el numero de tramite debe mostrarse en pantalla y al presionar "Aceptar", 
								//direccionarse al detalle del prospecto, no abrirlo.
								
								var removeTabUrl = SettingsModel.get("remove_tab_url")+"1003";
								window.top.location.href= removeTabUrl;
							}
						}]);
						
					}, function (xhr, err) {
						Util.error("Sample of error data:", err);
						Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						VentarRetailUtil.alertMessage("No se pudo grabar el llamado", "warning", "exclamation-sign", "Atenci\u00F3n");
					}, function () {});
				}
			}
		},
		
		initEntity: function (successFunction) {
			var self = this;
			self.prospecto = $.parseJSON(Session.getLocal("Entity"));
			self.entityPrefix = "PRO-";
			self.entityId = self.prospecto.pk.idProsp;
			successFunction();
		},

		validarAfiliado: function (successFunction) {
			var self = this;

			self.afiliadoExistente = self.checkAfiliadoExistente( self.prospecto.docTipo, self.prospecto.docNum );

			if(self.afiliadoExistente !== null){
				if(Util.hasRole('OV_USU_EXTERNO')){
					bootbox.dialog("El prospecto " + self.afiliadoExistente.nombreCompleto + " ya es cliente SMMP o tiene una baja menor a 6 meses.", [{
						"label" : "OK",
						"class" : "btn-small",
						"callback": function() {
							window.top.location.href = SettingsModel.get("remove_tab_url") + 1003;
						}
						}]
					);
				}else{
					bootbox.dialog("El prospecto " + self.afiliadoExistente.nombreCompleto + " ya es cliente SMMP o tiene una baja menor a 6 meses, desea continuar su recepci&oacute;n?", 
						[{
								"label": "Si",
								"class": "btn-small btn-primary",
								"callback": function () {
									window.parent.navigateAfiliadoView(self.afiliadoExistente);
								}
							}, {
							"label" : "No",
							"class" : "btn-small",
							"callback" : function() {
								window.top.location.href = SettingsModel.get("remove_tab_url") + 1003;
							}
						}]
					);
				}
			}

			successFunction();
		},

		initQuestionVenta: function (successFunction) {
			var self = this;

			if(self.afiliadoExistente === null){
				bootbox.dialog("Se generar&aacute; el tr&aacute;mite de venta", [{
					"label": "Aceptar",
					"class": "btn-small btn-primary",
					"callback": function () {
						self.save();
					}
				}, {
					"label": "Cancelar",
					"class": "btn-small",
					"callback": function () {
						window.top.location.href = SettingsModel.get("remove_tab_url") + 1003;
					}
				}]);
			}

			successFunction();
		},
		
		// Render method.
		render: function () {
			var self = this;
			var compiledTemplate = Handlebars.compile(formTemplate);

			this.$el.html(compiledTemplate({
				context: self
			}));

			return this;
		},

		getForm: function () {
			var self = this;
			var form = $("#validation-form-retail");

			return form;
		},

		reAbrirTramite: function (jbpmProcess) {
			var getTasks = InboxService.getTaskByProccessId(jbpmProcess);
			var tasks = new Array();
			tasks.push(getTasks[0].id.toString())
			Session.setLocal('tasks', JSON.stringify(tasks));
			Session.setLocal('typeOpenTask', 'edit');
			Session.setLocal('backTo', "inboxMyTask");
			var removeTabUrl = SettingsModel.get("open_task");
			window.top.location.href = removeTabUrl;
		},

		saveAtencionProspecto: function (successFunction,atencionProspecto) {
			var self = this;

			VentarRetailUtil.showLoadingBubble($(self.target));
			var serializedObject = self.buildObject(atencionProspecto);

			FuseService.crearProceso(serializedObject, true, function (data) {
				var processInstance = data;
				VentarRetailUtil.hideLoadingBubble($(self.target));
				
				bootbox.dialog("Se gener&oacute; el n&uacute;mero de Tr&aacute;mite #" + processInstance.jbpmProcess, [{
					"label": "Aceptar",
					"class": "btn-small btn-success",
					"callback": function () {
						self.reAbrirTramite(processInstance.jbpmProcess);
					}
				}]);

			}, function (xhr, err) {
				Util.error("Sample of error data:", err);
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				VentarRetailUtil.alertMessage("No se pudo grabar el llamado", "warning", "exclamation-sign", "Atenci\u00F3n");
			}, function () {});

		},

		checkAfiliadoExistente: function( tipoDoc, numero ) {
			var self = this;
			
			var afiliados = AfiliadoService.getCustomerByDUyOmitirPrepagas( numero, tipoDoc, '4,9,10,11' );
			
			var lastFind = {
				typeEntity: "afiliado",
				 list: afiliados
			};
	
			Session.setLocal("lastFind", JSON.stringify(lastFind));
			
			if ( afiliados === null || afiliados === undefined || afiliados.length === 0 ) {
				return null;
			}
			
			var afiliado = afiliados.find(function(afiliado) {
				return afiliado.fechaBaja === null;
			});
			
			if ( afiliado === undefined ) {
				var today = new Date();
				var sixMonthsAgo = new Date(new Date(today).setMonth(today.getMonth()-6));
				
				afiliado = afiliados.find(function(afiliado) {
					return ( new Date(afiliado.fechaBaja) ) >= sixMonthsAgo;
				});
			}
			
			if ( afiliado === undefined ) {
				return null;
			}
	
			return afiliado;
		},

		getUserInformation: function(userName) {
		
			var self = this;
			self.userAltaUserInformation = "";
			self.ventaSaludIndidividuosCodigoUser = "";
			LoginService.userInformation(userName,false,
				function(data){
					self.userAltaUserInformation = data;
					self.ventaSaludIndidividuosCodigoUser = "" + data.legajo;
				},
				function(){        	
				},
				function(){     	
				});
			
			return self.userAltaUserInformation;
		},

		getVendedorNombre: function (userName, userInformation){

			var nombreCompleto = userName;
			if(userInformation && userInformation.apellido != "" && userInformation.nombre != ""){
				nombreCompleto = userInformation.nombre + " " + userInformation.apellido;
			}
	
			return nombreCompleto;
		}

	});

	return newView;
});