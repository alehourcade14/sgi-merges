define ([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	'bootstrap',
	'ace',
	'encoding',
	'libs/settings',
	'inboxService',
	'/form-smg-commons/js/libs/services/fuseService.js',
	'libs/framework/views/util/ventaUtil',
	'libs/framework/views/util/viewConfiguration',
	'/form-smg-commons/js/libs/asyncProcessor.js',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
	'util',
	'text!libs/framework/templates/app/ventaRetail/formShowRetailTemplate.html',
	'text!libs/framework/templates/app/ventaRetail/taskDetailRetailTemplate.html',
	'text!libs/framework/templates/app/taskDetailIntegrantesTemplate.html',
	'text!libs/framework/templates/app/ventaRetail/taskDetailRetailPlanesTemplate.html',
	'text!libs/framework/templates/app/taskNotFoundTemplate.html',
	'/form-smg-commons/js/libs/services/loginService.js',
	'session',
	'text!libs/framework/templates/app/ventaRetail/taskFallaDetailRetailTemplate.html',
	'text!libs/framework/templates/app/ventaRetail/paneles/listExAfiliadosTable.html',
    '/form-smg-commons/js/libs/services/obraSocialService.js',
	'libs/framework/views/app/ventaRetail/util/cotizadorUtil'
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, InboxService, FuseService,
			VentarRetailUtil, ViewConfiguration, AsyncProcessor, AjaxScreenLockUtil, Util, formShowTemplate, 
			taskDetailTemplate, taskDetailIntegrantesTemplate, taskDetailPlanesTemplate,
			taskNotFoundTemplate, LoginService, Session, taskFallaDetailRetailTemplate, 
			ListaControlExAfiliados,ObraSocialService,CotizadorUtil) {

	var idProcess;
	var processTypes;
	var id;
	var motive;
	var encontrado = false;
	var finalize,submotive = false;
	var tasks = null;
	var workflowId;
	var process = null;
	var processesDetail;
	var processDetail;
	var processDetailFalla;
	
	var newView = Backbone.View.extend ({
		
		motivosRechazo: [{"id": 1, "descripcion": "Sin cobertura en la zona"}, {"id": 2, "descripcion": "Zona peligrosa"}, {"id": 3, "descripcion": "Otros"}],
		motivosNoVenta: [{"id": 1, "descripcion": "Precio"}, {"id": 2, "descripcion": "Producto"}, {"id": 3, "descripcion": "Falta de interes"}],
		tiposCotizacion: [{"id": 1, "descripcion": "Nueva AP"}, {"id": 2, "descripcion": "Apertura Sucursal"}, {"id": 3, "descripcion": "Licitacion AP"}],
		switchOptions: [{id: 0, value: "NO"}, {id: 1, value: "SI"}],
		
		events: {
			'click 			 #btnCloseTask'						: 'closeTask',
			'click 			 #btnPrintTask'						: 'onClickBtnPrintTask',
			'closeModalRudi  .btnCloseModalRUDI'				: 'closeModalRudi'
		},
		
		closeTask: function () {
			window.top.location.href= SettingsModel.get("open_task");
		},
		
		getEjecutivo: function(onComplete) {
			var self = this;
			
			LoginService.userInformation(self.ventaEccoAP.user.username, true, 
                function( ejecutivo ){
                    self.ejecutivo = ejecutivo;
                },
                function( xhr, err ){
                    Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
                },
                function(){
                	onComplete();
                }
            );
		},
		
		closeModalRudi: function () {
			//$("#campaniaModal").empty();
			$("#RUDIModal").modal("hide");
		},
		
		initAttachmentControllerDetail: function (onFinish) {
			var self = this;
			require(["/form-cotizaciones-individuales/js/libs/framework/views/app/attachments/attachmentController.js"], function (AttachmentController) {
				self.attachmentControllerDetail = new AttachmentController();
				self.attachmentControllerDetail.init(".viewAdjuntoPolizaNosmgBtn", "ExcepcionDetalle", null, true, onFinish);
			});
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

		getCotizacion: function (onSuccess) {
			var self = this;
			CotizadorUtil.obtenerCotizacion(self.processDetail.cotizacion.id, onSuccess, self);
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
							encontrado = true;
							processNameJBPM = processTypes[i].processNameJBPM;
							self.tasksConfig = processTypes[i].tasks;
							for (var x = 0; x < self.tasksConfig.length; x++) {
								if (self.tasksConfig[x].taskName === self.task.name) {
									self.task.actions = self.tasksConfig[x].actions;
									
									self.task.config = self.tasksConfig[x];
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

		list: function (taskId,processId){

			
			var self = this;
			
			self.userId = Session.getLocal("userId");
			self.taskId = parseInt(taskId);
			self.processId = processId;
			
			processDetailFalla = false;
			
			FuseService.getDetallePorProcessId(self.processId, false, 
					function () {}, 
					function (xhr, error) {
						processDetailFalla = true;
					},
					function () {});
			
			
					if(!processDetailFalla) {
						self.initView();
					} else {
						self.task = {};
						self.task.processId = "#"+self.processId;
						
						self.task.processName = "Venta Salud Individuos";
						self.task.name = "Contactar";
						
						$("#content1").empty();
						$("#content1").append(self.renderProcessDetailFalla().el);
					}			
		},
		
		initView: function() {
			var self = this;
			
			var asyncFunctions = [];
			
			asyncFunctions.push(function(successFunction, context) {
				AjaxScreenLockUtil.lock();
                successFunction();
			});
			
			
			asyncFunctions.push(function(successFunction, context) {
				self.validacionYCargaDeDatosInicial(successFunction);
			});
			
			asyncFunctions.push(function(successFunction, context) {
				self.getMotivosRetail(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {
				self.getProcessConfiguration(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {
				self.loadObrasSociales(successFunction);
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
				self.getCodigoProductor(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {
				self.initEntity(successFunction);
			});
			
			asyncFunctions.push(function(successFunction, context) {
				self.renderEntityDetailTab(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.getDocumentacionFaltante(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.getContacto(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.getAseguradoras(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.getCotizacion(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {			
				self.convertForecastToMoney(successFunction);
			});

			asyncFunctions.push(function(successFunction, context) {		
				self.filtrarDetExAfiliados(successFunction);
			});
			
			asyncFunctions.push(function(successFunction, context) {
				$("#content1").empty();
				$("#content1").append(self.render().el);
				successFunction()
			});
			
			
			asyncFunctions.push(function(successFunction, context) {
				self.initAttachmentControllerDetail(successFunction);
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
				view.list(objetoForzadoPorDetalleProspecto, target, true);
				self.prospecto = view.getProspecto();
				if(self.prospecto.docTipo=="PA"){
					self.prospecto.docNum = self.prospecto.pasaporte.replace(/\D/g,'');
				}
				self.entity = self.prospecto;
				self.entity.empresas = $.parseJSON(Session.getLocal("empresasAsociadas"));
				self.empresasDomicilio = $.parseJSON(Session.getLocal("empresasAsociadas"));
				self.detalleProspecto = true;
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
		
		// ========================== /INIT'S================================== //

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

		// Render method.
		render: function () {
			var self = this;
			var compiledTemplate = Handlebars.compile(formShowTemplate);
			var subPageTemplate = Handlebars.compile(taskDetailTemplate);
			var compiledIntegTemplate = Handlebars.compile(taskDetailIntegrantesTemplate);
			var compiledPlanesTemplate = Handlebars.compile(taskDetailPlanesTemplate)
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
			self.titular=self.buildTitular(self.processDetail);

			if(self.detalleCotizacion){
				self.ultimaCotizacion=self.processCoticacion(self.detalleCotizacion);
			}
			
			this.$el.find('#processDetail').html(subPageTemplate({ context: self }));
			if(self.processDetail.condExAfi){
				self.renderListaExAfliados();
			}
			//self.armarCotizacion()
			//$("#cotizacionIntegrante"+this.processDetail.idEtapa).empty ();
		    //$("#cotizacionIntegrante"+this.processDetail.idEtapa).append (compiledIntegTemplate({integrantes: this.integrantes}));
			//$("#cotizacionPlanes"+this.processDetail.idEtapa).empty ();
			//$("#cotizacionPlanes"+this.processDetail.idEtapa).append (compiledPlanesTemplate({cotizaciones: this.cotizaciones, vtaPuraPlan: this.processDetail}));
			return this;
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
					if (integrante.cond_afi <= 0 ) {
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

		processCoticacion:function(detalleCotizacion){
			var self=this;
			self.detalleCotizacion.planesSeleccionados = [];
			self.detalleCotizacion.fecha=self.processDetail.altaFecha;
			self.detalleCotizacion.tarea=self.processDetail.tarea.descripcion;
			var planesSelected = self.processDetail.planVenta? self.processDetail.planVenta.split(",") : [];
			planesSelected.length > 1? planesSelected.pop() : null;

			$.each(detalleCotizacion.planes, function (key, plan) {
				if (planesSelected.includes(plan.codigo) || planesSelected.includes(plan.PLAN_OS)) {
					plan.valorTotalString=self.changeDecimalSeparator(plan.valorTotalPlan.toString());
					self.detalleCotizacion.planesSeleccionados.push(plan);
				}
			});

			detalleCotizacion.integrantes.forEach(function(integrante) {
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

			return detalleCotizacion;
		},
		renderProcessDetailFalla: function () {
			
			var self = this;
			var compiledTemplate = Handlebars.compile(formShowTemplate);
			var subPageTemplate = Handlebars.compile(taskFallaDetailRetailTemplate);
			
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
			this.$el.find('#processDetail').html(subPageTemplate({ context: self }));
			
			return this;
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
		
		printPDF: function() {
			var self = this;
			
			PDFHandler.printPDF(self, 
				function(pdf) {
					$("#modal-form-show").modal("show");
					$('#iframeShow').attr('src', pdf);
	
					var elemToChange = document.getElementById("iframeShow");
					elemToChange.style.height = $(window).height() - 200 + "px";
				},
				function(err) {
					VentarRetailUtil.alertMessage("Hubo un error al generar el pdf", "warning", "exclamation-sign", "Atenci\u00F3n");
					Util.error("Error al generar el pdf: ", err)
				}
			);
		},
		
		onClickBtnPrintTask: function(e) {
			var self = this;
			self.printPDF();
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

		aplicarDescuento:function(){

			var self = this
			var primerProceso;
			
			for(var i=0;i<self.processesDetail.length;i++){
				if(self.processesDetail[i].idEtapa===1){
					primerProceso=self.processesDetail[i];
					break;
				}
			}

			var aplicarDescuento = false;
			if(primerProceso['poliza_smg_seg'] != null || primerProceso['poliza_smg_life'] != null){
				aplicarDescuento = true;
			}
			return aplicarDescuento;
		},

		convertForecastToMoney: function(successFunction){
			var self = this;
			$.each(self.processesDetail, function(index, processDetail) {
				if(processDetail.forecast){
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

		renderListaExAfliados: function () {
			var self = this;

			var target = this.$el.find('#listExAfiliadosTableContainer');
			
			var compiledTemplate = Handlebars.compile(ListaControlExAfiliados);
			target.empty();

			target.append(compiledTemplate({ context: self, hasExAfiliadosData: self.hasExAfiliadosData }));
		},

		filtrarDetExAfiliados: function (successFunction) {
			var self = this;
			if (self.detalle && self.detalle.condExAfi) {
				var deudasPorDni = {};
				var isBloqueante=false;
				for (var i = 0; i < self.detalle.condExAfi.length; i++) {
					var objeto = self.detalle.condExAfi[i];
					if (!deudasPorDni[objeto.nro_doc]) {
						deudasPorDni[objeto.nro_doc] = 0;
					}
					deudasPorDni[objeto.nro_doc] += objeto.monto_notificado;
				}

				for (var i = 0; i < self.detalle.condExAfi.length; i++) {
					var objeto = self.detalle.condExAfi[i];
					if (objeto && objeto.alta_fecha && objeto.monto_vig_config !== undefined && objeto.monto_notificado !== undefined) {
						var fechaOriginal = new Date(objeto.alta_fecha);
						var anioNuevo = fechaOriginal.getFullYear();
						var mesNuevo = ('0' + (fechaOriginal.getMonth() + 1)).slice(-2);
						var diaNuevo = ('0' + fechaOriginal.getDate()).slice(-2);

						var fechaNueva = anioNuevo + '-' + mesNuevo + '-' + diaNuevo;

						var deudaTotalDni = deudasPorDni[objeto.nro_doc];

						if (objeto.monto_vig_config > objeto.monto_notificado && objeto.monto_vig_config > deudaTotalDni) {
							objeto.mensaje_monto = "La sumatoria de la deuda para este DNI NO es motivo bloqueante:<br> - Sumatoria de deuda: $"+self.changeDecimalSeparator(deudaTotalDni.toFixed(2)) +"<br>- Monto vigente configurado: $"+self.changeDecimalSeparator(objeto.monto_vig_config.toString());
							
							objeto.bloqueante = false;

						} else {
							objeto.mensaje_monto = "La sumatoria de la deuda para este DNI es motivo bloqueante por superar el monto tope configurado: <br> - Sumatoria de deuda: $"+ self.changeDecimalSeparator(deudaTotalDni.toFixed(2)) + "<br>- Monto vigente configurado: $"+ self.changeDecimalSeparator(objeto.monto_vig_config.toString());
							objeto.bloqueante = true;
							isBloqueante = true;
						}

						if (objeto.monto_notificado != 0) {
							objeto.monto_notificado_format = self.changeDecimalSeparator(objeto.monto_notificado.toString());
						} else {
							objeto.monto_notificado_format = '0';
						}
						// objeto.monto_vig_config = self.changeDecimalSeparator(objeto.monto_vig_config.toString());
					}
					var fechaActual = new Date();

					if (objeto.baja_fecha > fechaActual) {
						objeto.baja_futura = true;
					}

					objeto.isBloqueante = self.validBloqueante(objeto);
					
					if (objeto.isBloqueante || objeto.bloqueante) {
						isBloqueante = true;
					}
				}

				var allNonBlockingNoDebt = !isBloqueante && Object.values(deudasPorDni).every(function(deuda) { return deuda === 0; });

				// Si hay datos de ex afiliados pero todos son no bloqueantes y sin deuda
				self.hasExAfiliadosData = (self.detalle.condExAfi && self.detalle.condExAfi.length > 0 && allNonBlockingNoDebt);

				for (var i = self.detalle.condExAfi.length - 1; i >= 0; i--) {
					var objeto = self.detalle.condExAfi[i];
					if (!objeto.isBloqueante && !objeto.bloqueante && !isBloqueante && objeto.monto_notificado === 0) {
						self.detalle.condExAfi.splice(i, 1);
					}
				}
			} else {
				self.hasExAfiliadosData = false;
			}
			
			successFunction();

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
		}

	});

	return newView;
});