define ([
         'jquery',
         'underscore',
         'backbone',
         'datatablesBT',
         'handlebars',
         'libs/handlebars-project-helpers',
         'bootstrap',
         'ace',
         'encoding',
         'libs/settings',
         'util',
         'messagesService',
         '/static/js/libs/services/empresasService.js',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/formVtaProductoresTemplate.html',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/errorTemplate.html',
         'text!libs/framework/templates/app/motiveNotFoundTemplate.html',
         '/static/js/libs/thirds/jquery/moment-with-locales.js',
         '/form-visualizador-tiff/js/libs/framework/views/helpers/controladorArchivos/archivoController.js',
         '/form-webcam/js/libs/framework/views/app/formView.js',
         '/form-smg-commons/js/libs/prospectoUtil.js',
		 'session',
		 '/form-smg-commons/js/libs/services/fuseService.js',
		 '/form-smg-commons/js/libs/services/prospectoService.js',
], function ($, _, Backbone, datatablesBT, Handlebars, MyHandlebarsHelpers, bootstrap, ace, Encoding, SettingsModel, Util, MessagesService,
			 EmpresasService, formTemplate, errorTemplate, motiveNotFoundTemplate, moment, ArchivoController,
			 WebCamView, ProspectoUtil, Session, FuseService, ProspectoService){
     
    var linkProcessId = null;
    var entityId = null;
	var prospecto = null;
    var typeEntity=  null;
	var archivoController;
	var archivosParaCargar = [];
	var cantArchivosCargados;
	var hasSubmotive;
    	
	function getStatus(motivo,finalizado) {

		var estado = {
		    id: 11,
		    descripcion: "Pendiente Validar Reserva"
		};

		Util.debug("estado", estado);
		return estado;
	}
	
	var validate  = {
		errorElement: 'label',
		errorClass: 'custom-help',
		focusInvalid: false,
		rules: null,
		messages: null,
		invalidHandler: function (event, validator) { //show-icon-asterisk error alert on form submit
		},
		highlight: function (e) {
			$(e).closest('.control-group').removeClass('info').addClass('error');
		},
		success: function (e) {
			$(e).closest('.control-group').removeClass('error').addClass('info');
			$(e).remove();
		},
		errorPlacement: function (error, element) {
                    var errorContainer = $(element).data('errortarget');
                    if(errorContainer !== null && errorContainer !== undefined && errorContainer !== '') {
                        $(error).css('display','block');
                        $(error).css('color','#d16e6c');
                        error.appendTo('.'+errorContainer);
                    }
                    else if(element.is(':checkbox') || element.is(':radio')) {
				var controls = element.closest('.controls');
				if(controls.find(':checkbox,:radio').length > 1) {
					controls.append(error);
				}
				else {
					error.insertAfter(element.nextAll('.lbl:eq(0)').eq(0));
				}
			}
			else if(element.is('.select2')) {
				error.insertAfter(element.siblings('[class*="select2-container"]:eq(0)'));
			}
			else if(element.is('.chzn-select')) {
				error.insertAfter(element.siblings('[class*="chzn-container"]:eq(0)'));
			}
                    else if(element.is('.date-picker')) {
                        if(element.next('[class="add-on"]').length !== 0) {
                            error.insertAfter(element.next('[class="add-on"]'));
                        }
                        else {
							error.insertAfter(element);
						}
                    }
			else {
				error.insertAfter(element);
			}
		},

		submitHandler: function (form) {
		},
		invalidHandler: function (form) {
		}
	};
	
	var rulesSave= {
		'tipo[id]': {
			required: true
		}
	};

	var messagesSave = {
		'tipo[id]': {
			required: "El campo Tipo de Venta es necesario"
		}
	};

	//Validaciones para asistida

	var reglasSMGAsistida= {
		'tipo[id]': {
			required: true
		},
		'checkbox-seguro': {
			segurosOrLifeRequired: true
		},
		'checkbox-life': {
			segurosOrLifeRequired: true
		}
	};

	var mensajesSMGAsistida = {
		'tipo[id]': {
			required: "El campo Tipo de Venta es necesario"
		},
		'checkbox-seguro': {
			segurosOrLifeRequired: "Debe seleccionar al menos un producto"
		},
		'checkbox-life': {
			segurosOrLifeRequired: "Debe seleccionar al menos un producto"
		}
	};

	var reglasNOSMGAsistida= {
		'tipo[id]': {
			required: true
		},
		'aseguradora':{
			required: true
		},
		'fechaAseguradora':{
//			menorOIgualQue : 'TODAY4',
			required: true
		}
	};

	var mensajesNOSMGAsistida = {
		'tipo[id]': {
			required: "El campo Tipo de Venta es necesario"
		},
		'aseguradora':{
			required: "Seleccione aseguradora"
		},
		'fechaAseguradora':{
//			menorOIgualQue : 'Ingrese fecha valida',
			required: "Ingrese fecha de vigencia"
		}
	};

	// Validaciones para directa
	var reglasSMGDirecta= {
		'tipo[id]': {
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
		'tipo[id]': {
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
		'tipo[id]': {
			required: true
		},
		'aseguradora':{
			required: true
		},
		'fechaAseguradora':{
			required: true
		}
	};

	var mensajesNOSMGDirecta = {
		'tipo[id]': {
			required: "El campo Tipo de Venta es necesario"
		},
		'aseguradora':{
			required: "Seleccione aseguradora"
		},
		'fechaAseguradora':{
			required: "Ingrese fecha de vigencia"
		}
	};


    var newView = Backbone.View.extend ({

		events: {
			'click 		#btnSave' 						: 'save',
			'change 		#tipoDeVta' 						: 'changeTipoVenta',
			'change 		#checkboxProductosActivosId' 		: 'changeProductosActivos',
			'change 		#checkbox-life' 					: 'changeCheckboxLife',
			'change 		#checkbox-seguro' 					: 'changeCheckboxSeguro',
			'change 		#checkboxTipoSMGId' 				: 'changeTipoSMG',
			'click 			.botonCargaDeArchivos'              : 'showModalCargarArchivos'
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
			var $divProductosActivosId = $("#divProductosActivosId");
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

		keys : {
			'right+alt+shift'  	: 'nextTab',
			'left+alt+shift'  	: 'previousTab',
		},


		openProcessClick: function () {
			var nextTabUrl = SettingsModel.get("remove_tab_url").replace("#removeTab","#showProcesses");
			window.top.location.href= nextTabUrl;
		},

		openConsultationsClick: function () {
			var nextTabUrl = SettingsModel.get("remove_tab_url").replace("#removeTab","#showConsultations");
			window.top.location.href= nextTabUrl;
		},

		previousTab: function () {
			var nextTabUrl = SettingsModel.get("remove_tab_url").replace("#removeTab","#previousTab");
			window.top.location.href= nextTabUrl;
		},

		nextTab: function () {
			var nextTabUrl = SettingsModel.get("remove_tab_url").replace("#removeTab","#nextTab");
			window.top.location.href= nextTabUrl;
		},

		removeLinkProcess: function () {
			linkProcessId = null;
			$("#linkProcess").empty();
		},

		buildObject : function(form,entity) {

			var venta = form.serializeObject();
			venta.prospecto = entity;
			venta.idVenta = null;

			var detalle;
			venta.tipoVendedor = ProspectoUtil.getUserTipo();
			venta.medio.id = ProspectoUtil.getMedioPorUserTipo();
        	venta.canalOrigen.id = parseInt(venta.canalOrigen.id,10);
			venta.estado.id = venta.tipo.id === '1' ? 11 : 10;
			venta.ventaPura = 0;

			var userId = Session.getLocal('userId');
			var userName = Session.getLocal('userName');

			venta.process.variables.processInfo.registradoUsuario = userName;
			venta.process.variables.processInfo.registradoNombre = userId;
			venta.process.variables.vtaDirecta = venta.tipo.id === '1' ? 'true' : 'false';
			// venta.prodAct.activo = venta.prodAct.activo = "on" ? 1 : 0;
			venta.tipo.id = parseInt(venta.tipo.id,10);


			if(venta.polizaSeguro === "") {
				venta.polizaSeguro = null;
			}

			if(venta.productoSeguro === "") {
				venta.productoSeguro = null;
			}

			if(venta.polizaLife === "") {
				venta.polizaLife = null;
			}

			if(venta.fechaLife === ""){
				venta.fechaLife = null;
			}
			else{
				if(venta.fechaLife != null) {
					var momentDate = moment(venta.fechaLife, "DD/MM/YYYY");
					venta.fechaLife = momentDate.format("YYYY-MM-DDTHH:mm:ss");
				}
			}

			if(venta.fechaSeguros === ""){
				venta.fechaSeguros = null;
			}
			else{
				if(venta.fechaSeguros != null) {
					var momentDate = moment(venta.fechaSeguros, "DD/MM/YYYY");
					venta.fechaSeguros = momentDate.format("YYYY-MM-DDTHH:mm:ss");
				}
			}

			if(venta.fechaAseguradora != null && venta.fechaAseguradora != "") {
				var momentDate = moment(venta.fechaAseguradora, "DD/MM/YYYY");
				venta.fechaAseguradora = momentDate.format("YYYY-MM-DDTHH:mm:ss");
			}

			if (!venta.asesor.legajo.trim()) {
				delete venta.asesor;
			}

			/*hasta acá*/
			if(archivosParaCargar !== undefined && archivosParaCargar.length > 0) {
				venta.rudiFiles = archivosParaCargar;
			}

			detalle = '<status Pendiente>'+entity.apellido+', '+entity.nombre+" - "+entity.docTipo+"-"+entity.docNum+" - "+venta.observacion;

			//CREO EL OBJETO PROCESS DE JBPM
			venta.process.id = null;
			venta.process.processId = null;
			venta.process.key = null; //este lo actualiza el esb
			venta.process.start = new Date().getTime();
			venta.process.observaciones = venta.inquietud;
			venta.process.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle;

			venta.process.variables.tipoVta = venta.tipo.id.toString();
			venta.process.variables.workContext = venta.tipo.id === 1 ? 'AMB_OV_DVC' : 'AMB_OV_ASISTENTE';

			venta.process.variables.processInfo.afiliado=  entity.nombreCompleto,
			venta.process.variables.processInfo.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle,
			venta.process.variables.processInfo.seguimiento = [];
			venta.process.credencial = 'PRO-' + venta.prospecto.pk.idProsp;
			venta.process.variables.processInfo.credencial = 'PRO-' + venta.prospecto.pk.idProsp;
			venta.credencial = 'PRO-' + venta.prospecto.pk.idProsp;

			//IMPRIMO POR CONSOLA EL JSON DE venta QUE VOY A POSTEAR
			Util.debug("venta",venta);
			Util.debug("ventaString",JSON.stringify(venta));

			return venta;
		},

		seleccionarReglaYMensaje: function(){
			var $checkboxTipoSMGId = $("#checkboxTipoSMGId");
			var $checkboxSeguro = $("#checkbox-seguro");
			var $checkboxLife = $("#checkbox-life");
			var $tipoDeVentaSeleccionado = $("#tipoDeVta option:selected");

			if($tipoDeVentaSeleccionado.text()==="Asistida"){
				Util.debug("Validación para Asistida...");
				if($checkboxTipoSMGId.is(":checked")){
					if($checkboxSeguro.is(":checked")){
						reglasSMGAsistida["polizaSeguro"] = {required:true};
						mensajesSMGAsistida["polizaSeguro"] = {required:"Ingrese póliza"};

						reglasSMGAsistida["fechaSeguros"] = {
//							menorOIgualQue : 'TODAY4',
							required : true
						};
						mensajesSMGAsistida["fechaSeguros"] = {
//							menorOIgualQue : 'Ingrese fecha valida',
							required : "Ingrese fecha de vigencia"
						};
						reglasSMGAsistida['productoSeguro'] = {
							required : true
						};
						mensajesSMGAsistida['productoSeguro'] = {
							required : "Ingrese Producto Seguro"
						};

					}

					if($checkboxLife.is(":checked")){
						reglasSMGAsistida["polizaLife"] = {required:true};
						mensajesSMGAsistida["polizaLife"] = {required:"Ingrese póliza"};

						reglasSMGAsistida["fechaLife"] = {
//							menorOIgualQue : 'TODAY4',
							required : true
						};
						mensajesSMGAsistida["fechaLife"] = {
//							menorOIgualQue : 'Ingrese fecha valida',
							required : "Ingrese fecha de vigencia"
						};

					}

					validate.rules = reglasSMGAsistida;
					validate.messages = mensajesSMGAsistida;
				}else{
					validate.rules = reglasNOSMGAsistida;
					validate.messages = mensajesNOSMGAsistida;
				}
			}else if($tipoDeVentaSeleccionado.text()==="Directa"){
				Util.debug("Validación para Directa...");
				if($checkboxTipoSMGId.is(":checked")){
					if($checkboxSeguro.is(":checked")){
						reglasSMGDirecta["polizaSeguro"] = {required:true};
						mensajesSMGDirecta["polizaSeguro"] = {required:"Ingrese póliza"};

						reglasSMGDirecta["fechaSeguros"] = {
							required : true
						};
						mensajesSMGDirecta["fechaSeguros"] = {
							required : "Ingrese fecha de vigencia"
						};
						reglasSMGDirecta['productoSeguro'] = {
							required : true
						};
						mensajesSMGDirecta['productoSeguro'] = {
							required : "Ingrese Producto Seguro"
						};

					}

					if($checkboxLife.is(":checked")){
						reglasSMGDirecta["polizaLife"] = {required:true};
						mensajesSMGDirecta["polizaLife"] = {required:"Ingrese póliza"};

						reglasSMGDirecta["fechaLife"] = {
							required:true
						};
						mensajesSMGDirecta["fechaLife"] = {
							required : "Ingrese fecha de vigencia"
						};

					}

					validate.rules = reglasSMGDirecta;
					validate.messages = mensajesSMGDirecta;
				}else{
					validate.rules = reglasNOSMGDirecta;
					validate.messages = mensajesNOSMGDirecta;
				}

			}else{
				Util.debug("Validación para Seleccione...");
				validate.rules = rulesSave;
				validate.messages = messagesSave;
			}
		},

		save: function () {
			var target = $("#toolbarLogin");
			Util.blockBody();
	    	target.append("<img src='../static/images/pleasewait.gif'/>");

			if(typeEntity === 'Prospecto'){

				var form = $("#validation-form");
				form.removeData("validator");
				this.seleccionarReglaYMensaje();
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
/*				var fechaValidaDeValidador = true;
				$.validator.addMethod("menorOIgualQue", function (value, element, params) {
					var desde, hasta, returnValue;
					if (params === "TODAY4") {
						hasta = moment().subtract("months", 4)
					} else {
						Util.error("No se definio el parametro: "+params);
					}
					desde = moment(value,"DD-MM-YYYY");

					fechaValidaDeValidador = desde <= hasta;

					return fechaValidaDeValidador;
				}, 'Debe ser menor que {0}.');*/

				form.validate(validate);

				if($("#cantidadArchivos").text()==="Cantidad de archivos adjuntos: 0"){
					cantArchivosCargados = 0;
				}else{
					cantArchivosCargados = 1;
				}

				// Prepara para controlar que la cantidad de archivos cargados sea > 0
//				var cantArchivosValido = false;

				var $checkboxProductosActivosId = $("#checkboxProductosActivosId");
				var $checkboxTipoSMGId = $("#checkboxTipoSMGId");
				var $tipoDeVentaSeleccionado = $("#tipoDeVta option:selected")

/*				if($checkboxProductosActivosId.is(":checked") &&
						!$checkboxTipoSMGId.is(":checked") &&
						cantArchivosCargados === 0 &&
						($tipoDeVentaSeleccionado.text()==="Directa" || $tipoDeVentaSeleccionado.text()==="Asistida")){
					cantArchivosValido = false;
				}else{
					cantArchivosValido = true;
				}*/

				if(!form.valid()){
					// Se muestra acá por que el valid limpia

/*					if(cantArchivosValido){
						$("#msgCantidadArchivos").css("display","none")
						$("#labelPoliza").removeClass("custom-help");
					}else{
						$("#labelPoliza").addClass("custom-help");
						$("#msgCantidadArchivos").css("display","block");
					}

					if(!fechaValidaDeValidador){
						$.gritter.add({
							title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text: 'La fecha de vigencia de la póliza, deberá ser mayor a 4 meses de la fecha actual',
							class_name: 'gritter-warning'
						});
					}else{
						$.gritter.add({
							title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text: 'Por favor ingrese los datos necesarios',
							class_name: 'gritter-warning'
						});
					}*/

					$.gritter.add({
						title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text: 'Por favor ingrese los datos necesarios',
						class_name: 'gritter-warning'
					});

					Util.unBlockBody();
			    	target.empty();
				}else{

					var generico = this.buildObject(form,prospecto);
					Util.debug(JSON.stringify(generico));
					//LLAMO AL SERVICIO DE GRABACION DEL LLAMADO
					var processInstance;

					if($checkboxTipoSMGId.is(":checked")){
						// Borro lo que no debe viajar acá
						generico.aseguradora = null;
						generico.fechaAseguradora = null;
						generico.rudiFiles = null;

						if(generico.polizaSeguro !=null && generico.polizaSeguro !== ""){
							generico.polizaSeguro = parseInt(generico.polizaSeguro,10);
						}

						if(generico.polizaLife !=null && generico.polizaLife !== ""){
							generico.polizaLife = parseInt(generico.polizaLife,10);
						}

					}else{
						if(generico.aseguradora !=null && generico.aseguradora !== ""){
							generico.aseguradora = parseInt(generico.aseguradora,10);
						} else {
							generico.aseguradora = null;
						}
						// Borro lo que no debe viajar acá
						//generico.checkbox-seguro = null;
						generico.polizaSeguro = null;
						generico.fechaSeguros = null;

						//generico.checkbox-life = null;
						generico.polizaLife = null;
						generico.fechaLife = null;
					}

					Util.debug(generico);

				

					FuseService.crearProceso(
						generico,
						true,
						function(data) {
							processInstance = data;
							
							Util.unBlockBody();
				    		target.empty();
							
							var body =  generico.process.detalle;
							var subject = "Creacion del proceso";
							var processId = processInstance.jbpmProcess;
							var userName = Session.getLocal('userName');
							var recipientsArray = [];recipientsArray.push(processId);
							MessagesService.sendMessage(subject,body,processId,userName,recipientsArray);

                                bootbox.dialog("Se gener\u00F3 el n\u00FAmero de Tr\u00E1mite "+processInstance.jbpmProcess, [{
									"label" : "Aceptar",
									"class" : "btn-small btn-success",
									"callback": function() {
										//CREANDO URL PARA REMOVER TAB EN GPS2014
										var removeTabUrl = SettingsModel.get("remove_tab_url")+$("#id").val();
										window.top.location.href= removeTabUrl;
									}
								}]
							);

							if (!prospecto.bloqueado) {
								ProspectoService.bloquearProspecto(prospecto.pk,true);
							}
						},
						function( xhr,err ) {
			        		
			        		//ERROR EL SERVICIO NO RESPONDE, ENVIO EL MENSAJE DE ERROR
			        		Util.error( 'Sample of error data:', err );
			        		Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
			        		
							Util.unBlockBody();
				    		target.empty();
				    		
				    		$.gritter.add({
								title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
								text: 'No se pudo grabar el llamado',
								class_name: 'gritter-warning'
							});
						}						
					);

				}
			}else{
				Util.unBlockBody();
			    target.empty();
			    $.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text: 'No existe un prospecto seleccionado',
					class_name: 'gritter-warning'
				});
			}
		},
		

		list: function (id,idSubmotive){

			var processTypes;
			var processNameJBPM;
			var encontrado = false;
			var finalize;
			var submotive;
			var motive;
			var workcontext;
			var self = this;

			prospecto = $.parseJSON(Session.getLocal("Entity"));
			entityId = Session.getLocal("entityId");
			typeEntity = Session.getLocal("TypeEntity");

			
			var array = [];
			
			$.ajax({
				url: 'process.json?date='+new Date(),
				type:'GET',
				async: false,
				success:function (data) {
					
				   	processTypes = eval( data );
				   	Util.debug("processTypes:", processTypes, id);
		        	for (var i=0;i<processTypes.length;i++){
					   	array.push(processTypes[i].id);
		        		if(processTypes[i].id === id){
		        			encontrado = true;
		        			motive = processTypes[i].processName;
		        			finalize = processTypes[i].choisefinalize;
							hasSubmotive = processTypes[i].hasSubmotive;
							processNameJBPM = processTypes[i].processNameJBPM;
							workcontext =  processTypes[i].workcontext;
		        		}
					}
				},
			    error: function( xhr,err ) {
			        Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			        Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			    }
			});
	
			Util.debug(JSON.stringify(array));
					
			if(encontrado){
				var userId = Session.getLocal('userId');
				var userName = Session.getLocal("userName");

				EmpresasService.getProductorByUserName(userName,
				function (productor) {
					Util.debug("productor", productor);
					$("#content1").empty ();
					$("#content1").append (self.render (id,motive,userId,productor,finalize,hasSubmotive,idSubmotive,workcontext,processNameJBPM).el);
					archivoController = new ArchivoController({id: "RUDI"});
					archivoController.setRudiTipoTrm("VPI");
					archivoController.container = "modalCargarImagenesDiv";
					archivoController.notaAlPie = "Nota: Recuerde que puede adjuntar hasta 5 archivos de 3mb cada uno. El formato de archivo aceptado es [Nombre de archivo sin espacio al final].[Extensiones permitidas jpg, jpeg, png, tiff, tif, bmp, pdf]. Ejemplo: [miarchivo.jpg] Caracteres no permitidos: ~ ` ! @ # $ % ^ & * ( ) + = < > ? ¿ : \ \" { } | , / ; ' [ ] —";
					archivoController.setArchivosCallBack=function(){
						archivosParaCargar=archivoController.getArchivos();
						Util.debug("ARCHIVOS PARA CARGAR", archivosParaCargar);
						$("#cantidadArchivos").text("Cantidad de archivos adjuntos: " + archivosParaCargar.length);
						
						$("#adjuntaImagenes").focusout();
					};
					archivoController.initModal();
					
					$("#opcionesArchivos").append('<div id="webCam" style="display:inline-block" data-rel="tooltip" title="Capturar im\u00E1genes" data-toggle="dropdown" data-placement="top"></div><br/>');
					var webCamView = new WebCamView();
					webCamView.showComponent("1","webCam",function (img, size) {
						archivoController.agregarFoto(img, size, false);
					});
				},
				function (xhr,err,urlRest,typeCall) {
					Util.error( 'Sample of error data:', err );
					Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
					$("#content1").empty();
					if(xhr.status == 409){
						$("#content1").append (self.renderError (xhr.status,"Error","El usuario de red se encuentra asignado a mas de un promotor, por favor comunicarse con el administrador").el);
					}else{
						$("#content1").append (self.renderError (xhr.status,'Error desconocido','Error es desconocido para el sistema').el);
					}
				},
				function (data) {
				});
			}else{
				Backbone.history.navigate('error', { trigger : true });
		      	$("#content1").empty ();
				var compiledTemplate = Handlebars.compile(motiveNotFoundTemplate);
				$("#content1").html (compiledTemplate());
			}
       	},

		renderError: function (codeError,titleError,descriptionError){
			var compiledTemplate = Handlebars.compile(errorTemplate);
			this.$el.html (compiledTemplate({codeError: codeError,titleError: titleError, descriptionError: descriptionError}));
			return this;
		},

		// Render method.
        render: function (id,motive,userId,productor,finalize,hasSubmotive,idSubmotive,workcontext,processNameJBPM){
        	var compiledTemplate = Handlebars.compile(formTemplate);

			var userName = Session.getLocal("userName");
			var entorno = SettingsModel.get("entorno");
			var subsidiary = Session.getLocal("subsidiary");
			var subsidiaryId = Session.getLocal("subsidiaryId");
			var aseguradoras;
        	
			$('#version-container').empty();
			
		   	$.ajax({
		    	type: "GET" ,
		    	url: "META-INF/maven/pom.xml?date="+new Date().getTime(),
		    	dataType: "xml" ,
		    	success: function(xml) {
				    $('#version-container').append(entorno+"-"+$(xml).find('version').eq(1).text());
		    	},
		    	error:function(date) {
		    		$('#version-container').remove();
		    	}
			});

			$.ajax({
				type: "GET" ,
				url: "aseguradoras.json?date="+new Date().getTime(),
				async: false,
				success : function(data) {
					aseguradoras = eval(data);
				},
				error : function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}
			});

			Util.debug(aseguradoras);

	      	this.$el.html (compiledTemplate({
				id: id,
				entity: prospecto,
				entityId : entityId,
				productor: productor,
				motive: motive,
				userId: userId,
				userName: userName,
				subsidiary: subsidiary,
				subsidiaryId: subsidiaryId,
				finalize: finalize,
				hasSubmotive: hasSubmotive,
				idSubmotive: idSubmotive,
				workcontext: workcontext,
				processNameJBPM: processNameJBPM,
				aseguradoras: aseguradoras,
				archivosParaCargar: archivosParaCargar
			}));
	      	
			return this;
       	}
		
    });
    
    return newView;
});

//@ sourceURL=vtaProductoresIndividuo.js