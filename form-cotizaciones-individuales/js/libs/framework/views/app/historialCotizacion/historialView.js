define([
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
    'session',
    'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/historialCotizacion/formHistorialTemplate.html',
    'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/historialCotizacion/tablaHistorialTemplate.html',
    'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/historialCotizacion/modalDetalleCotizacionTemplate.html',
    'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/historialCotizacion/detalleCotizacionTemplate.html',
    '/form-smg-commons/js/libs/asyncProcessor.js',
    '/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
    '/form-smg-commons/js/libs/services/fuseService.js',
    '/form-smg-commons/js/libs/services/cotizacionesService.js',
    '/form-cotizaciones-individuales/js/libs/framework/views/app/ventaRetail/util/cotizadorUtil.js',
], function ($,
    _,
    Backbone,
    Handlebars,
    bootstrap,
    ace,
    Encoding,
    SettingsModel,
    Util,
    InboxService,
    Session,
    formHistorialTemplate,
    tablaHistorialTemplate,
    modalDetalleCotizacionTemplate,
    detalleCotizacionTemplate,
    AsyncProcessor,
    AjaxScreenLockUtil,
    FuseService,
    CotizacionesService,
    CotizadorUtil
    ){
    
    var newView = Backbone.View.extend({

        events: {
			'click		.openDetalleCotizacion' 			: 'showModalDetalleCotizacion'
		},

        showLoadingBubble: function (target, successFunction) {
            target.empty();
            target.css("height", "50px");
            target.css("background-image", "url('../static/images/loading_bubble.gif')");
            target.css("background-size", "24px 24px");
            target.css("background-repeat", "no-repeat");
            target.css("background-attachment", "relative");
            target.css("background-position", "center");

            if (successFunction) {
                successFunction();
            }
        },

        hideLoadingBubble: function (target, successFunction) {
            target.css("height", "");
            target.css("background-image", "");
            target.css("background-repeat", "");
            target.css("background-size", "");
            target.css("background-attachment", "");
            target.css("background-position", "");

            if (successFunction) {
                successFunction();
            }
        },

        alertMessage: function(message, severity, icon, title) {
            $.gritter.add({
                title: "<i class=\"icon-" + icon + "bigger-120\"></i>&nbsp;" + title,
                text: message,
                class_name: "gritter-" + severity
            });
        },

        list: function (id) {
            var self = this;
           
            Handlebars.registerHelper('changeDecimalSeparator', function(number) {
                if(number){
                    var roundedNumber = parseFloat(number).toFixed(2);
                    var numStr = roundedNumber.toString();
                    var x = numStr.split('.'); 
                    var despComa = x[1] === undefined ? '00' : x[1].padEnd(2, '0'); 
            
                    return x[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ',' + despComa;
                }
            });

            var elemento = $('#prospectoTramite').val();
            self.target = '#' + id + '-content-tab';
            self.tableTarget = '#tablaHistorialContainer';
            var prospecto = $.parseJSON(Session.getLocal("Entity"));

            if (prospecto == undefined || prospecto == null || Object.keys(prospecto).length === 0) {
                self.prospecto = self.reloadProspecto(elemento);
            } else {
                self.prospecto = prospecto;
            }

            var asyncFunctions = [];

            asyncFunctions.push(function (successFunction, context) {
                AjaxScreenLockUtil.lock();
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                $(self.target).empty();
                $(self.target).append(self.render().el);
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                self.showLoadingBubble($(self.tableTarget), successFunction)
            });

            asyncFunctions.push(function (successFunction, context) {
                self.getCotizacionesList(successFunction);
            });

            asyncFunctions.push(function (successFunction, context) {
                self.getTramitesVsiList(successFunction);
            });

            asyncFunctions.push(function (successFunction, context) {
				self.parseInfoCotizacionesList(successFunction);
			});

            asyncFunctions.push(function (successFunction, context) {
				self.addStateProcesoRelacionado(successFunction);
			});

            asyncFunctions.push(function (successFunction, context) {
                self.renderHistorial(successFunction);
            });

             asyncFunctions.push(function (successFunction, context) {
                 self.hideLoadingBubble($(self.tableTarget), successFunction)
                 successFunction();
             });

            asyncFunctions.push(function (successFunction, context) {
                AjaxScreenLockUtil.unlock();
                successFunction();
            });

            AsyncProcessor.process(asyncFunctions, {});
        },

        getCotizacionesList: function (successFunction) {
            var self = this;
           
            var from = '01-01-1900';
            var to = '01-01-1900';
            var process = 'Cotizador Individuos';
            var state = 'cerrados';
            var input = '&DOC-' + self.prospecto.docNum;

            onSuccess = function (data) {
                self.cotizacionesList = data;
                successFunction();
            };

            onError = function (xhr, err) {
                Util.error("Sample of error data:", err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                self.alertMessage("No se pudieron recuperar las cotizaciones", "warning", "exclamation-sign", "Atenci\u00F3n");
            };

            onComplete = function () {

            };

            InboxService.searchAdvanceTask(from, to, process, state, input, onSuccess, onError, onComplete);
        },

        getTramitesVsiList: function (successFunction) {
            var self = this;
           
            var from = '01-01-1900';
            var to = '01-01-1900';
            var process = 'Venta Salud Individuos';
            var state = 'abiertos';
            var input = '&PRO-' + self.prospecto.pk.idProsp;

            onSuccess = function (data) {
                self.vsiAbiertosList = data;
                successFunction();
            };

            onError = function (xhr, err) {
                Util.error("Sample of error data:", err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                self.alertMessage("No se pudieron recuperar las cotizaciones", "warning", "exclamation-sign", "Atenci\u00F3n");
            };

            onComplete = function () {

            };

            InboxService.searchAdvanceTask(from, to, process, state, input, onSuccess, onError, onComplete);
        },

        parseInfoCotizacionesList: function (successFunction) {
			var self = this;

			$.each(self.cotizacionesList, function (key, value) {
                if (value.detalle) {
                    var detalleSplitted = value.detalle.split("-");
                    value.canal = detalleSplitted[0]? detalleSplitted[0] : null;
                    value.zona = detalleSplitted[1]? detalleSplitted[1] : null;
                    value.capitas = detalleSplitted[2]? detalleSplitted[2] : null;
                }
			});

			successFunction();
        },

        addStateProcesoRelacionado: function (successFunction) {
			var self = this;

            for (var i = 0; i < self.vsiAbiertosList.length; i++) {
                var processId = self.vsiAbiertosList[i].processId;
                for (var j = 0; j < self.cotizacionesList.length; j++) {
                    var procesoRelacionadoId = self.cotizacionesList[j].procesoRelacionadoId;
                    self.cotizacionesList[j].procesoRelacionadoIdAbierto = false;
                    if (processId === procesoRelacionadoId) {
                        self.cotizacionesList[j].procesoRelacionadoIdAbierto = true;
                    }
                }
            }

			successFunction();
        },

        getIntegrantes: function (successFunction) {
            var self = this;
            self.detalleCotizacion = {};

            var onSuccess = function (integrantes) {
                self.detalleCotizacion.integrantes = integrantes;
                successFunction();
            };

            var onError = function (xhr, err) {
                Util.error("Sample of error data:", err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                self.alertMessage("No se pudo recuperar el detalle de la cotizacion", "warning", "exclamation-sign", "Atenci\u00F3n");
            };

            var onComplete = function () {

            };

            CotizacionesService.getIntegrantes(self.cotizacionId, onSuccess, onError, onComplete);
        },

        getPlanes: function (successFunction) {
            var self = this;

            var onSuccess = function (planes) {
                var coti1, coti2;
                
				for (var i = 0; i < planes.length; i++) {
                    coti1 = planes[i];
					coti1.VALOR_FLIAR_CARGO = 0;
					for (var j = i+1; j < planes.length; j++) {
                        coti2 = planes[j];
						if (coti1.PLAN_OS === coti2.PLAN_OS) {
                            coti1.IVA = coti1.IVA + coti2.IVA;
							if (coti2.COMPOSICION === "FAMILIAR A CARGO") {
                                coti1.VALOR_FLIAR_CARGO += coti2.VALOR_TOTAL;
							}
							planes.splice(j,1);
							j--;
						}
					}
					coti1.DESCUENTO = 0;
					coti1.TOTAL_A_COBRAR = parseFloat(coti1.VALOR_TOTAL) + parseFloat(coti1.VALOR_FLIAR_CARGO) + parseFloat(coti1.IVA) - parseFloat(coti1.APORTES_DESC) -  coti1.DESCUENTO ;
                }
                
                self.detalleCotizacion.planes = planes;
                successFunction();
            };

            var onError = function (xhr, err) {
                Util.error("Sample of error data:", err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                self.alertMessage("No se pudo recuperar el detalle de la cotizacion", "warning", "exclamation-sign", "Atenci\u00F3n");
            };

            var onComplete = function () {

            };

            CotizacionesService.getCotizacion(self.cotizacionId, onSuccess, onError, onComplete);
        },

        getCotizacion: function (successFunction) {
            var self = this;
			FuseService.getDetallePorProcessId(self.processId,true,
				function(data) {
                    self.procesoRelacionadoId = data.processId;
                    self.detalleCotizacion = data;
                    self.cotizacionId = data.cotizacionId;
                    successFunction();
				},
				function( xhr,err ) {
					Util.error( 'Sample of error data:', err );
					Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
				},
				function () {
                    
				}
			);
		},
        
        getProcesoRelacionadoDetalle: function (successFunction) {
            var self = this;
            
            var onSuccess = function (data) {
                self.procesoRelacionadoDetalle = data.reverse();
                successFunction();
            };

            var onError = function (xhr, err) {
                Util.error("Sample of error data:", err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                self.alertMessage("No se pudo recuperar el detalle de la cotizacion", "warning", "exclamation-sign", "Atenci\u00F3n");
            };

            var onComplete = function () {

            };

            FuseService.getDetallePorProcessId(self.procesoRelacionadoId, true, onSuccess, onError, onComplete);
        },

        filterPlanesSelected: function (successFunction) {
            var self = this;

            self.detalleCotizacion.tareas = [];
            $.each(self.procesoRelacionadoDetalle, function (key, procesoRelacionadoTask) {

                if (procesoRelacionadoTask.cotizacion && procesoRelacionadoTask.cotizacion.id == self.cotizacionId) {
                    var tarea = {};
                    tarea.estado = procesoRelacionadoTask.tarea.id;
                    tarea.altaFecha = procesoRelacionadoTask.altaFecha;
                    tarea.planes = [];

                    var planesSelected = procesoRelacionadoTask.planVenta? procesoRelacionadoTask.planVenta.split(",") : [];
                    planesSelected.length > 1? planesSelected.pop() : null;

                    $.each(self.detalleCotizacion.planes, function (key, plan) {
                        if (planesSelected.includes(plan.codigo) || planesSelected.includes(plan.PLAN_OS)) {
                            tarea.planes.push(plan);
                        }
                    });

                    self.detalleCotizacion.tareas.push(tarea);
                }
            });

            successFunction();
        },

        renderHistorial: function (successFunction) {
            var self = this;
            var compiledTemplate = Handlebars.compile(tablaHistorialTemplate);

            $(self.tableTarget).append(compiledTemplate({
                context: self
            }));
            
            successFunction();
        },

        showModalDetalleCotizacion: function () {
            var self = this;
            self.targetDetalleCotizacion = "#detalleCotizacionContainer";
            self.cotizacionId = $(event.target).closest('td').data("cotizacion-id");
            self.processId = $(event.target).closest('td').data("process-id");
            self.typeProcess = $(event.target).closest('td').data("type-process");
            self.procesoRelacionadoId = $(event.target).closest('td').data("proceso-relacionado-id");

            var asyncFunctions = [];

            asyncFunctions.push(function (successFunction, context) {
                AjaxScreenLockUtil.lock();
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                $('#modals-consultation').empty();
                var compiledTemplate = Handlebars.compile(modalDetalleCotizacionTemplate);
                $('#modals-consultation').append(compiledTemplate());
                $("#modal-detalle-cotizacion").modal("show");
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                self.showLoadingBubble($(self.targetDetalleCotizacion), successFunction)
            });

            if(self.typeProcess == 'Cotizador Individuos'){
                asyncFunctions.push(function (successFunction, context) {
                    self.getCotizacion(successFunction);
                });
            }else {
                asyncFunctions.push(function (successFunction, context) {
                    self.getIntegrantes(successFunction);
                });
    
                asyncFunctions.push(function (successFunction, context) {
                    self.getPlanes(successFunction);
                });
            }

            asyncFunctions.push(function (successFunction, context) {
                self.buscarObrasSociales(successFunction);
            });

            if(!Util.isEmpty(self.procesoRelacionadoId)){
                asyncFunctions.push(function (successFunction, context) {
                    self.getProcesoRelacionadoDetalle(successFunction);
                });

                asyncFunctions.push(function (successFunction, context) {
                    self.filterPlanesSelected(successFunction);
                });
            }
            
            asyncFunctions.push(function (successFunction, context) {
                $(self.targetDetalleCotizacion).empty();
                var compiledTemplate = Handlebars.compile(detalleCotizacionTemplate);
                $(self.targetDetalleCotizacion).append(compiledTemplate({context: self}));
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
            	self.hideLoadingBubble($(self.targetDetalleCotizacion), successFunction);
            	successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                AjaxScreenLockUtil.unlock();
                successFunction();
            });

            AsyncProcessor.process(asyncFunctions, {});
        },

        // Render method.
        render: function () {
            var self = this;
            var compiledTemplate = Handlebars.compile(formHistorialTemplate);

            self.$el.html(compiledTemplate({
                context: self
            }));
            return self;
        },
		
		reloadProspecto: function (elemento) {
		    var self = this;
		    var prospecto = null;
		    var url = SettingsModel.get("detail_prospecto") + '/idProspecto/' + elemento;
		    $.ajax({
		        url: url,
		        type: 'GET',
		        contentType: "application/json; charset=UTF-8",
		        async: false,
		        success: function (response) {
		            prospecto = response;

		        }
		    });
		    return prospecto;
        },

        buscarObrasSociales: function (successFunction) {
			var self = this;
            var version = 2;
			CotizadorUtil.loadObrasSociales(version, function (obrasSociales) {
				self.obrasSociales = obrasSociales;  
		
				if (successFunction) {
					successFunction();
				}
			});
		},

    })

    return newView;
})

//# sourceURL=historialCotizacion.js