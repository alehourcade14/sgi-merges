define([
	'jquery',
	'underscore',
	'backbone',
	'datatables',
	'datatablesBT',
	'handlebars',
	'bootstrap',
	'util',
    'text!libs/framework/templates/app/ventaRetail/paneles/completarGrupoFamiliarTemplate.html',
    'text!libs/framework/templates/app/ventaRetail/generico/panelIntegrante.html',
    '/form-smg-commons/js/libs/asyncProcessor.js',
    '/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
    '/form-smg-commons/js/libs/services/prospectoService.js',
    '/form-smg-commons/js/libs/services/obraSocialService.js',
    'text!libs/framework/templates/app/ventaRetail/paneles/panelAccionesWizard.html',
	'text!libs/framework/templates/app/ventaRetail/paneles/listExAfiliadosTableFormulario.html',
    '/form-cotizaciones-individuales/js/libs/framework/views/commons/servicios.js',
    'text!libs/framework/templates/app/ventaRetail/paneles/modalSelectAfiliadoTemplate.html',
    'libs/framework/views/app/ventaRetail/util/cotizadorUtil',
], function ($, _, Backbone, datatables, datatablesBT, Handlebars, bootstrap, Util,
    completarGrupoFamiliarTemplate, panelIntegrante, AsyncProcessor, AjaxScreenLockUtil,
     ProspectoService, ObraSocialService, accionesWizard, ListExAfiliadosTableFormulario, Servicios, ModalSelectAfiliadoTemplate, CotizadorUtil) {

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
        
        actionStepUnoEntrevistar: [ { "id": 5, "action": "aCerradoSinVenta", "rolesToHide": [], "description": "Finalizado sin Venta", "status" : { "id": 5, "description": "Cerrado sin Venta"} }],

		events: {
            'click		.btnAddIntegrante'			    : 'addIntegrante',
            'click		.btnDeleteIntegrante'		    : 'deleteIntegrante',
            'change  	.selectParentesco' 		        : 'habilitarCondicionAfiliacion',
            'change  	.selectCondicion'		        : 'habilitarRemuneracion',
            'keypress	.inputRemuneracion'			    : 'checkEnteros',
            'focus      .txtNroDocumento'               : 'storeInitialValue',
            'blur 		.txtNroDocumento' 				: 'validateDni',
            'change     .tipoDoc'                       : 'changeTipoDoc',
            'click		#registroMerlin'		        : 'autocompleteDatosMerlin', 
            'click 		.closeModalSelectAfiliado'	    : 'closeModal'
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
                    if (self.context.omitirCompletarProspecto || (self.context.task.name == 'Entrevistar' && (self.context.integrantes == undefined || self.context.integrantes == 0)))
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
                    self.checkTitularValidado(successFunction);
                },

                function (successFunction, context) {
                    self.checkCondExAfiliadoExist(successFunction);
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
                context.actionStepDosContactarList = self.actionStepUnoEntrevistar
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
            var integrantes=[];

            if(self.context.processDetail.integrantes.length > 0){
                integrantes=self.context.processDetail.integrantes;
            }else{
                if(self.context.cotizacion){
                    integrantes=self.context.cotizacion.integrantes;
                }
            }

            $("#grupoFamiliarContainer").empty();
            if(integrantes.length > 0 || self.context.cotizarForm){
                $.each(integrantes, function (key, integrante) {
                    var titular=integrante.tipo_inte === "T" ? true:false;
                    if(integrante.parentesco){
                        titular=integrante.parentesco === "T" ? true:false;
                        integrante.tipo_inte=integrante.parentesco;
                        integrante.cond_afi=integrante.ID_CONDICION;
                    }

                    $("#grupoFamiliarContainer").append(compiledTemplate({
                        context: self,
                        integrante: integrante,
                        titular:titular,
                        nroIntegrante: key
                    }));
                });
                
                self.reRenderIntegrantesButtons();
                if(self.context.task.name != "Contactar") self.context.cotizarForm = self.context.buildObjectGFamiliar();
                
            } else {
                $("#grupoFamiliarContainer").append(compiledTemplate({
                    context: self,
                    primerIntegrante: true,
                    titular:true
                }));
                self.reRenderIntegrantesButtons();
                if(self.context.integrantes && self.context.task.name != "Contactar"){ self.context.cotizarForm = self.context.buildObjectGFamiliar();}
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

            self.validateFormIntegrantes(successFunction)
        },

        deleteIntegrante: function () {
            var self = this;
            var integranteRow= $(event.target).closest(".integranteRow");
            var nroDoc = integranteRow.find(".txtNroDocumento").val();
            var tipoDoc = integranteRow.find(".tipoDoc").val();

            var isCotizarButtonVisible = $('#btnCotizar').is(':visible');

            if(self.context.task.name == 'Contactar'){
                if (isCotizarButtonVisible || self.context.cotizacion == undefined) {
                    self.eliminarRenderizarCondExAfiliado(nroDoc,tipoDoc);
                }
            } else {
                self.eliminarRenderizarCondExAfiliado(nroDoc,tipoDoc);
            }

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

        validateFormIntegrantes: function (onSuccess) {
            var self = this;
			var form = $(self.form);
            form.validate().resetForm();
			form.removeData("validator");
			self.validate.rules = self.context.viewConfig.rules;
			self.validate.messages = self.context.viewConfig.messages;

			form.validate(self.validate);
			if (!form.valid()) {
				self.onValidationFailure();
				return false;
			}

			onSuccess();
        },
        
        showValidatorErrors: function () {
			var self = this;
            if(self.rules){
                $.each(self.rules, function (key, value) {
                    $('[name="' + key + '"]').each(function () {
                        $(this).focusout();
                    });
                });
            }
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
        },

        storeInitialValue:function(event) {
            this.initialValueDoc = $(event.target).val();
        },

        changeTipoDoc:function(){
            var self=this;
            var integranteRow= $(event.target).closest(".integranteRow");
            var nroDoc = integranteRow.find(".txtNroDocumento").val();
            self.eliminarRenderizarCondExAfiliado(nroDoc,"changeTipoDoc");
            integranteRow.find(".txtNroDocumento").val("");
        },

        validateDni:function(d){
            var self=this;

            var integranteRow= $(event.target).closest(".integranteRow");
            var doc=$(event.target).val();
            var tipoDoc = integranteRow.find(".tipoDoc").val();
            var validado = integranteRow.find("#idIntValidado").val();
            var paren = integranteRow.find('.selectParentesco');
            self.datosDniMerlin = []

            // Verifica si el integrante ya fue validado para no realizar una nueva validación
            if (validado == "true" && paren.val() != "T") {
                return; 
            }
            Util.unBlockBody();
            
            //validar que no este en contactar y tenga una cotizacion, ya que no se permite editar los campos en esta tarea
            if(self.context.task.name == 'Contactar' && self.context.cotizacion != undefined){
                Util.unBlockBody();
                return false;
            }

            if(doc != ""){
                //valido si el dni ingresadoo no coincide con los demas integrantes
                if(!self.validDniIntegrantes(doc,tipoDoc,event.target)){
					Util.unBlockBody();
                    self.alertMessage("El DNI "+ doc+" ya ha sido registrado para este grupo familiar. Por favor, ingrese un número de documento diferente.", "warning", "exclamation-sign", "Atenci\u00F3n");
                    integranteRow.find(".txtNroDocumento").val("");
                    return false;
                }
                //validar contra merlin
                if(tipoDoc == 'DU'){
                    self.datosDniMerlin = Servicios.checkDniCuitValido( doc, null, true, null,tipoDoc )
                }

                if(self.datosDniMerlin){
                    if (self.datosDniMerlin && self.datosDniMerlin.length > 0 && !self.datosDniMerlin.valido ) {
                        $(event.target).val("") ;
                        Util.unBlockBody();
                        return false;
                    }else{
                        self.checkDatosMerlin();
                    }
                }
                
                var nombre = integranteRow.find("[id^='idNombre']").val();
                var apellido = integranteRow.find("[id^='idApellido']").val();
                
                //validar condicion ex afiliado
                self.checkCondExAfiliado(doc, tipoDoc, nombre, apellido);
                
                //eliminar en el caso de que exista los del dni que se modifica
                if(self.initialValueDoc != doc){
                    self.eliminarCondAfiliado(self.initialValueDoc,tipoDoc);
                }  
                //render grilla
                self.reRenderListCondExAfiliado();
            }else if(doc === ""){
                if(self.initialValueDoc != doc){
                    //eliminar en el caso de que exista los del dni que se modifica
                    self.eliminarCondAfiliado(self.initialValueDoc,tipoDoc);
                    //render grilla
                    self.reRenderListCondExAfiliado();
                }
            }
            
			Util.unBlockBody();

        },

        reRenderListCondExAfiliado:function(){
            var self=this;
            self.context.filtrarDetExAfiliados();
            self.context.renderListaExAfliados();
        },

        eliminarCondAfiliado: function (nroDoc, tipoDoc) {
            var self = this;
            if (nroDoc) {
                var filteredArray = [];
                for (var i = 0; i < self.context.processDetail.condExAfi.length; i++) {
                    var afi = self.context.processDetail.condExAfi[i];
                    if (tipoDoc === "changeTipoDoc") {
                        if (afi.nro_doc !== parseInt(nroDoc)) {
                            filteredArray.push(afi);
                        }
                    } else {
                        if (!(afi.nro_doc === parseInt(nroDoc) && afi.tipo_doc === tipoDoc)) {
                            filteredArray.push(afi);
                        }
                    }
                }
                self.context.processDetail.condExAfi = filteredArray;
            }
        },

        eliminarRenderizarCondExAfiliado:function(nroDoc,tipoDoc){
            var self=this;
            self.eliminarCondAfiliado(nroDoc,tipoDoc);
            self.reRenderListCondExAfiliado();
        },

        validDniIntegrantes: function (doc, tipoDoc, eventTarget) {
            var isValid = true;

            $('.integranteRow').each(function () {
       
                if (this === $(eventTarget).closest('.integranteRow')[0]) {
                    return true; 
                }

                let currentTipoDoc = $(this).find('.tipoDoc').val();
                let currentNroDoc = $(this).find('.txtNroDocumento').val();

                if (currentTipoDoc === tipoDoc && currentNroDoc === doc) {
                    isValid = false;
                    return false;
                }
            });

            return isValid;
        },

        checkCondExAfiliado: function(doc, tipoDoc, nombre, apellido) {
            var self = this;

            var condAfiliado = Servicios.getCondExAfiliado(doc, tipoDoc);
            if (condAfiliado && condAfiliado.length > 0) {
                // Filtrar los datos de exafiliado para asegurarse de que coincidan nombre y apellido
                const updatedCondAfiliado = condAfiliado.filter(afiEncontrad => {
                    const checkPersona = 
                        afiEncontrad.nombre.toLowerCase().trim() === nombre.toLowerCase().trim() &&
                        afiEncontrad.apellido.toLowerCase().trim() === apellido.toLowerCase().trim();
                    return checkPersona;
                });

                //si el dni cargado tiene condEx lo agrego al array para mostrar en la grilla
                if (self.context.processDetail && self.context.processDetail.condExAfi) {
                    for (var i = 0; i < updatedCondAfiliado.length; i++) {
                        var afiEncontrad = updatedCondAfiliado[i];
                        let exists = false;
                        for (var j = 0; j < self.context.processDetail.condExAfi.length; j++) {
                            var afiExist=self.context.processDetail.condExAfi[j]
                            //Agrego en el caso que no exista el mismo contrato,prepaga, inte en el array
                            if (afiEncontrad.prepaga === afiExist.prepaga && afiEncontrad.contra === afiExist.contra && afiEncontrad.inte === afiExist.inte) {
                                exists = true;
                                break;
                            }
                        }
                        if (!exists) {
                            self.context.processDetail.condExAfi.push(updatedCondAfiliado[i]);
                        }
                    }
                }
            }
        },

        checkCondExAfiliadoExist: function(successFunction){
            var self = this;
            //Valida si se ejecuto previamente la comprobación de condicion de ex afiliado. Si el canal no lo ejecutó se valida desde SGI
            if (self.context.processDetail && self.context.processDetail.canal) {
                var canal = self.context.processDetail.canal.descripcion;
                var canalesAVerificar = ['SGI', 'Web Clientes SMMP', 'SGC'];
                if (!canalesAVerificar.includes(canal) && (!self.context.processDetail.condExAfi || self.context.processDetail.condExAfi.length == 0)) {
                    //Valida si hay cargado integrantes, sino verifica unicamente al titular
                    if(self.context.processDetail.integrantes && self.context.processDetail.integrantes.length > 0){
                        $.each(self.context.processDetail.integrantes, function (key, integrante) {
                            if(integrante.num_doc && integrante.tipo_doc){
                                self.checkCondExAfiliado(integrante.num_doc, integrante.tipo_doc, integrante.nombre, integrante.apellido);
                            }
                        });
                    }else{
                        self.checkCondExAfiliado(self.context.prospecto.docNum, self.context.prospecto.docTipo, self.context.prospecto.nombre, self.context.prospecto.apellido);
                    }
                }
            }
            if(successFunction){
                successFunction();
            }
        },

        checkDatosMerlin: function() {
            var self = this;
            self.integranteRow = $(event.target).closest(".integranteRow");

            // Si no encuentra nada, asigna directamente el primer .integranteRow que es el titular
            self.integranteRow = self.integranteRow.length ? self.integranteRow : $("#completarGrupoFamiliarContainer .integranteRow").first();

            if (self.datosDniMerlin.length > 1) {
                var compiledTemplate = Handlebars.compile(ModalSelectAfiliadoTemplate);
                $("#modalSelectAfiliado").html(compiledTemplate({ datosMerlin: self.datosDniMerlin }));
                $("#modal-form-select-afiliado").modal("show");
                $(".modal-backdrop").remove();
            } else {
                self.autocompleteDatosMerlin(self.datosDniMerlin);
            }
        
            Util.unBlockBody();
        },

        autocompleteDatosMerlin: function(docuSelected) {
            var self = this;
            var rowMerlin = $(event.target).closest("#registroMerlin");
            var datoMerlinSelected;
        
            if (self.datosDniMerlin.length === 2) {
                datoMerlinSelected = self.getMerlinData(rowMerlin);
            } else {
                datoMerlinSelected = self.datosDniMerlin[0];
            }
        
            var inputNombre = self.integranteRow.find("[id^='idNombre']");
            var inputApellido = self.integranteRow.find("[id^='idApellido']");
            var inputNacimiento = self.integranteRow.find("[id^='idNacimiento']");
            var inputSexo = self.integranteRow.find("[id^='idSexo']");
            var inputEdad = self.integranteRow.find("[id^='idEdad']");
            var inputTipoDoc = self.integranteRow.find("[id^='idTipoDoc']");
            var inputNroDoc = self.integranteRow.find("[id^='idNroDoc']");
            var inputValidado = self.integranteRow.find("[id^='idIntValidado']");

            // Verifica si alguno de los campos ya tiene un valor
            if (inputNombre.val() || inputApellido.val() || inputNacimiento.val() || inputSexo.val() || inputEdad.val()) {
                self.alertMessage("Los datos fueron validados por el sistema", "success", "exclamation-sign", "Atención");
            }

            // Asigna los valores provenientes de Merlin
            self.setInputValueAndReadonly(inputNombre, datoMerlinSelected.nombre);
            self.setInputValueAndReadonly(inputApellido, datoMerlinSelected.apellido);
            self.setInputValueAndReadonly(inputNacimiento, datoMerlinSelected.fechaNacimiento);
            self.setInputValueAndReadonly(inputEdad, datoMerlinSelected.fechaNacimiento ? self.calcularEdad(datoMerlinSelected.fechaNacimiento) : "");

            // Configura los otros campos
            inputSexo.val(datoMerlinSelected.sexo || "").prop('disabled', true);
            inputTipoDoc.prop('disabled', true);
            inputNroDoc.prop('readonly', true);

            inputValidado.val(true);
        
            self.closeModal();
        },

        setInputValueAndReadonly: function (inputElement, value) {
            if (value && value !== "") {
                inputElement.val(value).prop('readonly', true);
            } else {
                inputElement.val("").prop('readonly', false);
            }
        },
        
        getMerlinData: function(rowMerlin) {
            var docuSelected = rowMerlin.find('td').data('docu');
            var nombreSelected = rowMerlin.find('td').data('nombre');
            var apeSelected = rowMerlin.find('td').data('ape');
        
            for (var i = 0; i < this.datosDniMerlin.length; i++) {
                var datoMerlin = this.datosDniMerlin[i];
                if (datoMerlin.numeroDocumento == docuSelected &&
                    datoMerlin.apellido == apeSelected &&
                    datoMerlin.nombre == nombreSelected) {
                    return datoMerlin;
                }
            }
        
            return {};
        },

        closeModal: function(){
			$('#modal-form-select-afiliado').modal('hide');
		},

        calcularEdad: function(fecha) {
            if (!fecha) return 0;
        
            var [diaNac, mesNac, anioNac] = fecha.split('/').map(Number);
            var fechaActual = new Date();
            var edad = fechaActual.getFullYear() - anioNac;
        
            if (fechaActual.getMonth() + 1 < mesNac || (fechaActual.getMonth() + 1 === mesNac && fechaActual.getDate() < diaNac)) {
                edad--;
            }
        
            return edad;
        },

        checkTitularValidado: function(successFunction){
            var self = this;

            //Verifica si hay cargados integrantes, sino verifica únicamente al titular
            if(self.context.processDetail.integrantes && self.context.processDetail.integrantes.length > 0){
                $.each(self.context.processDetail.integrantes, function (key, integrante) {
                    if(integrante.num_doc && integrante.tipo_doc && integrante.tipo_doc == 'DU'){
                        self.validarDniTitular(integrante.tipo_doc, integrante.num_doc, integrante.apellido, integrante.nombre);
                    }
                });
            }else if(self.context.prospecto.docTipo == 'DU'){
                self.validarDniTitular(self.context.prospecto.docTipo, self.context.prospecto.docNum, self.context.prospecto.apellido, self.context.prospecto.nombre);
            }
            successFunction();
        },

        validarDniTitular:function(tipoDoc, doc, apellido, nombre){
            var self=this;
            if(doc != ""){
                //validar contra merlin
                self.datosDniMerlin = Servicios.checkDniCuitValido( doc, null, true, apellido, tipoDoc)
                if(self.datosDniMerlin){
                    if (self.datosDniMerlin.valido === false) {
                        Util.unBlockBody();
                        return false;
                    }else{
                        self.checkDatosMerlin();
                    }
                }
            }
            Util.unBlockBody();
        },

    });

	return newView;
});
//# sourceURL=/form-cotizaciones-individuales/js/libs/framework/views/app/ventaRetail/completarGrupoFamiliarView.js