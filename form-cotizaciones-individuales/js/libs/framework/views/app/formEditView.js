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
	     '/static/js/libs/thirds/jquery/numeral.min.js',
         'messagesService',
         '/static/js/libs/services/loginService.js',
         'text!libs/framework/templates/app/formEditTemplate.html',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/fila.html', 
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/listPlanesCotizadosTemplate.html',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/listPlanesCotizadosNuevamenteTemplate.html', 
		 'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/step2Template.html',          
         'text!libs/framework/templates/app/taskDetailTemplate.html',
         'text!libs/framework/templates/app/taskDetailIntegrantesTemplate.html',
         'text!libs/framework/templates/app/taskDetailPlanesTemplate.html',
         'text!libs/framework/templates/app/taskNotFoundTemplate.html',
         'text!libs/framework/templates/app/actorNotFoundTemplate.html',
         '/static/js/libs/thirds/jquery/moment-with-locales.js',
         'libs/framework/views/helpers/ovUtil', 
 		 'libs/framework/views/app/pdfView',
 		 '/form-smg-commons/js/libs/services/inboxService.js',
		 'session',
		 '/form-smg-commons/js/libs/services/fuseService.js',
		 '/form-smg-commons/js/libs/services/obraSocialService.js',
		 'text!/form-cotizaciones-individuales/process.json',
		 '/form-smg-commons/js/libs/services/cotizacionesService.js',
		 '/form-smg-commons/js/libs/services/prospectoService.js',
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, numeral, MessagesService, 
	LoginService, formEditTemplate, Fila, listPlanesCotizadosTemplate, listPlanesCotizadosNuevamenteTemplate, step2Template, 
	taskDetailTemplate, taskDetailIntegrantesTemplate, taskDetailPlanesTemplate, taskNotFoundTemplate, actorNotFoundTemplate, Moment, 
	OvUtil, PdfView, InboxService, Session, FuseService, ObraSocialService, ProcessJson, CotizacionesService,
	ProspectoService){
     		
	var processTypes;
	var id;
	var motive;
	var encontrado = false;
	var tomada = true;
	var finalize,submotive = false;
	var tasks = null;
	var workflowId;
	var process = null;
	var processesDetail;
	var processDetail;
	var saveStatus;
	var historialLlamadoPDF;
	var idProcess;
	var processNameJBPM;
	var workcontext;
	var allTasks;
	var statusSave;
	var prospecto = null, contacto = null, integrantes, cotizaciones = null, cotizacionSeleccionada = null, cotizacion = null, 
	entityId = null, idCotizacion = null, obrasSociales = [], zonas = null, processDetail = null;
	var asesor = {};
	
	function pad (str, max) {
		return str.length < max ? pad("0" + str, max) : str;
	}

	var validate = {
		errorElement : 'span',
		errorClass : 'help-inline',
		focusInvalid : false,
		rules : {},
		messages : {},
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
	};

	var rulesSearch = {
		'contacto[apellido]' : {
			required : function(element) {
				if ($("#txtProceso").val().trim() === "") {
					return true;
				} else {
					return false;
				}
			}
		},
		'nroProceso' : {
			required : function(element) {
				if ($("#txtApellido").val().trim() === "") {
					return true;
				} else {
					return false;
				}
			}
		}
	};

	var messagesSearch = {
		'contacto[apellido]' : {
			required : "El campo apellido es requerido"
		},
		'nroProceso' : {
			required : "El campo nro. de trámite es requerido"
		}
	};

	var rulesSaveTask = {
		'observacion': {
			required: true
		}
	};

	var messagesSaveTask = {
		'observacion': {
			required: "El campo observación es necesario."
		}
	};

	var rulesSaveAndEnd= {
		'process[action]': {
			required: true
		},
		'motivo[id]': {
			required: true
		}
	};

	var messagesSaveAndEnd  = {
	 	'process[action]' : {
			required : " "
		},
		'motivo[id]': {
			required: "El campo motivo es necesario."
		}
	};

	
    var newView = Backbone.View.extend ({
    	
		events: {
			'change		#fuelux-wizard' 				: 'nextStep',
			
			'click		.spNuevoIndividuo' 				: 'addNewRowCotizacion',
			'click		.spDelIndividuo' 				: 'delRowCotizacion',
			'change  	#zona' 							: 'cambiarACotizar',
			'change  	.cambiarSexo' 					: 'cambiarACotizar',
			'change  	.cambiarEdad' 					: 'cambiarACotizar',
			
			'change  	.habilitar-remuneracion' 		: 'habilitarRemuneracion',
			'change  	.habilitar-obra-social' 		: 'habilitarOSocial',
			'change		#actions'						: 'habilitarPorEstado',
			
			'click 		#btnSaveAndEndTask' 			: 'saveAndEndTask',
			'click 		#btnSaveTask'					: 'saveTask',
			'click 		#btnCloseTask'					: 'closeTask',
			'click 		#myTab li'						: 'showTab',
			'click 		#btnPrintTask'					: 'printTask',	
			'click		.exportPDF'						: 'exportPDF',
		},
		
		validateStep2 : function() {
			var valid = true;
			var zona = $('#zona').val();
			var num = $('#hiddenCantidad').val();
			var numero = Number(num);

			if (zona === "") {
				valid = false;
			}else{
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
							if (remuneracionBruta === ''){
								valid = false;
								break;
							}
						}
					}
			}
			}
			return valid;
		},

		habilitarPorEstado: function (e) {
			var ventaEstado = $("#actions option:selected").attr("id");

			if(ventaEstado === "action-1"){
				$(".labelPlanSelected").each(function() {
					$(this).show();
				});
			}else{
				$(".labelPlanSelected").each(function() {
					$(this).hide();
				});
			}

			if(ventaEstado === "action-2"){
				$("#divVentaMotivo").show();
			}else{
				$("#divVentaMotivo").hide();
			}
		},
		
		habilitarOSocial : function(e) {
			Util.info('habilitarOSocial ' + e);
			this.cambiarACotizar();

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
			this.cambiarACotizar();

			var integrante = $(event.target).closest('select').attr('data-integrante');
			Util.info('#slParentescos_' + integrante);

			var paren = $('#slParentescos_' + integrante).val(), os = $('#slCondiciones_' + integrante).val(), remun = $('#txtRemuneracion_' + integrante);
			Util.info(paren, os);

			if ((paren === 'T' || paren === 'E' ) && os !== -1) {
				remun.removeAttr("disabled");
			} else {
				remun.attr("disabled", "disabled");
			}
		},
		
		delRowCotizacion : function(e) {
			this.cambiarACotizar();
			var id = '#' + $(event.target).closest('span').attr('name');
			$(id).remove();
			var idOld = $('.spNuevoIndividuo:last').attr("id");
			$("#"+idOld).show();
		},

		addNewRowCotizacion : function() {
			this.cambiarACotizar();
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
			}
		},
		
		cambiarACotizar: function(){
			$("#btnNext").empty().append('Cotizar <i class="icon-arrow-right icon-on-right"></i>');
			$("#recotizar").val("true");
		},
		
		nextStep : function(e, info) {
			Util.info("NEXT STEP");
			var self = this;
			event.stopPropagation();
			event.preventDefault();
			
			$("#btnNext").show();
			$("#actionSelected").hide();
			
			if (info.step === 1 && info.direction === 'next') {
				
				var fecha = Moment().format("YYYY/MM/DD");
				var error, cotizaciones;
				var recotizar = $("#recotizar").val();
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
					if(recotizar === "false"){
						
						var compiledTemplate = Handlebars.compile(listPlanesCotizadosTemplate);
						
						idCotizacion = cotizacionSeleccionada[0].NRO_TRAMITE;
						Util.info("idCotizacion",idCotizacion, cotizacionSeleccionada);
	
						$("#div-form-3").empty();
						$("#div-form-3").append(compiledTemplate({
							processDetail: processDetail,
							cotizaciones : cotizacionSeleccionada
						}));
						
						setTimeout(function() {
			                $("#btnNext").hide(); 	
			                $("#actionSelected").show();
						},100);
						
					}else{
						
						var form2 = $("#valid-form-2");
						if (this.validateStep2()) {
	
							$("#div-form-3").empty();
							$("#recotizar").val("false");
							
							var formName = $("#valid-form-2");
							var contacto = formName.serializeObject();
							self.cotizar(contacto);
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
				}
			}

		},
		
		cotizar : function(contacto) {
			var cotizaciones;
			var self=this;
			var solicitud = this.buildObject(contacto);
			
			Util.blockBody();

			FuseService.crearProceso(
				solicitud,
				true,
				function(data) {
					cotizaciones = eval(data);
					Util.info("cotizaciones",cotizaciones);
					
					var fecha = Moment().format("YYYY/MM/DD");
					var error, cotizaciones;

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
						idCotizacion = cotizaciones.mapBodyResponseBundleEspecifico.cotizaciones[0].contactoId;
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
					}
											
					Util.unBlockBody();

					if (cotizacionesNews.cod_error != null) {
						error = cotizacionesNews;
					}
					
					self.getCommonsIntegrantesCotizacion(idCotizacion,
						function (data) {
							integrantes = data;
							processDetail.integrantes = integrantes;
						},
						function (xhr, err) {
							Util.error('Sample of error data:', err);
							Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						},
						function () {
						}
					);

					CotizacionesService.getCotizacion(idCotizacion,
						function (cotizaciones) {
							cotizacionSeleccionada = cotizaciones;
							var coti1, coti2;
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
							processDetail.cotizaciones = cotizaciones; 
						},
						function (xhr, err) {
							Util.error('Sample of error data:', err);
							Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						},
						function (data) { }
					);
		
					
					var compiledTemplate = Handlebars.compile(step2Template);
					$("#step1Content").empty();
					$("#step1Content").append(compiledTemplate({
						obrasSociales : obrasSociales,
						cotizacionSeleccionada: cotizacionSeleccionada,
						zonas: zonas,
						cantIntegrantes: integrantes.length - 1,
						integrantes: integrantes
					}));
					
					
					var compiledTemplate = Handlebars.compile(listPlanesCotizadosNuevamenteTemplate);
					
					$("#div-form-3").empty();
					$("#div-form-3").append(compiledTemplate({
						processDetail: processDetail,
						cotizaciones : cotizacionesNews,
						proceso : this.proceso,
						fecha : fecha,
						error : error
					}));
					

					
					setTimeout(function() {
		                $("#btnNext").hide(); 
		                $("#actionSelected").show();	
					},100);
					
					
				},
				function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					
					$.gritter.add({
						title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text : 'Ha ocurrido un problema en Afilmed, por favor contacte al área de Planeamiento para su análisis.',
						class_name : 'gritter-warning'
					});
					
					$("#div-form-3").empty();
					
					Util.unBlockBody();
				}						
			);

		},
		
		
		printTask: function () {
			var self = this;
			var doc = new jsPDF();
			
			numeral.language('es', {
			    delimiters: {
		            thousands: '.',
		            decimal: ','
		        },
		        abbreviations: {
		            thousand: 'k',
		            million: 'mm',
		            billion: 'b',
		            trillion: 't'
		        },
		        ordinal: function (number) {
		            var b = number % 10;
		            return (b === 1 || b === 3) ? 'er' :
		                (b === 2) ? 'do' :
		                (b === 7 || b === 0) ? 'mo' : 
				(b === 8) ? 'vo' :
				(b === 9) ? 'no' : 'to';
		        },
		        currency: {
		            symbol: '$'
		        }
			});
			
		
			numeral.language('es');
			
			doc.setFontSize(8);
			doc.text(10, 8, 'PROCESO '+motive.toUpperCase() + " #" +idProcess);
			var pos = 12;
            
			// Filled red square
			doc.setDrawColor(0);
			doc.setFillColor(96,96,96);
			doc.rect(10, pos, 190, 6, 'F'); 
			
			pos = pos + 5;
			
			doc.setFontSize(9);
			doc.setTextColor(255,255,255);
			doc.text(20, pos, "DATOS DEL PROSPECTO");
			doc.setTextColor(255,255,255);
			doc.setTextColor(255,255,255);
			
			pos= pos +1;
			
			var dark = true;
			
			doc.setDrawColor(0);
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Apellido y Nombre:");
			doc.text(55, pos+5, prospecto.apellido + ", " + prospecto.nombre);
			doc.text(120, pos+5, "DU:");
			doc.text(155, pos+5, prospecto.docNum.toString());
			
			pos= pos+6;							
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Dirección:");
			doc.text(55, pos+5, prospecto.domicilio.calle);
			doc.text(120, pos+5, "Nro.:");
			doc.text(155, pos+5, prospecto.domicilio.nro.toString());
			
			pos= pos+6;
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Pais:");
			doc.text(55, pos+5, prospecto.domicilio.pais);
			doc.text(120, pos+5, "Provincia:");
			doc.text(155, pos+5, prospecto.domicilio.provincia);
			
			pos= pos+6;
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Localidad:");
			doc.text(55, pos+5, prospecto.domicilio.localidad);
			doc.text(120, pos+5, "Partido:");
			doc.text(155, pos+5, prospecto.domicilio.partido);
			
			pos= pos+6;
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Barrio:");
			doc.text(55, pos+5, prospecto.domicilio.barrio ? prospecto.domicilio.barrio : "");
			doc.text(120, pos+5, "Código Postal:");
			doc.text(155, pos+5, prospecto.domicilio.cp? prospecto.domicilio.cp : "");
			
			pos= pos+6;
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Teléfono:");
			doc.text(55, pos+5, prospecto.telefonos[0].codigo_pais + " - " + prospecto.telefonos[0].codigo_nacional +" - "+ prospecto.telefonos[0].numero);
			doc.text(120, pos+5, "Email:");
			doc.text(155, pos+5, prospecto.emails[0].denominacion);
			
			pos= pos+6;				

			doc.setFillColor(255,255,255);
			doc.rect(10, pos, 190, 6, 'F');
			
			pos= pos+6;
            
			var prettyDate;
			var d = new Date(processDetail.alta_fecha);
			var curr_date = d.getDate();
			if (curr_date < 10) {
				curr_date = '0' + curr_date;
			}
			var curr_month = d.getMonth() + 1;
			//Months are zero based
			if (curr_month < 10) {
				curr_month = '0' + curr_month;
			}
			var curr_year = d.getFullYear();
			var hour = d.getHours();
			if (hour < 10) {
				hour = '0' + hour;
			}
			var minutes = d.getMinutes();
			if (minutes < 10) {
				minutes = '0' + minutes;
			}
			if (hour === '00' && minutes === '00') {
				prettyDate = curr_date + '/' + curr_month + '/' + curr_year;
			} else {
				prettyDate = curr_date + '/' + curr_month + '/' + curr_year + ' ' + hour + ':' + minutes;
			}
		
			if(pos > 240){
			  doc.addPage();
              pos = 10;
			}

			// Filled red square
			doc.setDrawColor(0);
			doc.setFillColor(96,96,96);
			doc.rect(10, pos, 190, 6, 'F'); 
			
			pos = pos + 5;
			
			doc.setFontSize(9);
			doc.setTextColor(255,255,255);
			doc.text(20, pos, prettyDate);
			doc.setTextColor(255,255,255);
			doc.setTextColor(255,255,255);
			
			pos= pos +1;
			
			var dark = true;
			
			doc.setDrawColor(0);
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Registrado por:");
			doc.text(55, pos+5, processDetail.VtaPura_usuario);
			doc.text(120, pos+5, "Sucursal:");
			doc.text(155, pos+5, processDetail.VtaPura_sucursal);
			
			pos= pos+6;				

			doc.setFillColor(255,255,255);
			doc.rect(10, pos, 190, 6, 'F');
			
			pos= pos+6;
            
			if(pos > 240){
			  doc.addPage();
              pos = 10;
			}

			// Filled red square
			doc.setDrawColor(0);
			doc.setFillColor(96,96,96);
			doc.rect(10, pos, 190, 6, 'F'); 
			
			doc.setFontSize(9);
			doc.setTextColor(255,255,255);
			doc.text(20, pos+5, "Individuo");
			doc.text(55, pos+5, "Sexo");
			doc.text(75, pos+5, "Edad");
			doc.text(100, pos+5, "Condición");
			doc.text(165, pos+5, "Remuneración");
			doc.setTextColor(255,255,255);
			doc.setTextColor(255,255,255);
			
			pos= pos +6;
			var integrantes = self.integrantes;			
            for (var i = 0; i < integrantes.length; i++) {
            	if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.rect(10, pos, 190, 6, 'F');
				
				doc.setFontSize(8);
				
				doc.setTextColor(0,0,0);
				doc.text(20, pos+5, integrantes[i].DENO_PAREN);
				doc.text(55, pos+5, integrantes[i].SEXO);
				doc.text(75, pos+5, integrantes[i].EDAD.toString());
				doc.text(100, pos+5, integrantes[i].ID_CONDICION ? integrantes[i].DESC_OS : "Directo");
				doc.text(165, pos+5, integrantes[i].REMUNERACION !== 0 ? integrantes[i].REMUNERACION.toString() : "");
				
				pos= pos +6;
            }
            
            if(processDetail.VtaPura_estado !== 2){
	            if(pos > 240){
				  doc.addPage();
	              pos = 10;
				}else{
					doc.setFillColor(255,255,255);
					doc.rect(10, pos, 190, 6, 'F');
					pos= pos+6;
				}
	
				doc.setDrawColor(0);
				doc.setFillColor(96,96,96);
				doc.rect(10, pos, 190, 6, 'F'); 
				
				doc.setFontSize(9);
				doc.setTextColor(255,255,255);
				
				doc.text(20, pos+5, "Plan Vendido");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, cotizacionSeleccionada[i].PLAN_OS);	
							}
						}else{
							doc.text(column, pos+5, cotizacionSeleccionada[i].PLAN_OS);
						}
					}
					column = column + 20;
				}
				
				doc.setTextColor(255,255,255);
				doc.setTextColor(255,255,255);
				
				pos= pos +6;
	
				//AGREGO UN NUEVO REGISTRO DE PLANES
				var dark = true;
				var format = '0,0.00';
				
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "Valor Detalle");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].VALOR_TOTAL).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].VALOR_TOTAL).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "Familiar a Cargo");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].VALOR_FLIAR_CARGO).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].VALOR_FLIAR_CARGO).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "Valor Total Plan");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].APORTES_DESC).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].APORTES_DESC).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "Aportes a Descontar");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].TOTAL).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].TOTAL).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "IVA");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].IVA).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].IVA).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				doc.setFillColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F'); 
				
				doc.setFontSize(9);
				doc.setTextColor(255,255,255);
										
				doc.text(20, pos+5, "Total a Pagar");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].TOTAL_A_COBRAR).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].TOTAL_A_COBRAR).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
            	
            }
			
            historialLlamadoPDF = doc.output('datauristring');

            $("#modal-form-edit").modal("show");
            $('#iframeEdit').attr('src', historialLlamadoPDF);

            var elemToChange = document.getElementById("iframeEdit");
            elemToChange.style.height = $(window).height() - 300 + "px";    
		},

		closeTask: function () {
			window.top.location.href= SettingsModel.get("open_task");
		},
		
		showTab: function (ev) {
			
			var id = ev.target.id;
			
			if(id === "formTabDetail"){
				this.showFormTabDetail();
			}else{
				if(id === "processTabDetail"){
					this.showProcessTabDetail();
				}else{
					this.showEntityTabDetail();
				}
			}
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
		

		getProcessDetail: function () {
			
		
			FuseService.getDetallePorProcessIdSMMP(
				idProcess,
				false,
				function(data) {
					processesDetail = data;
					processDetail = processesDetail[processesDetail.length-1];
					Util.debug("processDetail", processDetail);
				},
				function( xhr,err ) {
			    	encontrado = false;
			        Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			        Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			    }
			);


			self.getCommonsIntegrantesCotizacion(processDetail.id_cotizacion,
				function (data) {
					integrantes = data;
					processDetail.integrantes = integrantes; 
				},
				function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					target.removeAttr ('style');
				},
				function () {
				}
			);

			CotizacionesService.getCotizacion(processDetail.id_cotizacion,
				function (cotizaciones) {
					cotizacionSeleccionada = cotizaciones;
					
					var coti1, coti2;

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
					
					processDetail.cotizaciones = cotizaciones; 
				},
				function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					target.removeAttr ('style');
				},
				function (data) { });	
		},
		
		getIntegrantes: function (){
			var self = this;
			
			for (var i = 0; i < processesDetail.length; i++) {
				if(processesDetail[i].id_cotizacion){
					self.getCommonsIntegrantesCotizacion(processesDetail[i].id_cotizacion,
						function (data) {
							var compiledTemplate = Handlebars.compile(taskDetailIntegrantesTemplate);
							$("#cotizacionIntegrante"+this.idEtapa).empty ();
							$.each(self.obrasSociales, function (index, obraSocial) {
								$.each(data, function (index, integrante) {
									if (obraSocial.codigoSSSalud == integrante.ID_CONDICION) {
										integrante.DESC_OS = obraSocial.sigla ? obraSocial.sigla : obraSocial.descripcion;
									}
								});
							});
							self.integrantes = data;
							$("#cotizacionIntegrante"+this.idEtapa).append (compiledTemplate({integrantes: data}));
						},
						function (xhr, err) {
							Util.error('Sample of error data:', err);
							Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						},
						function () {
						}
					);
				}
				
			}
		},
		
		
		getCotizaciones: function () {
			for (var i = 0; i < processesDetail.length; i++) {
				if (processesDetail[i].id_cotizacion) {
					CotizacionesService.getCotizacion(processesDetail[i].id_cotizacion,
						function (cotizaciones) {
							var compiledTemplate = Handlebars.compile(taskDetailPlanesTemplate);
							var coti1, coti2;

							for (var i = 0; i < cotizaciones.length; i++) {
								coti1 = cotizaciones[i];
								coti1.VALOR_FLIAR_CARGO = 0;
								for (var j = i + 1; j < cotizaciones.length; j++) {
									coti2 = cotizaciones[j];
									if (coti1.PLAN_OS === coti2.PLAN_OS) {
										coti1.IVA = coti1.IVA + coti2.IVA;
										if (coti2.COMPOSICION === "FAMILIAR A CARGO") {
											coti1.VALOR_FLIAR_CARGO += coti2.VALOR_TOTAL;
										}
										cotizaciones.splice(j, 1);
										j--;
									}
								}
								coti1.TOTAL_A_COBRAR = parseFloat(coti1.VALOR_TOTAL) + parseFloat(coti1.VALOR_FLIAR_CARGO) + parseFloat(coti1.IVA) - parseFloat(coti1.APORTES_DESC);
							}

							$("#cotizacionPlanes" + processesDetail[i].id_Etapa).empty();
							$("#cotizacionPlanes" + processesDetail[i].id_Etapa).append(compiledTemplate({ cotizaciones: cotizaciones, vtaPuraPlan: processesDetail[i].VtaPura_plan }));

						},
						function (xhr, err) {
						},
						function (data) { });
				}
			}
		},


		getProcessConfiguration: function () {

			try {
				var data = JSON.parse(ProcessJson);
				processTypes = eval(data);
				for (var i = 0; i < processTypes.length; i++) {
					if (processTypes[i].processNameJBPM === tasks.processName) {
						encontrado = true;
						id = processTypes[i].id;
						motive = processTypes[i].processName;
						processNameJBPM = processTypes[i].processNameJBPM;
						workcontext = processTypes[i].workcontext;
						allTasks = processTypes[i].tasks;
						statusSave = processTypes[i].statusSave;

						for (var x = 0; x < allTasks.length; x++) {
							if (allTasks[x].taskName === tasks.name) {
								tasks.actions = allTasks[x].actions;
							}
						}
						break;
					}
				}
			} catch (e) {
				Util.error("Error al intentar recuperar el archivo process.json");
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
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
		
		buildObjectToSave : function(form,entity) {
			
			var ventaPura = form.serializeObject();
//			ventaPura.prospecto = entity;
			prosp = {};
			prosp.pk = {};
			prosp.pk.idProsp = processDetail.id_prosp;
			prosp.pk.version = processDetail.pro_version;
			prosp.pk.idTipoUnidadNegocio = processDetail.id_tipo_pros;
			ventaPura.prospecto = prosp;
			ventaPura.idVenta = parseInt(ventaPura.idVenta,10);
			ventaPura.tipo.id = parseInt(ventaPura.tipo.id,10);
			ventaPura.idCotizacion = parseInt(idCotizacion,10);
			
			ventaPura.estado.id = parseInt($("#actions option:selected").data("status"),10);
			ventaPura.estado.descripcion = $("#actions option:selected").data("status-description");
			
			ventaPura.motivo.id = parseInt(ventaPura.motivo.id,10);
			
			if(ventaPura.estado.id === 1){
				ventaPura.process.variables.seFinaliza = "true";
				ventaPura.process.variables.conVenta = "true";
			}
			
			if(ventaPura.estado.id === 2){
				ventaPura.motivo.descripcion =  $("#ventaMotivo option:selected").text();	
				ventaPura.process.variables.seFinaliza = "true";
			}
			
			if(ventaPura.estado.id === 3){
				ventaPura.process.variables.decisionEntrevistarContactar = "a_entrevistar";
			}
			
			if(ventaPura.estado.id === 4){
				ventaPura.process.variables.decisionEntrevistarContactar = "a_entregar_info";
			}
			
			var detalle;

			ventaPura.medio.id 		= parseInt(ventaPura.medio.id,10);
			
			if (!ventaPura.asesor.legajo.trim()) {
				delete ventaPura.asesor;
			}
			
			var userId = Session.getLocal('userId');
			var userName = Session.getLocal('userName');

      		ventaPura.process.variables.processInfo.registradoUsuario = userName;
      		ventaPura.process.variables.processInfo.registradoNombre = userId;
			
			detalle = '<status '+ventaPura.estado.descripcion+'>' + " - "+ventaPura.observacion;

			//CREO EL OBJETO PROCESS DE JBPM					
            ventaPura.process.observaciones = ventaPura.observacion;
            ventaPura.process.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle;

			//CREO EL OBJETO PROCESS INFO DE JBPM
			if(ventaPura.finalizado && ventaPura.finalizado === "0"){
				ventaPura.process.variables.finalizado = "false";
			}else{
				ventaPura.process.variables.finalizado = "true";
			}
			
            ventaPura.process.variables.processInfo.afiliado=  null,
            ventaPura.process.variables.processInfo.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle,
            ventaPura.process.variables.processInfo.seguimiento = [];

			//IMPRIMO POR CONSOLA EL JSON DE ventaPura QUE VOY A POSTEAR
			Util.debug("ventaPura",ventaPura);
			Util.debug("ventaPuraString",JSON.stringify(ventaPura));
			
			return ventaPura;
		},
		
		
		buildObject : function(contacto) {
			var teltipo = "";
			var telpais = "";
			var telNac = "";
			var telMun = "";

			if (!Util.isEmpty(prospecto.telefonos)) {
				teltipo = prospecto.telefonos[0].tipo_tele;
				telpais = prospecto.telefonos[0].codigo_pais;
				telNac = prospecto.telefonos[0].codigo_nacional;
				telMun = prospecto.telefonos[0].numero;
			}
			var solicitud = {};
			solicitud.tipoCotizador = 0;
			solicitud.secuencia = 1;
			solicitud.zona = parseInt($("#zona").val(),10);
			solicitud.cuit = null;
			solicitud.nombre = prospecto.nombre;
			solicitud.apellido = prospecto.apellido;
			solicitud.dni = {};
			solicitud.dni.tipo = "1";
			if (prospecto.docNum !== "") {
				solicitud.dni.numero = parseInt(prospecto.docNum,10);
			} else {
				solicitud.dni.numero = 0;
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
			solicitud.email = prospecto.emails[0].email_tipo_den;
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
			solicitud.process.variables.processInfo.registradoUsuario = null;

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
			//	var jefe= this.buscarEmpleadoACargoBIDE();
			return solicitud;
		},

		
		saveTask: function () {

			var target = $("#toolbarLogin");
			var self = this;
			
			Util.blockBody();
			
			target.empty();
			target.append("<img src='../static/images/pleasewait.gif'/>");
	    	
			var form = $("#validation-form");
			$("#validation-form").removeData("validator");
			validate.rules = rulesSaveTask;
			validate.messages = messagesSaveTask;
			form.validate(validate);

			if(!form.valid()){
				$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text: 'Por favor ingrese los datos necesarios',
					class_name: 'gritter-warning'
				});
				Util.unBlockBody();
				target.empty();
			}else{
				
				//CONSTRUYO EL OBJECTO A GRABAR
				var generico = this.buildObjectToSave(form,prospecto);
				generico.process.action = null;
				
				generico.estado.id = processDetail.VtaPura_estado;
				generico.estado.descripcion = processDetail.estado_descripcion;
				
				var processInstance;
				
			

				FuseService.actualizarProceso(
					generico,
					true,
					function(data) {
						Util.debug("genericoAporteXos: ", generico);
						//GRABO EN EL MURO
						var body =  $("#inquietud").val();
						var subject = "Salvar tarea";
						var processId = generico.process.id;
						var userName = Session.getLocal('userName');
						var recipientsArray = [];recipientsArray.push(processId);
						MessagesService.sendMessage(subject,"Salvo Tarea",processId,userName,recipientsArray);
		
						self.getProcessDetail();
						
			        	var compiledTemplate = Handlebars.compile(taskDetailTemplate);
		        		$("#processDetail").empty ();
		          		$("#processDetail").append (compiledTemplate({tasks: tasks,process: process, processesDetail: processesDetail.reverse(),processDetail: processDetail}));
						
						self.getIntegrantes();
		          		self.getCotizaciones();
						
				    	$("#observacion").val("");
				    	
				    	
				    	var detalle = generico.process.detalle;
						var start = detalle.indexOf('<status ');
			    		var end =	detalle.indexOf('>');
			    		
			    		if(start !== -1){
			    			var statusDetail = detalle.substring(start,end+1);
				         	detalle = detalle.replace(statusDetail,'<status '+generico.estado.descripcion+'>');
						
							var processInfoDetalle = {detalle: detalle};
							
							InboxService.updateVariable(generico.process.id, 'processInfo', processInfoDetalle, true,
								function(data) {},
								function(xhr, err) {
									Util.error( 'Sample of error data:', err );
					        		Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
								},
								function(data) {}
							);
			    		}else{
			    			return "";
			    		}
				    	
						Util.unBlockBody();
						$.gritter.add({	
		                    title : '<i class="icon-ok bigger-120"></i>&nbsp;Exito',
		                    text : 'Datos guardados correctamente',
		                    class_name : 'gritter-success'
		                });
						target.empty();
						
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
					},
					function(){},
					true,
				);
			
			}
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
			Util.info("hola", ph);
			return validado;
		},
		
		saveAndEndTask: function () {
			
			var form = $("#validation-form");
			$("#validation-form").removeData("validator");
			validate.rules = {
				'process[action]': {
					required: true
				},
				'motivo[id]': {
					required: true
				}
			};
			validate.messages = {
				'process[action]' : {
					required : " "
				},
				'motivo[id]': {
					required: "El campo motivo es necesario."
				}
			};
			form.validate(validate);

			if(!form.valid()){
				$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text: 'Por favor ingrese los datos necesarios',
					class_name: 'gritter-warning'
				});
				Util.unBlockBody();
				target.empty();
			}else{
				
				var estado = parseInt($("#actions option:selected").data("status"),10);
				if(estado === 1){
					var plan = $('input[name=plan]:checked').val();
					if(plan === undefined){
						$.gritter.add({
							title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text : 'Por favor selecciones algún plan',
							class_name : 'gritter-warning'
						});
					}else{
						this.saveForm(form,prospecto);	
					}
				}else{
					this.saveForm(form,prospecto);	
				}
			}
		},
		
		saveForm: function(form,prospecto){

			var start = new Date().getTime();
			var userId = Session.getLocal("userId");
			

			Util.blockBody();
			var target = $("#toolbarLogin");
			target.empty();
			target.append("<img src='../static/images/pleasewait.gif'/>");

			//CONSTRUYO EL OBJECTO A GRABAR
			var generico = this.buildObjectToSave(form,prospecto);
			tasks = InboxService.getTaskById(generico.task.id);
											
			if (tasks && tasks.end == null){
	
				Util.debug(tasks.actorId && tasks.actorId === userId,tasks.actorId,userId);
				if(tasks.actorId && tasks.actorId === userId){
					
					//LLAMO AL SERVICIO DE GRABACION DEL LLAMADO
					var processInstance;
					

					FuseService.actualizarProceso(
						generico,
						true,
						function(data) {
							var actionDescription = 'terminó la tarea ' +generico.task.name+' del proceso';
							MessagesService.sendNotificationsTask(generico.process.id, actionDescription);
							Util.debug("genericoAporteXos: ", generico);
							//GRABO EN EL MURO
							var body =  $("#observacion").val();
							var subject = "Transicionar tarea";
							var processId = generico.process.id;
							var userName = Session.getLocal('userName');
							var recipientsArray = [];recipientsArray.push(processId);
							MessagesService.sendMessage(subject,generico.estado.descripcion,processId,userName,recipientsArray);
							
							var tasks = InboxService.getTaskByProccessId(processId);
							tasks = Util.sortDescByKey(tasks, 'id');
							if (generico.asesor)
								InboxService.assignTaskAsync(tasks[0].id, generico.asesor.uid, true, function(){}, function(){}, function(){});
	
							Util.unBlockBody();
					    	target.empty();
	
							window.top.location.href= SettingsModel.get("open_task");
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
						},
						function(){},
						true,
					);


					if (generico.estado.id === 1 || generico.estado.id === 2) {
						ProspectoService.liberarProspecto(generico.prospecto.pk,true);
					}
				}else{
					Backbone.history.navigate('error', { trigger : true });
			      	$("#content1").empty ();
					var compiledTemplate = Handlebars.compile(actorNotFoundTemplate);
					$("#content1").html (compiledTemplate());
				}
			}else{
				Backbone.history.navigate('error', { trigger : true });
		      	$("#content1").empty ();
				var compiledTemplate = Handlebars.compile(taskNotFoundTemplate);
				$("#content1").html (compiledTemplate());
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
			};

			var error = function(xhr, err) {
				encontrado = false;
				Util.error('Sample of error data:', err);
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			};

			ObraSocialService.getObrasSociales(
				success, 
				error, 
				function(){}, 
				false
			);

			return obrasSociales;
		},

		list: function (taskId,processId){
			var self = this;
			var userId = Session.getLocal("userId");
			taskId = parseInt(taskId,10);
			idProcess = processId;
			var obrassociales; 

			if (taskId !== 0){

				var start = new Date().getTime();
	        	tasks = InboxService.getTaskById(taskId);
				
				if (tasks && tasks.end == null){

					if(tasks.actorId && tasks.actorId === userId){

						tomada = true;
						this.getProcessConfiguration();
						this.getProcessDetail();
						
					}else{
						tomada = false;	
					}
				}
			}
			
			if(tomada){
				if(encontrado){
					if(processDetail.legajo_asesor){
						var legajo = pad(processDetail.legajo_asesor.trim(),8);

						LoginService.usersByLegajo(legajo,false,
						function (data) {
							asesor = data[0];
						},
						function (xhr,err) {
							Util.error( 'Sample of error data:', err );
							Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
						},
						function (data) {
						});
					}
					var userId = Session.getLocal('userId');
		        	$("#content1").empty ();
		          	$("#content1").append (this.render (id,motive,userId,finalize,submotive,tasks,workcontext,processNameJBPM, processDetail,workflowId,obrassociales, asesor).el);
					
					self.obrasSociales = this.buscarObrasSociales();
					
					ProspectoService.getZonas("0", false,
						function (data) {
							zonas = eval(data);
						}, function (xhr, err, urlRest, typeCall) {
						}, function (data) {
			
						}
					);

					
					var compiledTemplate = Handlebars.compile(step2Template);
					$("#step1Content").empty();
					$("#step1Content").append(compiledTemplate({
						obrasSociales : self.obrasSociales,
						cotizacionSeleccionada: cotizacionSeleccionada,
						zonas: zonas,
						cantIntegrantes: integrantes.length - 1,
						integrantes: integrantes
					}));
					
					if(cotizacionSeleccionada[0].VIGENCIA_HASTA < new Date().getTime()){
						$.gritter.add({
							title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text : 'Cotización vencida, por favor recotizar.',
							class_name : 'gritter-warning'
						});
						$("#btnNext").empty().append('Cotizar <i class="icon-arrow-right icon-on-right"></i>');
						$("#recotizar").val("true");
						$('#actionSelected').hide();	
					}else{
						$('#btnNext').click();	
					}
					
					
		          	var self = this;

		          	var prospectosDetailView = '../../form-prospectos/js/libs/framework/views/prospectos/prospectosDetailView';
		          	
		          	require([prospectosDetailView],function(View){
						var target = $('#entityDetail');
						var view = new View();
						view.list(processesDetail[0], target);
						prospecto = view.getProspecto();
					});
		          	
		        	var compiledTemplate = Handlebars.compile(taskDetailTemplate);
		        	$("#processDetail").empty ();
		        	$("#processDetail").css ("background","");
		          	$("#processDetail").append (compiledTemplate({tasks: tasks,process: process, processesDetail: processesDetail.reverse(),processDetail: processDetail, editable: true}));
		          	
		          	this.getIntegrantes();
		          	this.getCotizaciones();
				}else{
					Backbone.history.navigate('error', { trigger : true });
			      	$("#content1").empty ();
					var compiledTemplate = Handlebars.compile(taskNotFoundTemplate);
					$("#content1").html (compiledTemplate());
				}
			}else{
				Backbone.history.navigate('error', { trigger : true });
		      	$("#content1").empty ();
				var compiledTemplate = Handlebars.compile(actorNotFoundTemplate);
				$("#content1").html (compiledTemplate());
			}
       	},
       
		 // Render method.
        render: function (id,motive,userId,finalize,submotive,tasks,workcontext,processNameJBPM,processDetail, workflowId, obrassociales,asesor){
        	var compiledTemplate = Handlebars.compile(formEditTemplate);

			var userName = Session.getLocal("userName");
			var userId = Session.getLocal("userId");
			var subsidiary = Session.getLocal("subsidiary");
			var subsidiaryId = Session.getLocal("subsidiaryId");
			var entorno = SettingsModel.get("entorno");
						
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
	      	this.$el.html (compiledTemplate({id: id,motive: motive, userId: userId, userName: userName, subsidiary: subsidiary, subsidiaryId: subsidiaryId, 
	      	finalize: finalize, submotive: submotive, tasks: tasks, workcontext: workcontext, 
	      	processDetail: processDetail, workflowId: workflowId, obrassociales: obrassociales, asesor: asesor}));	      		      
        	        	      	
			return this;
       	},
       	
       	exportPDF: function(e) {
			var self = this;
			
			self.retrieveCotizaciones(function(cotizacion) {
				var context = {};
				context.resultCotizacion = cotizacion;
				context.integrantes = integrantes;
				context.nameProspecto = prospecto.apellido + ", " + prospecto.nombre;
				new PdfView().render(context, function(pdf) {
					// onSuccess();
				}, function( err ) {
					Util.error( err );
					OvUtil.alertMessage("Hubo un error al exportar las cotizaciones", "warning", "exclamation-sign", "Atenci\u00F3n");
				});
			});
		},
		
		retrieveCotizaciones: function(successFunction) {
			var self = this;

			CotizacionesService.getCotizacion(idCotizacion,
				function (cotizacion) {
					for (var i = 0; i < cotizacion.length; i++) {
						for (var j = i+1; j < cotizacion.length; j++) {
							if (cotizacion[i].PLAN_OS === cotizacion[j].PLAN_OS) {
								cotizacion[i].TOTAL += cotizacion[j].TOTAL;
								cotizacion[i].VALOR_TOTAL += cotizacion[j].VALOR_TOTAL;
								cotizacion[i].IVA += cotizacion[j].IVA;
								cotizacion[i].APORTES_DESC += cotizacion[j].APORTES_DESC;
								cotizacion.splice(j,1);
								j--;
							}
						}
						cotizacion[i].TOTAL_A_COBRAR = parseFloat(cotizacion[i].VALOR_TOTAL) + parseFloat(cotizacion[i].IVA) - parseFloat(cotizacion[i].APORTES_DESC);
					}
					
					successFunction(cotizacion);

				},
				function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				function (data) { });
		},

		getCommonsIntegrantesCotizacion:function(idCotizacion,successFunction,errorFunction,completeFunction){
			var self=this;

			CotizacionesService.getIntegrantes(idCotizacion,successFunction,errorFunction,completeFunction);
		}
		
    });
    
    return newView;
});