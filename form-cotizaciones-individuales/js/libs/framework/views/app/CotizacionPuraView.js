define(['jquery',
 	'underscore',
  	'backbone',
    'handlebars', 
    'bootstrap',
    'ace', 
    'encoding', 
	'/form-cotizaciones-individuales/js/libs/settings.js',
	'util',
	'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/cotizacionPuraTemplate.html',
	'session', 
	'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/fila.html', 
	'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/listPlanesTemplate.html',
	'/static/js/libs/thirds/jquery/moment-with-locales.js',
	'/static/js/libs/services/phoneService.js',
	'/form-cotizaciones-individuales/js/libs/framework/views/helpers/ovUtil.js',
	'/form-smg-commons/js/libs/services/fuseService.js',
	'/form-smg-commons/js/libs/services/obraSocialService.js',
	'/form-smg-commons/js/libs/services/prospectoService.js'
], 
function($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, CotizacionPuraTemplate, Session, Fila, ListPlanesTemplate,Moment, PhoneService, OvUtil, FuseService, ObraSocialService, ProspectoService) {


	var contacto = null, cotizacion = null, obrasSociales = [], proceso = null, firstWizardEntry = true, 
	
	validate = {
		errorElement : 'span',
		errorClass : 'help-inline',
		focusInvalid : false,
		rules : null,
		messages : null,
		invalidHandler : function(event, validator) {//display error alert on form submit
		},
		highlight : function(e) {
			$(e).closest('.control-group').removeClass('info').addClass('error');
		},
		success : function(e) {
			$(e).closest('.control-group').removeClass('error').addClass('info');
			$(e).remove();
		},
		errorPlacement : function(error, element) {
			if (element.is(':checkbox') || element.is(':radio')) {
				var controls = element.closest('.controls');
				if (controls.find(':checkbox,:radio').length > 1) {
					controls.append(error);
				}else {
					error.insertAfter(element.nextAll('.lbl:eq(0)').eq(0));
				}
			} else if (element.is('.select2')) {
				error.insertAfter(element.siblings('[class*="select2-container"]:eq(0)'));
			} else if (element.is('.chzn-select')) {
				error.insertAfter(element.siblings('[class*="chzn-container"]:eq(0)'));
			} else {
				error.insertAfter(element);
			}
		},

		submitHandler : function(form) {
		},
		invalidHandler : function(form) {
		}
	}, 
	
	validatParent = {
		errorElement : 'span',
		errorClass : 'help-inline',
		focusInvalid : false,
		rules : null,
		messages : null,
		invalidHandler : function(event, validator) {//display error alert on form submit
		},
		highlight : function(e) {
			$(e).closest('.control-group').removeClass('info').addClass('error');
		},
		success : function(e) {
			$(e).closest('.control-group').removeClass('error').addClass('info');
			$(e).remove();
		},
		errorPlacement : function(error, element) {
			if (element.is(':checkbox') || element.is(':radio')) {
				var controls = element.closest('.controls');
				if (controls.find(':checkbox,:radio').length > 1) {
					controls.append(error);
				}else {
					error.insertAfter(element.nextAll('.lbl:eq(0)').eq(0));
				}
			} else if (element.is('.select2')) {
				error.insertAfter(element.siblings('[class*="select2-container"]:eq(0)'));
			} else if (element.is('.chzn-select')) {
				error.insertAfter(element.siblings('[class*="chzn-container"]:eq(0)'));
			} else {
				error.insertAfter(element);
			}
		},

		submitHandler : function(form) {
		},
		invalidHandler : function(form) {
		}
	}, 
	
	customRules = {
		'contacto[apellido]' : {
			required : true
		},
		'contacto[nombre]' : {
			required : true
		},
		'contacto[zona]' : {
			required : true
		},
		'contacto[telefono][numero]' : {
			required : true
		}

	}, 
	
	customMessages = {

		'contacto[apellido]' : {
			required : "Ingrese el apellido."
		},
		'contacto[nombre]' : {
			required : "Ingrese el nombre."
		},
		'contacto[zona]' : {
			required : "Ingrese la zona."
		},
		'contacto[telefono][numero]' : {
			required : "Ingrese el Teléfono."
		},
		'contacto[zona]' : {
			required : "Ingrese la Zona."
		}
	}, 
	
	cotizacionPuraView = Backbone.View.extend({

		events : {
			'change		#fuelux-wizard' : 'nextStep',
			'finished 	#fuelux-wizard' : 'finishedStep',
			'click		.spNuevoIndividuo' : 'addNewRowCotizacion',
			'click		.spDelIndividuo' : 'delRowCotizacion',
			'change  	.habilitar-remuneracion' : 'habilitarRemuneracion',
			'change  	.habilitar-obra-social' : 'habilitarOSocial',
		},

		keys : {
			'x+alt+shift' : 'closeTask',
			'right+alt+shift' : 'nextTab',
			'left+alt+shift' : 'previousTab'
		},

		closeTask : function() {
			bootbox.confirm("¿Está seguro que desea cerrar el formulario?…", function(result) {
				if (result) {
					var removeTabUrl = SettingsModel.get("remove_tab_url") + $("#id").val() + "/" + entity.contra.trim().replace(/^0+/, '');
					window.top.location.href = removeTabUrl;
				}
			});
		},

		previousTab : function() {
			var nextTabUrl = SettingsModel.get("remove_tab_url").replace("#removeTab", "#previousTab");
			window.top.location.href = nextTabUrl;
		},

		nextTab : function() {
			var nextTabUrl = SettingsModel.get("remove_tab_url").replace("#removeTab", "#nextTab");
			window.top.location.href = nextTabUrl;
		},

		habilitarOSocial : function(e) {
			Util.info('habilitarOSocial ' + e);

			var integrante = $(event.target).closest('select').attr('data-integrante');
			Util.info('#slParentescos_' + integrante);

			var paren = $('#slParentescos_' + integrante).val(), os = $('#slCondiciones_' + integrante).val();
			// remun = $('#txtRemuneracion_' + integrante);
			Util.info(paren, os);

			if (paren === 'T' || paren === 'E') {
				$('#slCondiciones_' + integrante).removeAttr("disabled");
			} else {
				$('#slCondiciones_' + integrante).attr("disabled", "disabled");
			}
		},

		habilitarRemuneracion : function(e) {
			Util.info('habilitarRemuneracion ' + e);

			var integrante = $(event.target).closest('select').attr('data-integrante');
			Util.info('#slParentescos_' + integrante);

			var paren = $('#slParentescos_' + integrante).val(), os = $('#slCondiciones_' + integrante).val(), remun = $('#txtRemuneracion_' + integrante);
			Util.info(paren, os);

			if ((paren === 'T' || paren === 'E' ) && os !== "-1") {
				remun.removeAttr("disabled");
			} else {
				remun.attr("disabled", "disabled");
			}
		},

		cotizar : function(contacto) {
			var cotizaciones;
			var solicitud = this.buildObject(contacto);
		
	

			FuseService.crearProceso(
				solicitud,
				false,
				function(data) {
					cotizaciones = eval(data);
					Util.info(cotizaciones);
				},
				function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}						
			);




			if (cotizaciones === undefined) {
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Ha ocurrido un problema en Afilmed, por favor contacte al área de Planeamiento para su análisis.',
					class_name : 'gritter-warning'
				});
				return;
			}

			if (cotizaciones.mapBodyResponseBundleEspecifico.cotizaciones != null) {
				var cotizacionesNews = [];
				Util.info("COTIZ: ", cotizaciones);
				this.proceso = cotizaciones.jbpmProcess;

				for (var i = 0; i < cotizaciones.mapBodyResponseBundleEspecifico.cotizaciones.length; i++) {
					var contiz = cotizaciones.mapBodyResponseBundleEspecifico.cotizaciones[i];
					var codi = contiz.plan_codi;

					for (var j = 0; j < cotizaciones.mapBodyResponseBundleEspecifico.cotizaciones.length; j++) {
						var contiz2 = cotizaciones.mapBodyResponseBundleEspecifico.cotizaciones[j];
						var codi2 = contiz2.plan_codi;
						if (codi === codi2 && contiz.inte !== contiz2.inte) {
							if (contiz2.comp_grupo === 'FAMILIAR A CARGO') {
								if (contiz.pagarFamiliar === undefined) {
									contiz.pagarFamiliar = contiz2.valor_detalle;
								} else {
									contiz.pagarFamiliar = contiz.pagarFamiliar + contiz2.valor_detalle;
								}
								contiz.valor_iva = contiz.valor_iva + contiz2.valor_iva;
							}
						}
					}
					contiz.valorTotal = contiz.valor_detalle + ((contiz.pagarFamiliar !== undefined) ? contiz.pagarFamiliar : 0) + contiz.valor_iva - contiz.valor_aporte;
					var posi = cotizacionesNews.length;
					if (posi === 0) {
						cotizacionesNews.push(contiz);
					} else {
						var p = posi - 1;
						if (cotizacionesNews[p].plan_codi !== contiz.plan_codi) {
							cotizacionesNews.push(contiz);
						}
					}
				}

			} else {
				Util.error("Error: " + cotizaciones.mapBodyResponseBundleEspecifico.deno_error);
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Ha ocurrido un problema en Afilmed, por favor contacte al área de Planeamiento para su análisis.',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				return cotizaciones.mapBodyResponseBundleEspecifico;
			}

			return cotizacionesNews;
		},

		buildObject : function(contacto) {
			var solicitud = {};
			solicitud.tipoCotizador = 0;
			solicitud.secuencia = 1;
			solicitud.zona = parseInt($("#zona").val(),10);
			solicitud.cuit = null;
			solicitud.nombre = $("#txtNombre").val();
			solicitud.apellido = $("#txtApellido").val();
			solicitud.dni = {};
			solicitud.dni.tipo = $("#tipoDoc").val();
			if ($("#txtDocumento").val() !== "") {
				solicitud.dni.numero = parseInt($("#txtDocumento").val(),10);
			} else {
				solicitud.dni.numero = 0;
			}
			solicitud.telefono = {};
			solicitud.telefono.tipo = $("#tipoTelefono").val();
			solicitud.telefono.pais = $("#celPais").val();
			solicitud.telefono.nacional = $("#celNac").val();
			solicitud.telefono.numero = $("#celNum").val();
			solicitud.telefono.extension = $("#celExt").val();
			solicitud.codProductor = "A01";
			solicitud.codAsesor = "A01";
			solicitud.plan = null;
			solicitud.descuento = 0.0;
			solicitud.email = $("#email").val();
			solicitud.fecha = Moment().format("YYYYMMDD");
			solicitud.grupoFamiliar = contacto.individuos;
			var inte = 1;
			var individuosFinales = [];
			for (var i = 0; i < solicitud.grupoFamiliar.length; i++) {
				if (solicitud.grupoFamiliar[i] !== undefined) {
					solicitud.grupoFamiliar[i].inte = parseInt(inte,10);
					inte = inte + 1;
					solicitud.grupoFamiliar[i].edad = parseInt(solicitud.grupoFamiliar[i].edad,10);
					if (solicitud.grupoFamiliar[i].obraSocial === '-1' || Util.isEmpty(solicitud.grupoFamiliar[i].obraSocial)) {
						solicitud.grupoFamiliar[i].obraSocial = null;
					} else {
						solicitud.grupoFamiliar[i].obraSocial = parseInt(solicitud.grupoFamiliar[i].obraSocial,10);
					}
					if (solicitud.grupoFamiliar[i].remuneracion !== undefined) {
						solicitud.grupoFamiliar[i].remuneracion = parseFloat(solicitud.grupoFamiliar[i].remuneracion,10);
					} else {
						solicitud.grupoFamiliar[i].remuneracion = 0;
					}
					individuosFinales.push(solicitud.grupoFamiliar[i]);
				}
			}
			solicitud.grupoFamiliar = individuosFinales;

			var user = Session.getLocal("userName");
			var userId = Session.getLocal("userId");
			var supervisorAsesor = {};
			var supervisorSuperior = {};
			OvUtil.findSupervisor(user, function(supervisor) {supervisorAsesor = supervisor;});
			OvUtil.findSupervisor(supervisorAsesor.login, function(supervisor) {supervisorSuperior = supervisor;});
			solicitud.nombreAsesor = Util.getUserNameComplete(userId);
			solicitud.usernameAsesor = user;
			solicitud.usernameSupervisor = supervisorAsesor.login;
			solicitud.nombreSupervisor = supervisorAsesor.nombre;
			solicitud.usernameJefe = supervisorSuperior.login;
			solicitud.nombreJefe = supervisorSuperior.nombre;
			solicitud.process = {};
			solicitud.process.variables = {};
			solicitud.process.variables.workContext = 'AMB_COMERCIAL';
			solicitud.process.variables.finalizado = 'false';
			solicitud.process.variables.processInfo = {};
			solicitud.process.variables.processInfo.id = "0";
			solicitud.process.variables.processInfo.name = "OV-VA-Individuos";
			solicitud.process.variables.processInfo.descripcion = "OV-VA-Individuos";
			solicitud.process.variables.processInfo.procesoRelacionadoId = null;
			solicitud.process.variables.processInfo.atencionRelacionadaId = null;
			solicitud.process.variables.processInfo.registradoUsuario = user;

			solicitud.process.version = '1';
			solicitud.process.processName = 'OV-VA-Individuos';
			solicitud.process.status = 'Running';
			solicitud.process.workContext = 'AMB_COMERCIAL';
			solicitud.process.ambitoGestion = '';
			solicitud.process.id = null;
			solicitud.process.processId = null;
			solicitud.process.key = null;
			solicitud.process.start = new Date().getTime();
			solicitud.process.detalle = "";

			Util.debug("Contacto", solicitud);
			Util.debug("json Contacto", JSON.stringify(solicitud));
			return solicitud;
		},

		validarTelefono : function(codNac, numero) {

			var validado = false;
			var ph;
			PhoneService.validatePhone(null, null, null, null, codNac, numero,
			// provincia, partido, localidad, cp, prefijo, numero
			function(data) {
				ph = eval(data);
				validado = ph.validado === 'SI';
			}, function(xhr, err, urlRest, typeCall) {

			}, function(data) {

			});
			return validado;
		},

		nextStep : function(e, info) {
			
			Util.info("NEXT STEP");
			var self = this;
			event.stopPropagation();
			event.preventDefault();

			if ($('#fuelux-wizard').wizard('selectedItem').step === 1) {
				Util.info("step1");

				var form = $("#valid-form-1");

				validate.rules = customRules;
				validate.messages = customMessages;
				Util.debug(validate);
				form.validate(validate);

				if (!form.valid()) {
					$.gritter.add({
						title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text : 'Por favor ingrese los datos necesarios',
						class_name : 'gritter-warning'
					});
					Util.unBlockBody();
					return false;
				} else {

					if (true !== self.validarTelefono($("#celNac").val(), $("#celNum").val())) {

						bootbox.confirm("El tel\u00E9fono no se encuentra validado. ¿Desea continuar de todos modos?", "No", "S\u00ED", function(result) {
							if (result) {
								return true;
							} else {
								$('#fuelux-wizard').wizard('previous');
								return true;
							}
						});
					} else {
						var formName = $("#valid-form-1");
						var contacto = formName.serializeObject();
					}
				}
			}

			if (info.step === 2 && info.direction === 'next') {
				
				var conyuges = $(".parentezcoConyuge:selected").length;
				
				if (conyuges > 1) {
					$.gritter.add({
						title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text : 'No puede existir más de un conyuge',
						class_name : 'gritter-warning'
					});
					return false;
				} else {
					// Util.blockBody();
					var form2 = $("#valid-form-2");
					if (this.validateStep2()) {
						var formName = $("#valid-form-2");
						var contacto = formName.serializeObject();
						var coti = self.cotizar(contacto);
						var error, cotizaciones;
						if (coti.cod_error != null) {
							error = coti;
						} else {
							cotizaciones = coti;
						}
						var compiledTemplate = Handlebars.compile(ListPlanesTemplate);
						var fecha = Moment().format("YYYY/MM/DD");
						$("#valid-form-3").empty();
						$("#valid-form-3").append(compiledTemplate({
							cotizaciones : cotizaciones,
							proceso : this.proceso,
							fecha : fecha,
							error : error
						}));
					} else {
						$.gritter.add({
							title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text : 'Por favor ingrese los datos necesarios',
							class_name : 'gritter-warning'
						});
						return false;
					}
					// Util.unBlockBody();
				}
			}

		},

		finishedStep : function(e) {
			var self = this;
			event.stopPropagation();
			Backbone.history.navigate('', {
				trigger : true
			});

		},

		validateStep2: function () {
			var valid = true;
			var num = $('#hiddenCantidad').val();
			var numero = Number(num);

			for (var i = 0; i < numero; i++) {

				var edad = $('#txtEdad_' + i).val();
				var sexo = $('#slsexo_' + i).val();
				var paren = $('#slParentescos_' + i).val();
				var condicion = $('#slCondiciones_' + i).val();
				var remuneracionBruta = $('#txtRemuneracion_' + i).val();

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

		validarGrupoFamiliarOld : function() {
			var num = $('#hiddenCantidad').val();
			var numero = Number(num) - 1;

			var validacionParentesco = 'individuos[' + numero + '][edad]';

			var customRulesPro = {
				validacionParentesco : {
					required : true
				}
			};

			customMessages = {

				validacionParentesco : {
					required : "Ingrese el apellido."
				}
			};

			validatParent.rules = customRulesPro;
			validatParent.messages = customMessages;

			var form = $("#valid-form-2");
			form.validate(validatParent);
			if (!form.valid()) {
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Por favor ingrese los datos necesarios',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				return false;
			} else {
				return true;
			}

		},

		validarGrupoFamiliar : function(id) {
			var edad = $('#txtEdad_' + id).val();
			var sexo = $('#slsexo_' + id).val();
			if (edad === '' || sexo === '') {
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Por favor ingrese los datos necesarios',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				return false;
			}
			return true;
		},

		delRowCotizacion : function(e) {
			var id = '#' + $(event.target).closest('span').attr('name');
			$(id).remove();
			var idOld = $('.spNuevoIndividuo:last').attr("id");
			$("#"+idOld).show();
		},

		addNewRowCotizacion : function() {
			var id = $(event.target).closest('span').attr('name');
			if (this.validarGrupoFamiliar(id)) {

				Util.info("ADD NEW ROW COTIZACION");
				var num = $('#hiddenCantidad').val();
				var numero = Number(num);
				var nombrediv = 'divParent' + numero;
				$('#hiddenCantidad').val(numero + 1);
				var compiledTemplate = Handlebars.compile(Fila);
				obrasSociales = this.buscarObrasSociales();
				$("#dvGrupoFliar").append(compiledTemplate({
					nombrediv : nombrediv,
					obrasSociales : obrasSociales,
					integrante : numero
				}));
				$('#spNuevoIndividuo'+id).hide();
				Util.unBlockBody();
				target.empty();
			}
		},

		buscarObrasSociales : function() {
			var listado, i = 0;
			var osociales = ['OSPOCE', 'OSSEG', 'OSCEP', 'OSPADEP', 'OSDAAP', 'OSDO', 'OSSDEB', 'ASE', 'OSDEPYM', 'OSPREME', 'OSIM', 'OSEDEIV', 'OSTVLA'];

			var success = function(data) {
				listado = eval(data);

				for (i; i < listado.resultadoBusqueda.obrasSociales.length; i++) {
					for (var j = 0; j < osociales.length; j++) {
						if (listado.resultadoBusqueda.obrasSociales[i].sigla === osociales[j]) {
							obrasSociales.push(listado.resultadoBusqueda.obrasSociales[i]);
						}
					}
				}
			}

			var error = function(xhr, err) {
				Util.error('Sample of error data:', err);
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			}

			ObraSocialService.getObrasSociales(
				success, 
				error, 
				function(){}, 
				false
			);
			
			return obrasSociales;
		},

		// Render method.
		list : function(target) {
			var self = this;

			obrasSociales = self.buscarObrasSociales();

			target.empty();
			target.append(self.render(target, obrasSociales).el);
		},

		// Render method.
		render: function (target, obrasSociales) {
			var self = this, data = null, zonas;
			ProspectoService.getZonas("0", false,
			function (data) {
				zonas = eval(data);
			}, function (xhr, err, urlRest, typeCall) {
			}, function (data) {

			});

			var compiledTemplate = Handlebars.compile(CotizacionPuraTemplate);
			self.$el.html(compiledTemplate({
				zonas: zonas,
				obrasSociales: obrasSociales
			}));
			return this;
		},
		
	});

	return cotizacionPuraView;
}); 