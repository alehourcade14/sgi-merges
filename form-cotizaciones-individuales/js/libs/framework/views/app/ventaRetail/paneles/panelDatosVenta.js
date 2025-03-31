﻿define ([
         'jquery',
         'underscore',
         'backbone',
         'handlebars',
		 'util',
		 'session',
		 '/static/js/libs/thirds/jquery/moment.js',
		 '/form-smg-commons/js/libs/prospectoUtil.js',
		 '/form-smg-commons/js/libs/objectSerializer.js',
		 '/form-smg-commons/js/libs/asyncProcessor.js',
		 '/form-smg-commons/js/libs/services/abmDerivacionesVentasUcomService.js',
		 '/form-smg-commons/js/libs/services/loginService.js',
		 '/form-smg-commons/js/libs/services/empresasService.js',
		 'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/ventaRetail/paneles/datosVentaTemplate.html',
		 'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/ventaRetail/generico/selectAsesor.html',
		 'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/ventaRetail/generico/selectAsesorDetail.html'
], function ($, 
	_,
	Backbone, 
	Handlebars,
	Util,
	Session,
	moment,
	ProspectoUtil,
	ObjectSerializer,
	AsyncProcessor,
	AbmDerivacionesVentasUcomService,
	LoginService,
	EmpresasService,
	datosVentaTemplate,
	selectAsesoresTemplate,
	selectAsesoresDetailTemplate) {
	
	var asesoresRelacionados;
	var asesoresHabilitados = null;
	var asesoresDatosVenta;
	
	var rulesSave= {
			'[datosVenta][tipo]': {
				required: true
			}
	};

	var messagesSave = {
		'[datosVenta][tipo]': {
			required: "El campo Tipo de Venta es necesario"
		}
	};

	//Validaciones para asistida
	
	var reglasSMGAsistida= {
		'[datosVenta][tipo]': {
			required: true
		},
		'checkbox-seguro': {
			segurosOrLifeRequired: true
		},
		'checkbox-life': {
			segurosOrLifeRequired: true
		},
		'selAsesor': {
			selAsesorRequired: false,
			required: false
		}
	};

	var mensajesSMGAsistida = {
		'[datosVenta][tipo]': {
			required: "El campo Tipo de Venta es necesario"
		},
		'checkbox-seguro': {
			segurosOrLifeRequired: "Debe seleccionar al menos un producto"
		},
		'checkbox-life': {
			segurosOrLifeRequired: "Debe seleccionar al menos un producto"
		},
		'selAsesor': {
			selAsesorRequired: "Debe seleccionar un Asesor para continuar",
			required: "Debe seleccionar un Asesor para continuar"
		}
	};
	
	var reglasNOSMGAsistida= {
		'[datosVenta][tipo]': {
			required: true
		},
		'[datosVenta][aseguradora][id]':{
			required: true
		},
		'[datosVenta][aseguradora][fechaVigencia]':{
			menorOIgualQue : true,
			required: true
		},
		'selAsesor': {
			selAsesorRequired: false,
			required: false
		}
	};
	
	var mensajesNOSMGAsistida = {
		'[datosVenta][tipo]' : {
			required: "El campo Tipo de Venta es necesario"
		},
		'[datosVenta][aseguradora][id]' : {
			required: "Seleccione aseguradora"
		},
		'[datosVenta][aseguradora][fechaVigencia]' : {
			menorOIgualQue : '',
			required: "Ingrese fecha de vigencia"
		},
		'selAsesor': {
			selAsesorRequired: "Debe seleccionar un Asesor para continuar",
			required: "Debe seleccionar un Asesor para continuar"
		}
	};
	
	// Validaciones para directa
	var reglasSMGDirecta= {
		'[datosVenta][tipo]': {
			required: true
		},
		'checkbox-seguro': {
			segurosOrLifeRequired: true
		},
		'checkbox-life': {
			segurosOrLifeRequired: true
		}
	};
	
	var mensajesSMGDirecta = {
		'[datosVenta][tipo]': {
			required: "El campo Tipo de Venta es necesario"
		},
		'checkbox-seguro': {
			segurosOrLifeRequired: "Debe seleccionar al menos un producto"
		},
		'checkbox-life': {
			segurosOrLifeRequired: "Debe seleccionar al menos un producto"
		}
	};
	
	var reglasNOSMGDirecta= {
		'[datosVenta][tipo]': {
			required: true
		},
		'[datosVenta][aseguradora][id]':{
			required: true
		},
		'[datosVenta][aseguradora][fechaVigencia]':{
			required: true
		}
	};
	
	var mensajesNOSMGDirecta = {
		'[datosVenta][tipo]': {
			required: "El campo Tipo de Venta es necesario"
		},
		'[datosVenta][aseguradora][id]':{
			required: "Seleccione aseguradora"
		},
		'[datosVenta][aseguradora][fechaVigencia]':{
			required: "Ingrese fecha de vigencia"
		}
	};
	
	
	
    var panelDatosVenta = Backbone.View.extend ({
		/*prefijo para los campos del html*/
		id: null,
		
		provinciaProspecto: null,
		
		partidoProspecto: null,
		
		localidadProspecto: null,
		
		attachmentController: null,
		
		/*para setear el servicio cedi, usualmente cediService*/
		gestionCediService: null,
		
		width:100,
		
		heigth:100,
		
		certificadosConsultaMedicaFiltrados: null,
		
		certificadoSeleccionadoConsultaMedica: null,
		
		
		
	    events: function() {
	    	var self = this;
	    	self.id = self.options.id;
	    	self.cargandoDiv=self.options.id+'CargandoDiv';
	    	var _events = {};
	    	
	    	if(self.options.modo!=undefined && self.options.modo=='manual'){
	    		return _events;
	    	}
	    	else {
	    		
	    		_events['click  #btnSearch' ] = 'onClickSearch';
	    	}

						
	        return _events;

	    },
       	
       	initModal: function (){
			var self = this;
			self.currentType='modal';
			self.reRender(archivoModal);
//			self.selectArchivo=null;
//			var evento='click .'+self.archivoStyle;
//			self.delegateEvents(_.extend(self.events, {evento : 'selectArchivo'}));
       	},
       	
		recargarEventos:function(){
			var self = this;
			self.delegateEvents();
		},
		
		renderTableCertificadosConsultaMedica: function () {
			var self = this;
			
			var compiledTemplate = Handlebars.compile(tablaBusquedaCertificadoDeConsultaMedicaViewTemplate);
			$("#detallePanelContainer").empty();
            $("#detallePanelContainer").append(compiledTemplate({context: self}));
        },
		
        openModal:function(certificados){
       		var self = this;
       		
       		$("#busquedaCertificadosConsultaMedicaDiv").empty ();
       		var compiledTemplate = Handlebars.compile(tablaBusquedaCertificadoDeConsultaMedicaViewTemplate);
			$("#busquedaCertificadosConsultaMedicaDiv").append (compiledTemplate({certificadosConsultaMedica: certificados}));
			
			$("#modal-form-busqueda-certificados-consulta-medica").modal('show');
       	},
        
		
		
		arrayLookup: function (array, prop, val) {
			for (var i = 0, len = array.length; i < len; i++) {
				if (array[i].hasOwnProperty(prop) && array[i][prop] == val) {
					return array[i];
				}
			}
			return null;
		},
        
		
		// INICIO
		
		initDatosVenta: function(onSuccess) {
			
			var self = this;
			
			var compiledTemplate = Handlebars.compile(datosVentaTemplate);
			
			$("#contactarContainer").empty();
			$("#contactarContainer").append(compiledTemplate({context: self}));
			
			self.initRules();
			
			$.ajax({
				type: "GET" ,
				url: "aseguradoras.json?date="+new Date().getTime(),
				async: false,
				success : function(data) {
					
					aseguradoras = eval(data);
					
					$("#aseguradoraId").empty();
					$("#aseguradoraId").append("<option value>--Seleccionar --</option>");
					
					for(var i=0; i < aseguradoras.length; i++) {
						$("#aseguradoraId").append("<option value='"+aseguradoras[i].id+"'> " + aseguradoras[i].name + "</option>");
					}
				},
				error : function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}
			});
			
			var userName = Session.getLocal("userName");
			
			EmpresasService.getProductorByUserName(userName,
			function (productor) {
				
				$("#apellidoProductor").val(productor.apellido);
				$("#nombreProductor").val(productor.nombre);
				
				if(productor.emails && productor.emails.length > 0) {
					$("#productorEmail").val(productor.emails[0].direccion);
				}
			},
			function (xhr,err,urlRest,typeCall) {
				Util.error( 'Sample of error data:', err );
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: "+ xhr.responseText);
				
				if(xhr.status == 409){
					ProspectoUtil.gritterMessage("El usuario de red se encuentra asignado a mas de un promotor, por favor comunicarse con el administrador.");
				}else{
					ProspectoUtil.gritterMessage("Error es desconocido para el sistema");
				}
			},
			function (data) {
				onSuccess();
			});
		},
		
		showModalCargarArchivos: function(){
				archivoController.openModal();
		},
			
		validateDaysLimit120: function(dateStrFrom, dateStrTo){
				var parts = dateStrFrom.split('-');
				var dateFrom = new Date(parts[0], parts[1] - 1, parts[2]);
				parts = dateStrTo.split('-');
				var dateTo = new Date(parts[0], parts[1] - 1, parts[2]);
				if(Util.daysBetween(dateFrom, dateTo) > 120){
					return false;
				}
				return true;
		},
		
		renderSelectAsesores: function(){
			
			var self = this;
			
			console.log(asesoresRelacionados);
			
			
			asesoresHabilitados = false;
			var compiledTemplate = Handlebars.compile(selectAsesoresTemplate);
			var compiledDetailTemplate = Handlebars.compile(selectAsesoresDetailTemplate);
			if(asesoresDatosVenta && asesoresDatosVenta.length > 0){
				asesoresHabilitados = true;

				for (var i = 0; i < asesoresDatosVenta.length; ++i){
					for (var j = 0; j < asesoresDatosVenta.length; ++j){
						if (i !== j && asesoresDatosVenta[i].userName === asesoresDatosVenta[j].userName)
						asesoresDatosVenta.splice(j, 1); 
					}
				}
			}
			$("#asesorContainerId").html(compiledTemplate({ asesores: asesoresDatosVenta, asesoresHabilitados: asesoresHabilitados }));
			if(!asesoresHabilitados){
				
				$("#asesorDetailContainer").html(compiledDetailTemplate({ asesoresRelacionados: asesoresRelacionados}));
				$("#selAsesorId").prop('required',false);
	        	$("#asesorVtaAsistidaLbl").html('Asesor:');
			} else {
				
				$.validator.addMethod("selAsesorRequired", function(value, element){
					
					var actorIdSelected = $("#selAsesorId option:selected");
					
					return ( !Util.isNullOrUndefined(actorIdSelected) && !Util.isEmpty(actorIdSelected.val()) )
					
				}, "Debe seleccionar un Asesor para continuar");
				
				$("#selAsesorId").prop('required',true);
	            $("#asesorVtaAsistidaLbl").html('Asesor<i class="icon-asterisk red"style="font-size: 10px;vertical-align: 5px;"></i>:');
	        }
		},
		
		changeCheckboxLife: function () {
				var $checkboxLife = $("#checkbox-life");
				var $showCheckboxLife = $(".show-checkbox-life");
				if($checkboxLife.is(":checked")){
					$showCheckboxLife.css("display","inline");
				}else{
					$showCheckboxLife.css("display","none");
				}
		},
		
		changeCheckboxSeguro: function () {
				var $checkboxSeguro = $("#checkbox-seguro");
				var $showCheckboxSeguro = $(".show-checkbox-seguro");
				if($checkboxSeguro.is(":checked")){
					$showCheckboxSeguro.css("display","inline");
				}else{
					$showCheckboxSeguro.css("display","none");
				}
		},

		changeTipoVenta: function () {
				var self = this;
				var $divProductosActivosId = $("#divProductosActivosId");
				var $divSelAsesorVtaAsistidaId = $("#divSelAsesorVtaAsistidaId");
				var $divCheckboxProductosActivosId = $("#divCheckboxProductosActivosId");
				var $checkboxProductosActivosId = $("#checkboxProductosActivosId");
				var $showIconAsterisk = $(".show-icon-asterisk");
				var $labelProdActivos = $('#labelProdActivos');
				var $checkboxTipoSMGId = $('#checkboxTipoSMGId');
				var $tipoNoSMG = $("#tipoNoSMG");
				var $tipoSMG = $("#tipoSMG");

				if(!ProspectoUtil.isUserBroker()){
					if($("#tipoDeVta option:selected").text()==="Asistida"){
						Util.debug("Opción Asistida...");

						$divSelAsesorVtaAsistidaId.css("display","inline");
						self.getAsesoresDatosVentaAsistida( self.renderSelectAsesores );
						
						// Muestra productos activos
						$divCheckboxProductosActivosId.css("display","inline");
						$labelProdActivos.css("display","inline");

						$showIconAsterisk.css("display","inline");
						$divProductosActivosId.removeAttr("hidden");

						// Si se esta mostrando
						if($divProductosActivosId.attr("hidden") === undefined){
							$checkboxProductosActivosId.prop( "checked", true );
						}
		//				$checkboxProductosActivosId.attr("disabled",true);
						$checkboxProductosActivosId.removeAttr("disabled");

						if($checkboxProductosActivosId.is(":checked") === false){
							$checkboxProductosActivosId.click();
						}

						if(!$checkboxTipoSMGId.is(":checked")){
							$checkboxTipoSMGId.click();
						}
						$tipoSMG.removeAttr("hidden");
					}else if($("#tipoDeVta option:selected").text()==="Directa"){
						Util.debug("Opción Directa...");
						
						$divSelAsesorVtaAsistidaId.css("display","none");
						self.cleanSelectAsesores();
						
						// Muestra productos activos
						$divCheckboxProductosActivosId.css("display","inline");
						
						$labelProdActivos.css("display","inline");

						$checkboxProductosActivosId.css("display","inline");
						$showIconAsterisk.css("display","inline");

						// Si se esta mostrando
						if($divProductosActivosId.attr("hidden") === undefined){
							$checkboxProductosActivosId.prop( "checked", true );
						}
						$checkboxProductosActivosId.removeAttr("disabled");
						if($checkboxProductosActivosId.is(":checked") === false){
							$checkboxProductosActivosId.click();
						}

						if(!$checkboxTipoSMGId.is(":checked")){
							$checkboxTipoSMGId.click();
						}
						$tipoSMG.removeAttr("hidden");
					}else{
						Util.debug("Opción seleccione...");
						$divProductosActivosId.attr("hidden",true);
						
						$divSelAsesorVtaAsistidaId.css("display","none");
						self.cleanSelectAsesores();
						
						$tipoNoSMG.attr("hidden",true);
						$tipoSMG.attr("hidden",true);

						$checkboxProductosActivosId.css("display","inline");
						$showIconAsterisk.css("display","none");
						$divCheckboxProductosActivosId.css("display","none");
						$labelProdActivos.css("display","none");
						$checkboxProductosActivosId.removeAttr("disabled");

						if($checkboxProductosActivosId.is(":checked")){
							$checkboxProductosActivosId.click();
						}
					}
				}
		},
			
		changeProductosActivos: function () {
				Util.debug("changeProductosActivos...");
				var $checkboxProductosActivosId = $("#checkboxProductosActivosId");
				var $divProductosActivosId = $("#divProductosActivosId");
				if($checkboxProductosActivosId.is(":checked")){
					$divProductosActivosId.removeAttr("hidden");
				}else{
					$divProductosActivosId.attr("hidden",true);
				}
		},
		
		changeTipoSMG: function () {
				Util.debug("changeTipoSMG...");
				var $checkboxTipoSMGId = $("#checkboxTipoSMGId");
				var $tipoSMG = $("#tipoSMG");
				var $tipoNoSMG = $("#tipoNoSMG");
				if($checkboxTipoSMGId.is(":checked")){
					$tipoSMG.removeAttr("hidden");
					$tipoNoSMG.attr("hidden",true);
				}else{
					$tipoSMG.attr("hidden",true);
					$tipoNoSMG.removeAttr("hidden");
				}
		},
		
		cleanSelectAsesores: function() {
			if($("#tipoDeVta option:selected").text()!=="Directa"){
				$('#tipoDeVta').val("");
			}
			$("#divSelAsesorVtaAsistidaId").css("display","none");
			$("#asesorDetailContainer").empty();
		},
		
		isValidToSave: function(onSuccess) {
			self = this;
			
			var valid = $('#validation-formProductor').valid();
			
			if(!valid){
				self.valid = false;
				ProspectoUtil.gritterIncomplete();
			} else {
				
				var un = self.getUnSelected();
				
				if( un !== undefined && un !== null && $.trim(un) === '4' ) {
					self.isValidToSaveUCOM(onSuccess);
				}
				else {
					onSuccess();
				}
			}
			
			return valid;
		},
		
		isValidToSaveUCOM: function(onSuccess) {
			self = this;
			
			if( $("#isCreate").val() !== "1" ) {
				onSuccess();
			} else {
				var formPMT = $("#validation-formPersonaMailTel");
				var formDatos = formPMT.serializeObject();
				var isCuit = self.isPersonaJuridicaSelected();
				var tipoDocumento = (isCuit ? "CUIT" : formDatos.prospecto.docTipo);
				var numeroDocumento = (isCuit ? formDatos.prospecto.cuit : formDatos.prospecto.docNum);
				
				require(["/form-smg-commons/js/libs/services/pasService.js"], function(PasService) {
					Util.blockBody();
					PasService.getExistenciasPas(tipoDocumento, numeroDocumento, true, function(data) {
						var existenciasPas = eval(data);
						for(var i in existenciasPas) {
							if(!existenciasPas[i].existe) {
								onSuccess();
								
								return;
							}
						}
						ProspectoUtil.gritterMessage("El productor ya existe dado de alta en los sistemas legados");
					}, function(xhr, err) {
						ProspectoUtil.gritterMessage("Hubo un error al validar si el productor ya existe en los sistemas legados.");
					}, function(data) {
						Util.unBlockBody();
					});
				});
			}
		},
		
		seleccionarReglaYMensajeDatosVenta: function(){
			
			var formTarget = "#validation-formProductor";
			
			var $checkboxTipoSMGId = $("#checkboxTipoSMGId");
			var $checkboxSeguro = $("#checkbox-seguro");
			var $checkboxLife = $("#checkbox-life");
			var $tipoDeVentaSeleccionado = $("#tipoDeVta option:selected");

			if($tipoDeVentaSeleccionado.text()==="Asistida"){
				Util.debug("Validación para Asistida...");
				
				if($checkboxTipoSMGId.is(":checked")) {
					
					if($checkboxSeguro.is(":checked")){
						reglasSMGAsistida["[datosVenta][seguros][poliza]"] = {required:true};
						mensajesSMGAsistida["[datosVenta][seguros][poliza]"] = {required:"Ingrese póliza"};

						reglasSMGAsistida["[datosVenta][seguros][fechaVigencia]"] = {
								menorOIgualQue : true,
								required : true
						};
						mensajesSMGAsistida["[datosVenta][seguros][fechaVigencia]"] = {
								menorOIgualQue : '',
								required : "Ingrese fecha de vigencia"
						};
						reglasSMGAsistida['[datosVenta][seguros][producto]'] = {
							required : true
						};
						mensajesSMGAsistida['[datosVenta][seguros][producto]'] = {
							required : "Ingrese Producto Seguro"
						};

					}

					if($checkboxLife.is(":checked")){
						reglasSMGAsistida["[datosVenta][life][poliza]"] = {required:true};
						mensajesSMGAsistida["[datosVenta][life][poliza]"] = {required:"Ingrese póliza"};
						
						reglasSMGAsistida["[datosVenta][life][fechaVigencia]"] = {
								menorOIgualQue : true,
								required : true
						};
						mensajesSMGAsistida["[datosVenta][life][fechaVigencia]"] = {
								menorOIgualQue : '',
								required : "Ingrese fecha de vigencia"
						};
						
					}
					
					if( asesoresHabilitados ) {
						
						reglasSMGAsistida["selAsesor"] = {
							selAsesorRequired: true,
							required: true
						};
						
					} else {
						
						reglasSMGAsistida["selAsesor"] = {
							selAsesorRequired: false,
							required: false
						};
					}
					
					ProspectoUtil.setFormValidation(formTarget, reglasSMGAsistida, mensajesSMGAsistida);
					
				} else {
					
					if( asesoresHabilitados ) {
						
						reglasNOSMGAsistida["selAsesor"] = {
							selAsesorRequired: true,
							required: true
						};
						
					} else {
						
						reglasNOSMGAsistida["selAsesor"] = {
							selAsesorRequired: false,
							required: false
						};
					}
					
					ProspectoUtil.setFormValidation(formTarget, reglasNOSMGAsistida, mensajesNOSMGAsistida);
					
				}
			}else if($tipoDeVentaSeleccionado.text()==="Directa"){
				Util.debug("Validación para Directa...");
				if($checkboxTipoSMGId.is(":checked")){
					if($checkboxSeguro.is(":checked")){
						reglasSMGDirecta["[datosVenta][seguros][poliza]"] = {required:true};
						mensajesSMGDirecta["[datosVenta][seguros][poliza]"] = {required:"Ingrese póliza"};

						reglasSMGDirecta["fechaSeguros"] = {
							required : true
						};
						mensajesSMGDirecta["fechaSeguros"] = {
							required : "Ingrese fecha de vigencia"
						};
						reglasSMGDirecta['[datosVenta][seguros][producto]'] = {
							required : true
						};
						mensajesSMGDirecta['[datosVenta][seguros][producto]'] = {
							required : "Ingrese Producto Seguro"
						};

					}

					if($checkboxLife.is(":checked")){
						reglasSMGDirecta["[datosVenta][life][poliza]"] = {required:true};
						mensajesSMGDirecta["[datosVenta][life][poliza]"] = {required:"Ingrese póliza"};

						reglasSMGDirecta["[datosVenta][life][fechaVigencia]"] = {
							required:true
						};
						mensajesSMGDirecta["[datosVenta][life][fechaVigencia]"] = {
							required : "Ingrese fecha de vigencia"
						};

					}

					ProspectoUtil.setFormValidation(formTarget, reglasSMGDirecta, mensajesSMGDirecta);
					
				}else{
					
					ProspectoUtil.setFormValidation(formTarget, reglasNOSMGDirecta, mensajesNOSMGDirecta);
					
				}

			}else{
				Util.debug("Validación para Seleccione...");
				
				ProspectoUtil.setFormValidation(formTarget, rulesSave, messagesSave);
				
			}
		},
		
		saveDatosVenta: function( ) { //e){
			
			//event.stopPropagation();
			var self = this;
			
			var form = $("#validation-formProductor");
			form.removeData("validator");
			
			self.seleccionarReglaYMensajeDatosVenta();
			
			$.validator.addMethod("segurosOrLifeRequired", function(value, element){
				if($('#checkboxTipoSMGId').is(':checked')) {
					Util.debug(">>> return: "+$('#checkbox-seguro').is(':checked') || $('#checkbox-life').is(':checked'));
					return $('#checkbox-seguro').is(':checked') || $('#checkbox-life').is(':checked');
				}
				else {
					Util.debug(">>> return: true Paso por else");
					return true;
				}
			}, "Si indic\u00F3 que tiene productos activos SMG, debe seleccionar alguno (Seguros o LIFE).");			
			
			//Valida Datos Venta 
			if(form.valid()){
				return self.buildObjectSalud();				
			} else {
				return null;
			}
		},
		
		validarZona: function(asesor) {
			var self = this;
			
			var provincia = self.provinciaProspecto.toUpperCase();
			var partido = self.partidoProspecto.toUpperCase();
			var localidad = self.localidadProspecto.toUpperCase();
			
			if (self.sucursalesxAsesor.length > 0) {
				$.each(self.confSucursales, function (index, configuracion) {
					for (var v = 0, len = self.sucursalesxAsesor.length; v < len; v++) {
						//Verifico Pooles
						if (self.sucursalesxAsesor[v].descripcion){
							sucursal = self.sucursalesxAsesor[v]
							//Verifico si la sucursal coincide con alguna sucursal de la configuracion (tanto web como fisica)
							if((configuracion.sucursal && configuracion.sucursal.idSucursal == sucursal.idSucursalWeb) || (configuracion.sucursalWeb && configuracion.sucursalWeb.idSucursalWeb == sucursal.idSucursalWeb)){
								//Verifico que esa sucursal pertenece a la zona del prospecto (null = todas)
								if(configuracion.provincia && configuracion.provincia.descProvincia.toUpperCase() == provincia && (configuracion.partido.descPartido == null || (configuracion.partido.descPartido && configuracion.partido.descPartido.toUpperCase() == partido)) && (configuracion.localidad.descLocalidad == null || (configuracion.localidad.descLocalidad && configuracion.localidad.descLocalidad.toUpperCase() == localidad)) ){
									self.sucursalesxAsesor.splice(v,1);
									if(self.sucursalesxAsesor.length > 0){
										v--;
										len = self.sucursalesxAsesor.length;
									}
									asesoresDatosVenta.push(asesor);
								}
							}	
						//Verifico Guardias	
						}else{
							if(self.sucursalesxAsesor[v].sucursal){
								
								if(provincia == "CAPITAL FEDERAL"){
									provincia = "BUENOS AIRES";
									$.each(self.sucursalesxAsesor[v].provincias, function (index, provinciaL) {
										var provinciaP = provinciaL.descProvincia.toUpperCase();
										if (provinciaP.indexOf(provincia) >= 0 ){
											self.sucursalesxAsesor.splice(v,1);
											if(self.sucursalesxAsesor.length > 0){
												v--;
												len = self.sucursalesxAsesor.length;
											}	
											asesoresDatosVenta.push(asesor);
										}
									});
								}else{
									$.each(self.sucursalesxAsesor[v].provincias, function (index, provinciaL) {
										var sucursal = self.sucursalesxAsesor[v].sucursal.toUpperCase();
										var ambito = self.sucursalesxAsesor[v].ambito.toUpperCase();
										var provinciaP = provinciaL ? provinciaL.descProvincia ? provinciaL.descProvincia.toUpperCase(): "" : "";
										if (provinciaP.indexOf(provincia) >= 0 ){
											if ( sucursal.indexOf(partido) >= 0 ||  ambito.indexOf(partido) >= 0){
												self.sucursalesxAsesor.splice(v,1);
												if(self.sucursalesxAsesor.length > 0){
													v--;
													len = self.sucursalesxAsesor.length;
												}	
												asesoresDatosVenta.push(asesor);
											}
										}
									});
								}
							}
						}
					}
					});							
			}
		},
		
		initRules: function () {

			var fechaValidaDeValidador = true;
			$.validator.addMethod("menorOIgualQue", function (value, element) {
				var desde, hasta;
				hasta = moment();
				desde = moment(value,"DD-MM-YYYY");
				fechaValidaDeValidador = desde <= hasta;
				return fechaValidaDeValidador;
			}, '');
			
		},
		
		getAsesoresDatosVentaAsistida: function(onSucess) {
			var self = this;
			
			var productor = Session.getLocal("userName");
			var asesoresGuardias;
			var asesoresPool;
			asesoresDatosVenta = [];
			var asyncFunctions = [];

			//Traigo asesores relacionados al productor
			asyncFunctions.push(function (successFunction, context) {
				//Traigo asesores relacionados a los productores
				onSuccess = function (data) {
					if(data.length > 0){
						asesoresRelacionados = data[0].lstAsesores;
						asesoresPool = data[0].lstAsesores;
					}
				}
				AbmDerivacionesVentasUcomService.getRelPasAsesor(productor, onSuccess, self.logError, successFunction);
			});

			//Traigo asesores relacionados al productor con sus guardias 
			asyncFunctions.push(function (successFunction, context) {
				//Traigo asesores relacionados a los productores
				onSuccess = function (data) {
					if(data.length > 0){
						asesores = data[0].lstAsesores;
						asesoresGuardias = data[0].lstAsesores;
					}
				}
				AbmDerivacionesVentasUcomService.getRelPasAsesorConGuardias(productor, onSuccess, self.logError, successFunction);
			});

			//Datos obtenidos de ABM Asesor Sucursal VPI Web
			asyncFunctions.push(function (successFunction, context) {
				AbmDerivacionesVentasUcomService.getSwebAsesorxTipo(1,
					function (data) {
						self.asesoresxPoolVirtual = data;
						successFunction();
					},
					function (xhr, err) {
						Util.error('Sample of error data:', err);
						Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					},
					function (data) {
					}
				);
			});

			//Datos obtenidos de ABM Derivación de Trámites
			asyncFunctions.push(function (successFunction, context) {
				onSuccess = function (data) {
					self.confSucursales = data;
				}
				AbmDerivacionesVentasUcomService.getConfSucursalVentaAsistidaVSI(onSuccess, self.logError, successFunction);
			});
			
			asyncFunctions.push(function (successFunction, context) {
				self.sucursalesxAsesor = [];
				if(asesoresGuardias){
					$.each(asesoresGuardias, function (index, asesor) {
						if(asesor.guardia && asesor.guardia.ambito){
							self.sucursalesxAsesor.push(asesor.guardia);
						}
						self.validarZona(asesor);
					});
				}
				if(asesoresPool){
					$.each(asesoresPool, function (index, asesor) {
						$.each(self.asesoresxPoolVirtual, function (index, pool) {
							if (pool.asesor == asesor.userName) {
								self.sucursalesxAsesor.push(pool.sucursalWeb);
							}
						});
						self.validarZona(asesor);
					});
				}
				successFunction();
			});
			
			asyncFunctions.push(function( successFunction, context) {
				onSucess();
			});
			
			AsyncProcessor.process(asyncFunctions, {});
	    },
		
		getDatosVendedor: function() {
	    	var userName = Session.getLocal("userName");
			var result = {}; result.ejecutivo = {};
			result.productor= {};
	        if (ProspectoUtil.isUserPAS() || ProspectoUtil.isUserBroker()) {
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
	        } else if (ProspectoUtil.isUserEjecutivo()) {
	            LoginService.userInformation(userName,false,
	                function(data){
	                    Util.debug("ejecutivo", data);
	                    result.ejecutivo.descripcion = data.apellido + ", " + data.nombre;
	                    result.ejecutivo.email =	data.email;
	                    result.ejecutivo.username = data.login;
	                    result.ejecutivo.legajo = data.legajo ? data.legajo.toString() : "";
	                    result.ejecutivo.telefono = data.telefono;
						result.productor.codigo = '';
						result.productor.codigoProductor = '';
	                },function (xhr,err,urlRest,typeCall) {
	                    Util.error( 'Sample of error data:', err );
	                    Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
	                },function(){
	                }
	            );
	        }
	        
	        return result;
	    },
		
		getCodigoUsuario: function(userName) {
			
			var self = this;
	        
			self.ventaSaludIndidividuosCodigoUser = "";
			
	        LoginService.userInformation(userName,false,
	            function(data){
	        		self.ventaSaludIndidividuosCodigoUser = "" + data.legajo;
	            },
	            function(){
	            	
	            },
	            function(){
	            	
	            });
	        
	        return self.ventaSaludIndidividuosCodigoUser;
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
		
	    buildObjectSalud: function() {
	    	
			var self = this;
			var actorId = Session.getLocal("userId");
			var user = Session.getLocal("userName");
			var userName = Util.getUserNameComplete(Session.getLocal("userId"));
			var userInformation= self.getUserInformation(user);
			var finalObject = {};
			var actorIdSelected = $("#selAsesorId option:selected");
			var tipoDeVentaSeleccionado = $("#tipoDeVta option:selected");

			
			finalObject.assignment = {};
			finalObject.assignment.actorId = actorId;
			
			finalObject.user = {};
			finalObject.user.id = actorId;
			finalObject.user.userName = userName;
			finalObject.user.user = user;

			finalObject.process = {
				variables: {
					workContext : "",
					processInfo: {
						id: "0",
						name: "Venta Salud Individuos",
						description: "Venta Salud Individuos",
						credencial: "PRO-1",
						registradoUsuario: user,
						registradoNombre: finalObject.user.id
					},
					finalizado: "false",
					action: 'aContactar',
					completaProspecto: "false",
					processOwner: user,
					processOwner: finalObject.user.id,
					actorId : actorId
				},
				id: null,
				processId: null,
				key: null,
				start: new Date().getTime(),
				version: "1",
				processName: "Venta Salud Individuos",
				detalle: "",
				credencial: "PRO-1"
			};
			
			finalObject.esVentaAsistida = false ;

			finalObject.vendedorAsignado = user;
			finalObject.vendedorNombre = self.getVendedorNombre(userName, userInformation);
			
			if(  Util.hasRole('SGI_PAS') ) {
				var tipoDeVentaSeleccionado = $("#tipoDeVta option:selected");
				var actorIdSelected = $("#selAsesorId option:selected");
				var checkDeTipoSMGId = $("#checkboxTipoSMGId");
				finalObject.observacion = $("#observacion").val();
				if(!Util.isEmpty(finalObject.observacion)){
					finalObject.process.variables.processInfo.detalle = finalObject.process.variables.processInfo.detalle + " - " + finalObject.observacion;
				}
				if(tipoDeVentaSeleccionado.text() === "Asistida" && asesoresHabilitados && !Util.isEmpty( actorIdSelected.val() ) ) {
					asesorAsignado = actorIdSelected.val();
					finalObject.process.variables.workContext = "AMB_FUERZA_VTA_DIRECTA";
					finalObject.assignment.actorId = actorIdSelected.val();
					finalObject.vendedorAsignado = actorIdSelected.data("user-name");
					finalObject.vendedorNombre = actorIdSelected.data("nombre") + " " +actorIdSelected.data("apellido");
				} else if(tipoDeVentaSeleccionado.text() === "Asistida" && !asesoresHabilitados){
					finalObject.canal = "WEB";
					asesorAsignado = "WEB";
					finalObject.process.variables.workContext = "AMB_FUERZA_VTA_DIRECTA";
					finalObject.assignment = {};
					//Se actualiza desde el bundle 
					finalObject.vendedorAsignado = null;
					finalObject.vendedorNombre = null;
				}
				
				var datosVenta = ObjectSerializer.serializeObject("#panelDatosVenta").datosVenta;
				
				var archivosParaCargarB = self.attachmentController.getArchivosParaCargar();
				
				datosVenta.esSMG = checkDeTipoSMGId.is(":checked");
				datosVenta.polizaConAdjunto = false;
				
				if( !checkDeTipoSMGId.is(":checked") && archivosParaCargarB.length > 0 ) {
					
					datosVenta.polizaConAdjunto = true;
					
					// Cargo los archivos del controlador Archivos para que el bundle los guarde.
					finalObject.rudiFiles = archivosParaCargarB;
				}
				
				if( tipoDeVentaSeleccionado && tipoDeVentaSeleccionado.text() === "Asistida" ) {
					datosVenta.tipo = 2;
				} else {
					if( tipoDeVentaSeleccionado ){
						datosVenta.tipo =  1;					
					}
				}
				
				finalObject.datosVenta = datosVenta;
				finalObject.rolUserIniciaTramite = "SGI_PAS";
				
				finalObject.codigoAsesor = "" + self.ventaSaludIndidividuosCodigoUser;
				finalObject.codigoBroker = null;
				
	            if( tipoDeVentaSeleccionado != null && tipoDeVentaSeleccionado.text() === "Asistida" ) {
	                finalObject.esVentaAsistida = true ;
	            }
	            
			} else {

				if(Util.hasRole('SGI_BROKER') ) {
					
					finalObject.codigoAsesor = null;
					finalObject.datosVenta = {};
					finalObject.datosVenta.tipo =  1;	//Tipo Directa
	
					var userNameVtaSaludInd = Session.getLocal('userName');
					finalObject.codigoBroker = "" + self.getCodigoUsuario(userNameVtaSaludInd);
				}
			}
			
			finalObject.process.variables.asesor = "false";
			finalObject.process.variables.finalizado = "false";
			finalObject.process.variables.crearProspecto = "true";
			finalObject.process.variables.seFinaliza = "false";
			
			var medio = ProspectoUtil.getMedioPorUserTipo() == undefined ? 14 : ProspectoUtil.getMedioPorUserTipo()
			finalObject.medio = {
				id: medio,
				numero: null
			};
			finalObject.sucursal = {};
			finalObject.sucursal.id = Session.getLocal("subsidiary");
			finalObject.canalOrigen = {};
			finalObject.canalOrigen.id = 2; 
			finalObject.canalOrigen.subCanal = Session.getLocal("subsidiary");
			finalObject.estado = {};
			finalObject.estado.id = 0;
			finalObject.motivo = {};
			finalObject.motivo.id = 0;
			finalObject.credencial = "PRO-1";
			
			if( Util.hasRole('SGI_PAS') || Util.hasRole('SGI_BROKER') ) {
				// se setea el codigo de productor o del broker
				var vendedor = self.getDatosVendedor();
				finalObject.vendedorCodigo = vendedor.productor && vendedor.productor.codigoProductor != null && vendedor.productor.codigoProductor != "" ? $.trim(vendedor.productor.codigoProductor) : "";
				
				if( Util.hasRole('SGI_PAS') ) {
					finalObject.datosVenta.codigoVendedor = {};
					finalObject.datosVenta.codigoVendedor.pas = finalObject.vendedorCodigo;
				}

				if( Util.hasRole('SGI_BROKER') ) {
					finalObject.datosVenta.codigoVendedor = {};
					finalObject.datosVenta.codigoVendedor.broker = finalObject.vendedorCodigo;
				}

			}
			
			console.log(finalObject);
			
			return finalObject;
	    },

		getVendedorNombre: function (userName, userInformation){
	
			var nombreCompleto = userName;
			if(userInformation && userInformation.apellido != "" && userInformation.nombre != ""){
				nombreCompleto = userInformation.nombre + " " + userInformation.apellido;
			}
	
			return nombreCompleto;
		}

    });
    
    return panelDatosVenta;
});