define(['jquery', 
		'underscore', 
		'backbone', 
		'datatablesBT', 
		'handlebars', 
		'bootstrap', 
		'ace', 
		'encoding', 
		'libs/settings', 
		'util', 
		'messagesService', 
		'text!libs/framework/templates/app/formTemplate.html', 
		'text!libs/framework/templates/app/listCotizacionesTemplate.html', 
		'text!libs/framework/templates/app/listIntegrantesTemplate.html', 
		'text!libs/framework/templates/app/motiveNotFoundTemplate.html', 
		'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/fila.html', 
		'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/listPlanesCotizadosNuevamenteTemplate.html', 
		'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/listPlanesCotizadosTemplate.html',
		'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/step2Template.html', 
		'/static/js/libs/thirds/jquery/moment-with-locales.js', 
		'libs/framework/views/helpers/ovUtil', 
		'libs/framework/views/app/pdfView',
		'/form-smg-commons/js/libs/services/prospectoService.js',
		'/form-smg-commons/js/libs/services/inboxService.js',
		'/form-smg-commons/js/libs/prospectoUtil.js',
		'session',
		'/form-smg-commons/js/libs/services/fuseService.js',
		'/form-smg-commons/js/libs/services/obraSocialService.js',
		'/form-smg-commons/js/libs/services/cotizacionesService.js',
], function($, _, Backbone, datatablesBT, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, 
	MessagesService, formTemplate, listCotizacionesTemplate, listIntegrantesTemplate, 
    motiveNotFoundTemplate, Fila, listPlanesCotizadosNuevamenteTemplate, listPlanesCotizadosTemplate, step2Template, Moment, 
	OvUtil, PdfView, ProspectoService, InboxService, ProspectoUtil,  
	Session, FuseService, ObraSocialService, CotizacionesService) {

	var prospecto = null, contacto = null, cotizaciones = null, cotizacionSeleccionada = null, cotizacion = null, 
	entityId = null, idCotizacion = null, obrasSociales = [], proceso = null, firstWizardEntry = true, zonas = null;
	var hasSubmotive;

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

	var rulesSave= {
		'estado[id]': {
			required: true
		},
		'motivo[id]': {
			required: true
		}
	};

	var messagesSave = {
		'estado[id]': {
			required: "El campo estado es necesario."
		},
		'motivo[id]': {
			required: "El campo motivo es necesario."
		}
	};


	var newView = Backbone.View.extend({
		
		currentCotizacion: {},
		cotizacion: {},
		integrantes: [],
		origen: {},
		seFinaliza: true,
		prospectoIncompleto: false,
		
		events : {
			'change		#fuelux-wizard' 			: 'nextStep',
			'finished 	#fuelux-wizard' 			: 'finishedStep',
			'click		.spNuevoIndividuo' 			: 'addNewRowCotizacion',
			'click		.spDelIndividuo' 			: 'delRowCotizacion',
			'change  	#zona' 						: 'cambiarACotizar',
			'change  	.cambiarSexo' 				: 'cambiarACotizar',
			'change  	.cambiarEdad' 				: 'cambiarACotizar',
			
			'change  	#cotizado' 					: 'cambiarBuscar',
			
			'change  	.habilitar-remuneracion' 	: 'habilitarRemuneracion',
			'change  	.habilitar-obra-social' 	: 'habilitarOSocial',
			'change		#ventaEstado'				: 'habilitarPorEstado',
			'click 		.wiewGroup' 				: 'wiewGroup',
			'click 		#btnGrabarSolReserva' 		: 'save',
			'click 		#btnSearchCotizaciones' 	: 'searchCotizaciones',
			'click		#btnExportPDF'				: 'exportPDF',
			'click		#chkFinalizado'				: 'onClickFinalizado',
			'click		#btnFinalizar'				: 'onClickFinalizar',
			'click 		#btnEdit' 					: 'viewEditProspecto',
			'hide 		#modal-abm-prospecto' 		: 'onHideAltaModal',
			'click		#btnSaveAndEndTask'			: 'finishedStep'
		},

		keys : {
			'x+alt+shift' : 'closeTask',
			'right+alt+shift' : 'nextTab',
			'left+alt+shift' : 'previousTab'
		},

		cambiarBuscar: function(){
			
			var cotizado = $("#cotizado").is(":checked") ? true : false;
			
			if(cotizado){
				$("#btnSearchCotizaciones").show();	
			}else{
				$("#resultSearchCot").empty();
				$("#btnSearchCotizaciones").hide();
			}
		},
		
		cambiarACotizar: function(){
			$("#btnNext").empty().append('Cotizar <i class="icon-arrow-right icon-on-right"></i>');
			$("#recotizar").val("true");
		},
		
		habilitarPorEstado: function (e) {
			var ventaEstado = $("#ventaEstado").val();
			
			if(ventaEstado == "1"){
				$(".labelPlanSelected").each(function() {
				    $(this).show();
				});
			}else{
				$(".labelPlanSelected").each(function() {
				    $(this).hide();
				});
			}
			
			if(ventaEstado == "2"){
				$("#divVentaMotivo").show();
			}else{
				$("#divVentaMotivo").hide();
			}
		},
		
		wiewGroup: function (e) {
			var id = $(event.target).closest('tr').data("cotizacion");
			var target = $("#groupCot"+id);
			
			Util.blockTarget(target);
			target.css ("background-size","16px 16px");
			target.css ("max-height","150px");
			target.css ("height","150px");

			CotizacionesService.getIntegrantes(id,
				function (integrantes) {
					var compiledTemplate = Handlebars.compile(listIntegrantesTemplate);
					target.empty();
					target.append(compiledTemplate({
						integrantes : integrantes
					}));
					target.removeAttr ('style');
				},
				function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					target.removeAttr ('style');
				},
				function () {
				}
			);
			
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

			if ((paren === 'T' || paren === 'E' ) && os !== "-1") {
				remun.removeAttr("disabled");
			} else {
				remun.attr("disabled", "disabled");
			}
		},

		cotizar : function(contacto) {
			var cotizaciones;
			var solicitud = this.buildObject(contacto);
			
			Util.blockBody();
			
			

			FuseService.crearProceso(
				solicitud,
				true,
				function(data) {
					cotizaciones = eval(data);
					Util.info(cotizaciones);
					
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
											
					if (cotizacionesNews.cod_error != null) {
						error = cotizacionesNews;
					}
					
					Util.unBlockBody();
					
					var compiledTemplate = Handlebars.compile(listPlanesCotizadosNuevamenteTemplate);
					
					self.currentCotizacion = cotizacionesNews;
					
					$("#div-form-3").empty();
					$("#div-form-3").append(compiledTemplate({
						cotizaciones : cotizacionesNews,
						proceso : this.proceso,
						fecha : fecha,
						error : error
					}));
					
					
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

		nextStep : function(e, info) {
			Util.info("NEXT STEP");
			var self = this;
			event.stopPropagation();
			event.preventDefault();

			if ($('#fuelux-wizard').wizard('selectedItem').step === 1) {

				Util.info("step1");
				
				if ( self.prospectoIncompleto ) {
					$.gritter.add({
						title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text : 'Por favor complete los datos del prospecto para continuar',
						class_name : 'gritter-warning'
					});
					return false;
				}

				var form = $("#valid-form-1"), cotizacionSelected = $('input[name=cotizacionSelected]:checked', '#valid-form-1').val(), cotizado = $("#cotizado").is(":checked") ? true : false;

				Util.debug("cotizacion", cotizacionSelected, cotizado);

				if (cotizado && cotizacionSelected === undefined) {
					$.gritter.add({
						title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text : 'Por favor seleccione una cotización',
						class_name : 'gritter-warning'
					});
					return false;
				} else {
					var formName = $("#valid-form-1");
					var contacto = formName.serializeObject();
		    		obrasSociales = this.buscarObrasSociales();

					ProspectoService.getZonas("0", false,
						function (data) {
							zonas = eval(data);
						}, function (xhr, err, urlRest, typeCall) {
						}, function (data) {
			
						}
					);

					if(cotizado){

						CotizacionesService.getCotizacion(cotizacionSelected,
							function (cotizacion) {
								
								cotizacionSeleccionada = cotizacion;

								CotizacionesService.getIntegrantes(cotizacionSelected,
									function (integrantes) {
										
										var compiledTemplate = Handlebars.compile(step2Template);
										
										var coti1, coti2;

										for (var i = 0; i < cotizacionSeleccionada.length; i++) {
											coti1 = cotizacionSeleccionada[i];
											coti1.VALOR_FLIAR_CARGO = 0;
											for (var j = i+1; j < cotizacionSeleccionada.length; j++) {
												coti2 = cotizacionSeleccionada[j];
												if (coti1.PLAN_OS === coti2.PLAN_OS) {
													coti1.IVA = coti1.IVA + coti2.IVA;
													if (coti2.COMPOSICION === "FAMILIAR A CARGO") {
														coti1.VALOR_FLIAR_CARGO += coti2.VALOR_TOTAL;
													}
													cotizacionSeleccionada.splice(j,1);
													j--;
												}
											}
											coti1.TOTAL_A_COBRAR = parseFloat(coti1.VALOR_TOTAL) + parseFloat(coti1.VALOR_FLIAR_CARGO) + parseFloat(coti1.IVA) - parseFloat(coti1.APORTES_DESC);
										}
										
										Util.debug("cotizacionSeleccionada",cotizacionSeleccionada);
										
										$("#step2").empty();
										$("#step2").append(compiledTemplate({
											obrasSociales : obrasSociales,
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
										}
										
									},
									function (xhr, err) {
										Util.error('Sample of error data:', err);
										Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
										target.removeAttr ('style');
									},
									function () {
									}
								);
		
			
							},
							function (xhr, err) {
								Util.error('Sample of error data:', err);
								Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
								target.removeAttr ('style');
							},
							function (data) {
							 }
						);
						
					}else{
						var compiledTemplate = Handlebars.compile(step2Template);
						$("#step2").empty();
						$("#step2").append(compiledTemplate({
							obrasSociales : obrasSociales,
							zonas: zonas
						}));
						setTimeout(function() {
			                $("#btnNext").empty().append('Cotizar <i class="icon-arrow-right icon-on-right"></i>');
			                $("#recotizar").val("true"); 	
						},100);
						
					}
					return true;
				}
			}

			if (info.step === 2 && info.direction === 'next') {
				
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
						setTimeout(function() {
						$("#btnNext").hide(); 	
						$("#actionSelected").show();
						},100);
						
						var compiledTemplate = Handlebars.compile(listPlanesCotizadosTemplate);
						
						idCotizacion = cotizacionSeleccionada[0].NRO_TRAMITE;
						Util.info("idCotizacion",idCotizacion, cotizacionSeleccionada);
						
						self.currentCotizacion = cotizacionSeleccionada;
						$("#div-form-3").empty();
						$("#div-form-3").append(compiledTemplate({
							cotizaciones : cotizacionSeleccionada
						}));
						
					}else{
						
						var form2 = $("#valid-form-2");
						if (this.validateStep2()) {
							setTimeout(function() {
								$("#btnNext").hide(); 	
								$("#actionSelected").show();
							},100);
							
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

			if(info.direction === 'previous'){
				setTimeout(function() {
					$("#btnNext").show(); 	
					$("#actionSelected").hide();
				},100);
			}
			

		},

		finishedStep : function(e) {

			var form = $("#valid-form-3");
			form.removeData("validator");

			validate.rules = rulesSave;
			validate.messages = messagesSave;
			form.validate(validate);

			Util.debug("searchCotizaciones", form.valid());

			if (!form.valid()) {
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Por favor ingrese los datos necesarios',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				target.empty();
			} else {
				
				var estado = $("#ventaEstado").val();
				if(estado === 1){
					var plan = $('input[name=plan]:checked', '#valid-form-3').val();
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
			
			var self = this;
			
			var target = $("#toolbarLogin");
			Util.blockBody();
			target.append("<img src='../static/images/pleasewait.gif'/>");
			
			var ventaPuraIndividuos = this.buildObjectToSave(form,prospecto);
			var processInstance;
			
		

			FuseService.crearProceso(
				ventaPuraIndividuos,
				true,
				function(data) {
					processInstance = data;
					
					Util.unBlockBody();
		    		target.empty();

					if (!prospecto.bloqueado) {
						ProspectoService.bloquearProspecto(ventaPuraIndividuos.prospecto.pk,true);
					}

					if (ventaPuraIndividuos.estado.id === 1 || ventaPuraIndividuos.estado.id === 2) {
						ProspectoService.liberarProspecto(ventaPuraIndividuos.prospecto.pk,true);
					}

					var body =  ventaPuraIndividuos.process.detalle;
					var subject = "Creacion del proceso";
					var processId = processInstance.jbpmProcess;
					var userName = Session.getLocal('userName');
					var recipientsArray = [];recipientsArray.push(processId);

					var tasks = InboxService.getTaskByProccessId(processId);
					var actorId = ventaPuraIndividuos.process.variables.actorId;
					tasks = Util.sortDescByKey(tasks, 'id');
					if(tasks[0]){
						InboxService.assignTaskAsync(tasks[0].id, actorId, true, function(){}, function(){}, function(){});
					}					
					MessagesService.sendMessage(subject,body,processId,userName,recipientsArray);
					
					bootbox.dialog("Se generó el número de Trámite "+processInstance.jbpmProcess, [{
						"label" : "Aceptar",
						"class" : "btn-small btn-success",
						"callback": function() {
							//CREANDO URL PARA REMOVER TAB EN GPS2014
							var removeTabUrl = SettingsModel.get("remove_tab_url")+$("#id").val();
							window.top.location.href= removeTabUrl;
							if ( self.origen !== null && self.origen !== 'undefined' && self.origen !== undefined ) {
                        		ProspectoService.finalizarTramitesAtencion(prospecto.pk.idProsp);
                        		Backbone.history.navigate('', {
									trigger: true
								});
                        	}
						}
						}]
					);
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
		},

		buildObjectToSave : function(form,entity) {
			var self = this;
			
			var ventaPura = form.serializeObject();
			ventaPura.prospecto = entity;
			ventaPura.idVenta = null;
			ventaPura.idCotizacion = parseInt(idCotizacion,10);
			ventaPura.estado = {};
			ventaPura.estado.id = $("#ventaEstado").val();
			
			if ( self.seFinaliza ) {
				ventaPura.estado = {};
				ventaPura.estado.id = 2
				ventaPura.estado.descripcion = "Cerrado sin Venta"
				ventaPura.motivo = {};
				ventaPura.motivo.id = 15;
				ventaPura.motivo.descripcion = "Sin Gestion";
				ventaPura.observacion = "Sin Gestion";
			} else {
				ventaPura.estado.descripcion =  $("#ventaEstado option:selected").text();
				ventaPura.estado.id = parseInt(ventaPura.estado.id,10);
				ventaPura.motivo.id = parseInt(ventaPura.motivo.id,10);
				ventaPura.ventaPura = 1;
			}
			
			if(ventaPura.estado.id === 1){
				ventaPura.process.variables.seFinaliza = "true";
				ventaPura.process.variables.conVenta = "true";
			}
			
			if(ventaPura.estado.id === 2){
				if ( !self.seFinaliza ) {
					ventaPura.motivo.descripcion =  $("#ventaMotivo option:selected").text();	
				}
				ventaPura.process.variables.seFinaliza = "true";
			}
			
			if(ventaPura.estado.id === 3){
				ventaPura.process.variables.decisionEntrevistarContactar = "a_entrevistar";
			}
			
			if(ventaPura.estado.id === 4){
				ventaPura.process.variables.decisionEntrevistarContactar = "a_entregar_info";
			}
			
			var guardiaDetalle = "";
			if ( self.origen !== null && self.origen !== 'undefined' && self.origen !== undefined ) {
				ventaPura.process.variables.guardia_suc = Util.prettifyEnvironment(self.origen);
				guardiaDetalle = "GUARDIA " + ventaPura.process.variables.guardia_suc;
			}
			
			var detalle;

			ventaPura.medio.id = parseInt(ventaPura.medio.id,10);
			ventaPura.canalOrigen.id = parseInt(ventaPura.canalOrigen.id,10);
			
			var userId = Session.getLocal('userId');
			var userName = Session.getLocal('userName');

      		ventaPura.process.variables.processInfo.registradoUsuario = userName;
      		ventaPura.process.variables.processInfo.registradoNombre = userId;
			ventaPura.process.variables.workContext = 'AMB_OV_ASESOR';
			
			detalle = '<status '+ventaPura.estado.descripcion+'>'+entity.apellido+', '+entity.nombre+" - "+entity.docTipo+"-"+entity.docNum+" - "+ventaPura.observacion + " - " + guardiaDetalle;

			//CREO EL OBJETO PROCESS DE JBPM					
            ventaPura.process.id = null;
            ventaPura.process.processId = null;
            ventaPura.process.key = null; //este lo actualiza el esb
            ventaPura.process.start = new Date().getTime();
            ventaPura.process.observaciones = ventaPura.inquietud;
            ventaPura.process.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle;
			ventaPura.process.workContext = 'AMB_OV_ASESOR';

			//CREO EL OBJETO PROCESS INFO DE JBPM
			if(ventaPura.finalizado && ventaPura.finalizado === "0"){
				ventaPura.process.variables.finalizado = "false";
			}else{
				ventaPura.process.variables.finalizado = "true";
			}
			
            ventaPura.process.variables.processInfo.afiliado=  entity.nombreCompleto,
            ventaPura.process.variables.processInfo.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle,
            ventaPura.process.variables.processInfo.seguimiento = [];

			ventaPura.process.credencial = 'PRO-' + ventaPura.prospecto.pk.idProsp;
			ventaPura.process.variables.processInfo.credencial = 'PRO-' + ventaPura.prospecto.pk.idProsp;
			ventaPura.credencial = 'PRO-' + ventaPura.prospecto.pk.idProsp;

			//IMPRIMO POR CONSOLA EL JSON DE ventaPura QUE VOY A POSTEAR
			Util.debug("ventaPura",ventaPura);
			Util.debug("ventaPuraString",JSON.stringify(ventaPura));
			
			return ventaPura;
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

		validarGrupoFamiliarOld : function() {
			var num = $('#hiddenCantidad').val();
			var numero = Number(num) - 1;

			var validacionParentesco = 'individuos[' + numero + '][edad]';

			var customRulesPro = {
				validacionParentesco : {
					required : true
				}
			};

			var customMessages = {

				validacionParentesco : {
					required : "Ingrese el apellido."
				}
			};
			var validatParent;
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
				var encontrado = false;
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

		searchCotizaciones : function() {

			var target = $("#toolbarLogin");
			Util.blockBody();
			target.append("<img src='../static/images/pleasewait.gif'/>");

			var form = $("#valid-form-1");
			form.removeData("validator");

			$("#txtProceso").closest('.control-group').removeClass('error');
			$("#txtApellido").closest('.control-group').removeClass('error');

			validate.rules = rulesSearch;
			validate.messages = messagesSearch;
			form.validate(validate);

			Util.debug("searchCotizaciones", form.valid());

			if (!form.valid()) {
				$.gritter.add({
					title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text : 'Por favor ingrese los datos necesarios',
					class_name : 'gritter-warning'
				});
				Util.unBlockBody();
				target.empty();
			} else {

				var processId = $("#txtProceso").val();

				if (processId !== "") {

					var data=InboxService.getProcess(processId,function(){
						Util.unBlockBody();
					});

					if (!data) {
						$.gritter.add({
							title : '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text : 'No se encontraron datos',
							class_name : 'gritter-warning'
						});
						Util.unBlockBody();
						target.empty();
					} else {
						CotizacionesService.getCotizacion(data.key,
							function (data) {
								
								cotizaciones = data;
								var cotizacionesGrouped = Util.groupArrayBy(cotizaciones,"NRO_TRAMITE");

								var compiledTemplate = Handlebars.compile(listCotizacionesTemplate);
								Util.debug("cotizaciones", cotizaciones);
								$("#resultSearchCot").empty().append(compiledTemplate({
									cotizaciones : cotizacionesGrouped
								}));
			
							},
							function (xhr, err) {
								Util.error('Sample of error data:', err);
								Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
							},
							function (data) {
								Util.unBlockBody();
							 }
						);
					}
					
				} else {
					
					var apellido = $("#txtApellido").val();
					var nombre = $("#txtNombre").val();

					CotizacionesService.getCotizacion(nombre,apellido,true,
						function (data) {
								
							cotizaciones = data;
							var cotizacionesGrouped = Util.groupArrayBy(cotizaciones,"NRO_TRAMITE");
							
							var compiledTemplate = Handlebars.compile(listCotizacionesTemplate);
							Util.debug("cotizaciones", cotizaciones);
							$("#resultSearchCot").empty().append(compiledTemplate({
								cotizaciones : cotizacionesGrouped
							}));
		
						},
						function (xhr, err) {
							Util.error('Sample of error data:', err);
							Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						},
						function (data) {
							Util.unBlockBody();
						 }
					);
				}
			}
		},

		buildObject : function(contacto) {
			var self = this;
			var teltipo = (prospecto.telefonos[0])?prospecto.telefonos[0].tipo_tele:null;
			var telpais = (prospecto.telefonos[0])?prospecto.telefonos[0].codigo_pais:null;
			var telNac = (prospecto.telefonos[0])?prospecto.telefonos[0].codigo_nacional:null;
			var telMun = (prospecto.telefonos[0])?prospecto.telefonos[0].numero:null;
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
			solicitud.email = (prospecto.emails[0])?prospecto.emails[0].email_tipo_den:null;
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
						solicitud.grupoFamiliar[i].remuneracion = parseFloat(solicitud.grupoFamiliar[i].remuneracion);
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


		list : function(id, idSubmotive) {

			var processTypes;
			var processNameJBPM;
			var encontrado = false;
			var finalize;
			var submotive;
			var motive;
			var workcontext;

			var array = [];

			$.ajax({
				url : 'process.json?date=' + new Date(),
				type : 'GET',
				async : false,
				success : function(data) {
					processTypes = eval(data);

					for (var i = 0; i < processTypes.length; i++) {
						array.push(processTypes[i].id);
						if (processTypes[i].id === id) {
							encontrado = true;
							motive = processTypes[i].processName;
							finalize = processTypes[i].choisefinalize;
							hasSubmotive = processTypes[i].hasSubmotive;
							processNameJBPM = processTypes[i].processNameJBPM;
							workcontext = processTypes[i].workcontext;
						}
					}
				},
				error : function(xhr, err) {
					Util.debug('Sample of error data:', err);
					Util.debug("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}
			});

			//Util.info(JSON.stringify(array));

			if (encontrado) {
				var userId = Session.getLocal('userId');
				$("#content1").empty();
				//$("#content1").append (this.render (id,motive,userId,finalize,hasSubmotive,idSubmotive,workcontext,processNameJBPM).el);
			} else {
				Backbone.history.navigate('error', {
					trigger : true
				});
				$("#content1").empty();
				var compiledTemplate = Handlebars.compile(motiveNotFoundTemplate);
				$("#content1").html(compiledTemplate());
			}
		},

		// Render method.
		render : function(id, origen) {
			var self = this;
			
			self.origen = origen;
			prospecto = $.parseJSON(Session.getLocal("Entity"));
			entityId = Session.getLocal("entityId");

			Util.debug("prospecto", prospecto);

			var nombreCompleto = prospecto.apellido + ", " + prospecto.nombre;

			var userName = Session.getLocal("userName");
			var userId = Session.getLocal("userId");
			var entorno = SettingsModel.get("entorno");
			var subsidiary = Session.getLocal("subsidiary");
			var subsidiaryId = Session.getLocal("subsidiaryId");

			var encontrado = false;
			var processTypes;
			var processNameJBPM;
			var finalize;
			var submotive;
			var motive;
			var workcontext;

			$('#version-container').empty();

			$.ajax({
				type : "GET",
				url : "META-INF/maven/pom.xml?date=" + new Date().getTime(),
				dataType : "xml",
				success : function(xml) {
					$('#version-container').append(entorno + "-" + $(xml).find('version').eq(1).text());
				},
				error : function(date) {
					$('#version-container').remove();
				}
			});

			$.ajax({
				url : 'process.json?date=' + new Date(),
				type : 'GET',
				async : false,
				success : function(data) {
					processTypes = eval(data);
					motive = processTypes[0].processName;
					finalize = processTypes[0].choisefinalize;
					hasSubmotive = processTypes[0].hasSubmotive;
					processNameJBPM = processTypes[0].processNameJBPM;
					workcontext = processTypes[0].workcontext;
				},
				error : function(xhr, err) {
					Util.debug('Sample of error data:', err);
					Util.debug("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}
			});

			if (processTypes) {

				var self = this, data = null, zonas;
				
				self.prospectoIncompleto = ProspectoUtil.isIncompleteProspectoF( prospecto );
				self.processNameJBPM = processNameJBPM;

				var compiledTemplate = Handlebars.compile(formTemplate);

				self.$el.html(compiledTemplate({
					id: id,
					nombreCompleto : nombreCompleto,
					entity: prospecto,
					entityId : entityId,
					motive : motive,
					userId : userId,
					userName : userName,
					subsidiary : subsidiary,
					subsidiaryId : subsidiaryId,
					finalize : finalize,
					hasSubmotive : hasSubmotive,
					workcontext : workcontext,
					processNameJBPM : processNameJBPM,
					prospectoIncompleto: self.prospectoIncompleto
				}));
				
				if ( self.origen !== null && self.origen !== 'undefined' && self.origen !== undefined ) {
					var prospectoToUpdate = $.extend(true, {}, prospecto);
					prospectoToUpdate.userName = Session.getLocal('userName');
					delete prospectoToUpdate.task;
					delete prospectoToUpdate.taskId;
					delete prospectoToUpdate.taskid;
					delete prospectoToUpdate.processId;
					ProspectoService.updateProspecto( JSON.stringify(prospectoToUpdate), true, function(){}, function(){}, function(){} )
				}
				
				setTimeout( function() {
					if ( self.prospectoIncompleto ) {
						self.viewEditProspecto();
					} 
				}, 3000);
				
			} else {
				Backbone.history.navigate('error', {
					trigger : true
				});
				var compiledTemplate = Handlebars.compile(motiveNotFoundTemplate);
				this.$el.html(compiledTemplate);
			}

			return this;
		},

		ongoingQuote : function(prospecto) {
			var boolean = false;

			InboxService.searchAdvanceTask('01-01-1900',
				'01-01-1900',
				'todos',
				'abiertos',
				'&PRO-' + prospecto,
				function(data) {
					var tasks = eval(data);
					var i = 0;
					while (i < tasks.length && tasks[i].processName !== "OV-VA-Individuos") {
						i++;
					}

					boolean = i < tasks.length;
				},
				function(xhr, err) {
					Util.debug('Sample of error data:', err);
					Util.debug("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);

					$.gritter.add({
						title : '<i class="icon-remove-sign bigger-120"></i>&nbsp;Hubo un error',
						text : 'No se pudieron recuperar los llamados abiertos',
						class_name : 'gritter-error'
					});
				},
				function () { },
				false
			);

			return boolean;
		},
		
		exportPDF: function(e) {
			var self = this;
			
			self.retrieveCotizaciones(
				function(cotizacion) {
					self.getIntegrantes(function(integrantes) {
						self.integrantes = integrantes;
					})
					
				}, function(cotizacion) {
					var context = {};
					context.resultCotizacion = cotizacion;
					context.integrantes = self.integrantes;
					new PdfView().render(context, function(pdf) {
						// onSuccess();
					}, function( err ) {
						Util.error( err );
						OvUtil.alertMessage("Hubo un error al exportar las cotizaciones", "warning", "exclamation-sign", "Atenci\u00F3n");
					});
				});
		},
		
		retrieveCotizaciones: function(successFunction, completeFunction) {
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
					
					self.cotizacion = cotizacion;
					successFunction(cotizacion);

				},
				function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				function (data) {
					completeFunction(self.cotizacion)
				 }
			);
		},
		
		getIntegrantes: function(successFunction) {
			var self = this;

			CotizacionesService.getIntegrantes(idCotizacion,
				function (integrantes) {
					successFunction(integrantes);

				},
				function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				function () {
				}
			);
		},
		
		viewEditProspecto : function() {
			$("#abmProspectoModal").empty();
			$("#abmProspectoModal").append("Edici&oacute;n de Prospecto");

			Util.debug("editbutton", "prospecto", prospecto);
			var url = SettingsModel.get("url_edit_prospecto") + ProspectoUtil.composeProspectoPk(prospecto.pk) + '/' + this.processNameJBPM;
			Util.debug("url",url);
			$("#iframeABMProspecto").attr('src', url);
			$("#iframeABMProspecto").height($(window).height() - 135);
			$("#modal-abm-prospecto").modal("show");
		},
		
		reloadProspecto: function(onSuccess) {
			var self = this;

			ProspectoService.getProspectoByIncBajas(prospecto.pk.idProsp,prospecto.pk.id_tipo_pros,prospecto.pk.pro_version,false,
				function (response) {
					prospecto = response;
					Session.setLocal("Entity", JSON.stringify(prospecto));
					onSuccess(prospecto);
				},
				function (xhr, err) {
					encontrado = false;
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				},
				function () {
				}
			);
		},
		
		onClickFinalizado: function (e) {
			var self = this;
			
			self.seFinaliza = $(e.target).prop('checked');
			$("#btnFinalizar").toggle(); //boton de finalizar
			$("#btnNext").prop('disabled', self.seFinaliza);
		},
		
		onClickFinalizar: function (e) {
			var self = this;
			
			var form = $("#valid-form-3");
			self.saveForm(form, prospecto);
		},
		
		onHideAltaModal : function(e) {
			var self = this;
			
			var onSuccess = function( prospecto ) {
				self.prospectoIncompleto = ProspectoUtil.isIncompleteProspectoF( prospecto );
				if ( !self.prospectoIncompleto ) {
					$("#btnEdit").toggle();
				}
			};
			self.reloadProspecto(onSuccess);
			
			$("#iframeABMProspecto").attr('src', "");
			Util.debug("MODAL CLOSED");
		},
		
	});

	return newView;
}); 