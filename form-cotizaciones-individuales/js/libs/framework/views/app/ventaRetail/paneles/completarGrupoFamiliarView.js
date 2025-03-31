define([
	'jquery',
	'underscore',
	'backbone',
	'datatables',
	'datatablesBT',
	'handlebars',
	'bootstrap',
	'util',
    'session',
    'text!libs/framework/templates/app/ventaRetail/paneles/completarGrupoFamiliarTemplate.html',
    'text!libs/framework/templates/app/ventaRetail/generico/panelIntegrante.html',
    '/form-smg-commons/js/libs/asyncProcessor.js',
    '/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
    '/form-smg-commons/js/libs/services/prospectoService.js',
    '/form-smg-commons/js/libs/services/obraSocialService.js',
    'text!libs/framework/templates/app/ventaRetail/paneles/panelAccionesWizard.html',
	'text!libs/framework/templates/app/ventaRetail/paneles/listExAfiliadosTableFormulario.html',
    'libs/framework/views/app/ventaRetail/util/cotizadorUtil',
], function ($, _, Backbone, datatables, datatablesBT, Handlebars, bootstrap, Util,
     Session, completarGrupoFamiliarTemplate, panelIntegrante, AsyncProcessor, AjaxScreenLockUtil, ProspectoService,
      ObraSocialService, accionesWizard, ListExAfiliadosTableFormulario, CotizadorUtil) {

    var newView = Backbone.View.extend({

        validate: {
			ignore: ":hidden:not(.validable), .notValidable, :disabled",
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
				error.insertAfter(element);
			},
			submitHandler: function (form) {},
			invalidHandler: function (form) {}
        },
        
        rules: {
			'solicitudCotizacion[zona][id]':{
                required: true
            },
            'solicitudCotizacion[grupoFamiliar][][parentesco]':{
                required: true
            },
            'solicitudCotizacion[grupoFamiliar][][sexo]':{
                required: true
            },
            'solicitudCotizacion[grupoFamiliar][][edad]':{
                required: true
            },
            'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
                required: true
            }
		},

		messages: {
			'solicitudCotizacion[zona][id]':{
                required: "Ingrese la Zona."
            },
            'solicitudCotizacion[grupoFamiliar][][parentesco]':{
                required: "Ingrese el Tipo de Integrante."
            },
            'solicitudCotizacion[grupoFamiliar][][sexo]':{
                required: "Ingrese el Sexo."
            },
            'solicitudCotizacion[grupoFamiliar][][edad]':{
                required: "Ingrese la Edad."
            },
            'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
                required: "Ingrese la Condición de Afiliación."
            }
        },
        
        actionStepUnoEntrevistar: [ { "id": 5, "action": "aCerradoSinVenta", "rolesToHide": [], "description": "Finalizado sin Venta", "status" : { "id": 5, "description": "Cerrado sin Venta"} }],

		events: {
            'click		.btnAddIntegrante'			    : 'addIntegrante',
            'click		.btnDeleteIntegrante'		    : 'deleteIntegrante',
            'change  	.selectParentesco' 		        : 'habilitarCondicionAfiliacion',
            'change  	.selectCondicion'		        : 'habilitarRemuneracion',
            'click		#btnCotizarIndividuo'			: 'cotizarIndividuo',
            'keypress	.inputRemuneracion'			    : 'checkEnteros'
        },

        render: function (context) {
            
            var self = this;

            self.context = context;
            self.form = "#validation-form-retail";

            self.renderAsyncElements();
            self.delegateEvents();

            if(context.prospecto.telefonos.length>0){                
                for (let index = 0; index < context.prospecto.telefonos.length; index++) {
                    if (context.prospecto.telefonos[index].tipo_tele === 'I'){
                        context.prospecto.telefonos[index].tipo_tele = 'P';
                    }
                }
            }  
        },

        renderAsyncElements: function () {
            var self = this;

            AsyncProcessor.process([
                function (successFunction, context) {
                    AjaxScreenLockUtil.lock();
                    successFunction();
                },

                function (successFunction, context) {
                    self.loadZonas(successFunction);
                },

                function (successFunction, context) {
                    self.renderTemplate(successFunction);
                },

                function (successFunction, context) {
                    // si se omite completar el prospecto y si viene de una etapa sin cotizacion hay que cargar los botones de accion
                    //*QUITAR ENTREVISTAR CUANDO NO EXISTAN TRAMITES DE VERSIONES ANTERIORES*
                    if (self.context.omitirCompletarProspecto || ((self.context.task.name == 'Entrevistar' || self.context.task.name == 'Comercializar') && (self.context.integrantes == undefined || self.context.integrantes == 0)))
                        self.renderTemplateAccions(successFunction, context);
                    else
                        successFunction();
                },

                function (successFunction, context) {
                    self.loadParentescos(successFunction);
                },

                function (successFunction, context) {
                    self.loadObrasSociales(successFunction);
                },

                function (successFunction, context) {
                    self.initIntegrantes(successFunction);
                },

                function (successFunction, context) {
                    self.initExAfiliado(successFunction);
                },

                function (successFunction, context) {
                    AjaxScreenLockUtil.unlock();
                    successFunction();
                }
            ], self.context);

        },

        renderTemplate: function (successFunction) {
            var self = this;
            var compiledTemplate = Handlebars.compile(completarGrupoFamiliarTemplate);
            self.$el.html(compiledTemplate({
                context: self
            }));
            $("#completarGrupoFamiliarContainer").html(self.el);

            successFunction();
        },

        renderTemplateAccions: function (onSuccess, context) {
            var self = this;
            var panelActivo = $('.ace-wizard').find('li.active').attr('data-target');

            var compiledTemplate = Handlebars.compile(accionesWizard);
            var acciones = {};
            acciones.mostrarCheckCerrado = false;
            acciones.mostrarFinalizarHide = true;
            if(self.context.omitirCompletarProspecto){
                acciones.mostrarVolver = false;
                acciones.mostrarSiguiente = false;
                acciones.mostrarCotizar = true;
            }
            else{
                acciones.mostrarVolver = false;
                acciones.mostrarSiguiente = true;
                acciones.mostrarCotizar = false;
            }

            acciones.mostrarActionStepDosContactar = true;
			//Para evitar la accion 'Entrevistar' recientemente incorporada en mostrarActionStepDosContactar
            if(panelActivo == '#step1-entrevistar'){
                acciones.mostrarContacto = true;
                context.actionStepDosContactarList = context.task.actions;
                acciones.mostrarSiguiente = false;
                acciones.mostrarCotizar = true;
            }

            if(panelActivo == '#step2-contactar'){
                acciones.mostrarContacto = true;
            }

            $("#wizard-acciones").html(compiledTemplate({acciones: acciones, context: context}));
            
            $("#controlActions").css({top: 26, position:'relative'});
            
            onSuccess();
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

        loadParentescos: function (successFunction) {
            var self = this;

            $.ajax({
                url: "../staticJson/parentescos.json?date=" + new Date().getTime(),
                type: 'GET',
                async: true,
                success: function (data) {
                    self.parentescos = data;
                    successFunction();
                },
                error: function (xhr, err) {
                    self.onError(xhr, err, "los parentescos");
                }
            });
        },

        loadObrasSociales: function (successFunction) {
			var self = this;
            var version = 3;
			CotizadorUtil.loadObrasSociales(version, function (obrasSociales) {
				self.obrasSociales = obrasSociales;  
		
				if (successFunction) {
					successFunction();
				}
			});
		},

        initIntegrantes: function (successFunction) {
            var self = this;
            var compiledTemplate = Handlebars.compile(panelIntegrante);
            $("#grupoFamiliarContainer").empty();
            if(self.context.integrantes || self.context.cotizarForm){
                if(self.context.cotizarForm){
                    $.each(self.context.cotizarForm.grupoFamiliar, function (key, integrante) {
                        $("#grupoFamiliarContainer").append(compiledTemplate({
                            context: self,
                            integrante: integrante
                        }));
                    });
                }else{
                    $.each(self.context.integrantes, function (key, integrante) {
                        $("#grupoFamiliarContainer").append(compiledTemplate({
                            context: self,
                            integrante: integrante
                        }));
                    });
                }
                
                self.reRenderIntegrantesButtons();
                if(self.context.task.name != "Contactar") self.context.cotizarForm = self.context.buildObjectGFamiliar();
                
            } else {
                $("#grupoFamiliarContainer").append(compiledTemplate({
                    context: self,
                    primerIntegrante: true
                }));
                self.reRenderIntegrantesButtons();
            }

            if(successFunction){
                successFunction();
            }
        },

        initExAfiliado: function (successFunction) {
            var self = this;
            if(self.context.processDetail.condExAfi){
				var target = $('#listExAfiliadoContainer');
			
                var compiledTemplate = Handlebars.compile(ListExAfiliadosTableFormulario);
                target.empty();

                target.append(compiledTemplate({ context: self.context }));
			}
            successFunction();
        },

        addIntegrante: function () {
            var self = this;
            
            var successFunction = function () {
                var compiledTemplate = Handlebars.compile(panelIntegrante);
                $("#grupoFamiliarContainer").append(compiledTemplate({
                    context: self
                }));
                self.reRenderIntegrantesButtons();
            };

            self.validateForm(successFunction)
        },

        deleteIntegrante: function () {
            var self = this;
            $(event.target).closest(".integranteRow").remove();
            self.reRenderIntegrantesButtons();
            self.context.cambiarAccionesWizard();
        },

        reRenderIntegrantesButtons: function () {
            var self = this;
            var integranteRows = $(".integranteRow");
            integranteRows.each(function () {
                $(this).find(".divAddIntegrante").hide();
                $(this).find(".divDeleteIntegrante").show();
            });
            
            var parentescos= $(".selectParentesco");
            for(var i=0; i < parentescos.length - 1; i++ ) {
            	var parentescoRepetido = parentescos[i].value;
            	
            	if( parentescoRepetido == "T" || parentescoRepetido == "E" ){
            		$(".selectParentesco:last").find('option[value="'+parentescoRepetido+'"]').remove();            		
            	}
            }

            for(var i=0; i < parentescos.length; i++ ) {
            	var parentesco = parentescos[i].value;
                if(parentesco === "E" || parentesco === "T"){
                    $(".selectCondicion:last").removeAttr("disabled");
                }else{
                    $(".selectCondicion:last").attr("disabled", "disabled");
                }
            }
           
            
            integranteRows.first().find(".divDeleteIntegrante").hide();
            if( $(".selectParentesco:last option").length > 2 || $(".selectParentesco:last option").val() == 'T' ) {
            	integranteRows.last().find(".divAddIntegrante").show();            	
            }
            
        },

        habilitarCondicionAfiliacion: function () {
            var integranteRow= $(event.target).closest(".integranteRow");
            var parentesco = $(event.target).val();
            var selectCondicion = integranteRow.find(".selectCondicion");
            var inputRemuneracion = integranteRow.find(".inputRemuneracion");
            
            if (parentesco === 'T' || parentesco === 'E' || parentesco==='') {
                selectCondicion.removeAttr("disabled");
            } else {
                selectCondicion.attr("disabled", "disabled");
                inputRemuneracion.attr("disabled", "disabled");
            }
        },

        habilitarRemuneracion: function () {
            var integranteRow = $(event.target).closest(".integranteRow");
            var parentesco = integranteRow.find(".selectParentesco").val();
            var condicion = $(event.target).val();
            var inputRemuneracion = integranteRow.find(".inputRemuneracion");

            if ((parentesco === 'T' || parentesco === 'E') && (condicion && parseInt(condicion) !== -1)) {
                inputRemuneracion.removeAttr("disabled");
                inputRemuneracion.prop('required',true);
                integranteRow.find(".lblRemuneracion").html('Remuneraci&oacute;n Bruta<i class="icon-asterisk red"style="font-size: 10px;vertical-align: 5px;"></i>');
            } else {
                integranteRow.find(".lblRemuneracion").html('Remuneraci&oacute;n Bruta');
                inputRemuneracion.attr("disabled", "disabled");
                inputRemuneracion.prop('required',false);
                inputRemuneracion.val("");
                integranteRow.find(".lblRemuneracion").closest('.control-group').removeClass('error');
                integranteRow.find("span.help-inline").hide();
            }
        },

        validateForm: function (onSuccess) {
            var self = this;
			var form = $(self.form);

			self.validate.rules = self.rules;
			self.validate.messages = self.messages;

			form.validate(self.validate);
			if (!form.valid()) {
				self.onValidationFailure();
				return false;
			}

			onSuccess();
        },
        
        showValidatorErrors: function () {
			var self = this;
			$.each(self.rules, function (key, value) {
				$('[name="' + key + '"]').each(function () {
					$(this).focusout();
				});
			});
        },
        
        cotizarIndividuo: function () {
      
        },

        onError: function (xhr, err, message) {
            var self = this;
            self.logError(xhr, err);
            self.alertMessage("No se pudieron recuperar " + message, "warning", "exclamation-sign", "Atenci\u00F3n");
        },

        alertMessage: function (message, severity, icon, title) {
            $.gritter.add({
                title: "<i class=\"icon-" + icon + "bigger-120\"></i>&nbsp;" + title,
                text: message,
                class_name: "gritter-" + severity
            });
        },

        logError: function (xhr, err) {
            Util.error("Sample of error data:", err);
            Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
        },

        onValidationFailure: function () {
            var self = this;
            self.showValidatorErrors();
			self.alertMessage("Por favor ingrese los datos necesarios", "warning", "exclamation-sign", "Atenci\u00F3n");
        },
        
        checkEnteros: function (e){
            //es para filtrar la letra e del input
            var valido = e.keyCode==101 ? false : true;
            return valido;
        }

    });

	return newView;
});
//# sourceURL=/form-cotizaciones-individuales/js/libs/framework/views/app/ventaRetail/completarGrupoFamiliarView.js