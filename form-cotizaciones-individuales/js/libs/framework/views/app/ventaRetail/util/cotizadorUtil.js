define([
    'jquery',
    'underscore',
    'backbone',
    '/form-smg-commons/js/libs/asyncProcessor.js',
    '/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
    '/form-smg-commons/js/libs/services/cotizacionesService.js',
    'util',
    '/form-smg-commons/js/libs/services/obraSocialService.js',

], function ($, _, Backbone, AsyncProcessor, AjaxScreenLockUtil, CotizacionesService, Util, ObraSocialService) {

    var SMG = 900805;

    var utilCotizador = Backbone.Model.extend({

        buildObjectCotizacion(cotizacionBruta) {
            var self = this; 
            var cotizacionNeta = [];

            if (cotizacionBruta != null) {

                Util.info("COTIZ: ", cotizacionBruta);

                for (var i = 0; i < cotizacionBruta.length; i++) {
                    var contiz = cotizacionBruta[i];
                    var codi = contiz.plan_codi;
                    for (var j = 0; j < cotizacionBruta.length; j++) {
                        var contiz2 = cotizacionBruta[j];
                        var codi2 = contiz2.plan_codi;
                        if (codi === codi2 && contiz.inte !== contiz2.inte) {
                            if (contiz2.comp_grupo === 'FAMILIAR A CARGO') {
                                if (contiz.pagarFamiliar === undefined) {
                                    contiz.pagarFamiliar = contiz2.valor_detalle;
                                } else {
                                    contiz.pagarFamiliar = contiz.pagarFamiliar + contiz2.valor_detalle;
                                }                             
                                contiz.valor_iva = contiz.valor_iva + contiz2.valor_iva;
                                contiz.valor_descuento = contiz.valor_descuento + contiz2.valor_descuento;
                            }
                        }
                    }
                    contiz.valorTotal = contiz.valor_detalle + ((contiz.pagarFamiliar !== undefined) ? contiz.pagarFamiliar : 0) + contiz.valor_iva - contiz.valor_aporte;
                        
                        var posi = cotizacionNeta.length;
                    if (posi === 0) {
                        cotizacionNeta.push(contiz);
                    } else {
                        var p = posi - 1;
                        if (cotizacionNeta[p].plan_codi !== contiz.plan_codi) {
                            cotizacionNeta.push(contiz);
                        }
                    }
                }
                
            }

            var cotizacion = self.buildPlanes(cotizacionNeta);
            return cotizacion;
        },

        obtenerCotizacion: function (cotizacionId, onSuccess, context1) {

            var self = this;
            self.cotizacionId = cotizacionId;
            self.detalleCotizacion = {};

            var asyncFunctions = [];

            asyncFunctions.push(function (successFunction, context) {
                AjaxScreenLockUtil.lock();
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                self.getPlanes(successFunction);
            });

            asyncFunctions.push(function (successFunction, context) {
                if(self.detalleCotizacion.planes.length > 0 )
                { self.detalleCotizacion = self.buildPlanes(self.detalleCotizacion.planes);
                    successFunction();
                }else{
                    self.alertMessage("No se pudo recuperar el detalle de la cotizacion", "warning", "exclamation-sign", "Atenci\u00F3n");
                    onSuccess();
                    successFunction();
                }

            });

            asyncFunctions.push(function (successFunction, context) {
                self.getIntegrantes(successFunction);
            });

            asyncFunctions.push(function (successFunction, context) {
                self.detalleCotizacion.integrantes = self.buildIntegrantes(self.detalleCotizacion.integrantes);
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                AjaxScreenLockUtil.unlock();
                context1.detalleCotizacion =  self.detalleCotizacion;
                successFunction();
            });

            asyncFunctions.push(function (successFunction, context) {
                onSuccess();
                successFunction();
            });

            AsyncProcessor.process(asyncFunctions, context1);

        },

        getIntegrantes: function (successFunction) {
            var self = this;

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

        buildPlanes(cotizacionNeta){
            var cotizacion = {};
            cotizacion.zona = {};
            cotizacion.zona = {};
            
            cotizacion.zona.id = cotizacionNeta[0].zona_cotizador !== undefined ? cotizacionNeta[0].zona_cotizador : cotizacionNeta[0].ZONA;
            cotizacion.cotizacionId = cotizacionNeta[0].contactoId ? cotizacionNeta[0].contactoId : cotizacionNeta[0].NRO_TRAMITE;
            cotizacion.processId = cotizacionNeta[0].nro_proceso ? cotizacionNeta[0].nro_proceso : 0;
            cotizacion.secuencia = cotizacionNeta[0].secuencia ? cotizacionNeta[0].secuencia : 1;
            cotizacion.planes = [];
            for (var i = 0; i < cotizacionNeta.length; i++) {
                var plan = {};
                plan.codigo = cotizacionNeta[i].plan_codi ? cotizacionNeta[i].plan_codi : cotizacionNeta[i].PLAN_OS;
                plan.valorDescuento = cotizacionNeta[i].valor_descuento  !== undefined ? cotizacionNeta[i].valor_descuento : (cotizacionNeta[i].DESCUENTO_MULTI !== undefined ? cotizacionNeta[i].DESCUENTO_MULTI : 0);
                plan.prepaga = cotizacionNeta[i].deno_prepaga ? cotizacionNeta[i].deno_prepaga : '';
                plan.composicion = cotizacionNeta[i].comp_grupo ? cotizacionNeta[i].deno_prepaga : cotizacionNeta[i].COMPOSICION;
                plan.valorFamiliar = cotizacionNeta[i].pagarFamiliar ? cotizacionNeta[i].pagarFamiliar : (cotizacionNeta[i].VALOR_FLIAR_CARGO ? cotizacionNeta[i].VALOR_FLIAR_CARGO : 0);
                plan.valorIva = cotizacionNeta[i].valor_iva  !== undefined ? cotizacionNeta[i].valor_iva : cotizacionNeta[i].IVA;
                plan.valorAporte = cotizacionNeta[i].valor_aporte  !== undefined ? cotizacionNeta[i].valor_aporte : cotizacionNeta[i].APORTES_DESC;
                plan.cuenta = " ";
                plan.valorDetalle = cotizacionNeta[i].valor_detalle  !== undefined ? cotizacionNeta[i].valor_detalle: cotizacionNeta[i].VALOR_TOTAL;
                plan.valorTotalPlan = plan.valorDetalle + (plan.valorFamiliar  !== undefined ? plan.valorFamiliar : 0);
                plan.valorTotal = cotizacionNeta[i].valorTotal  !== undefined ? cotizacionNeta[i].valorTotal - plan.valorDescuento: (plan.valorTotalPlan - plan.valorDescuento - plan.valorAporte + plan.valorIva);               
                plan.subcuenta = cotizacionNeta[i].deno_subcta ? cotizacionNeta[i].deno_subcta: '';
                cotizacion.planes.push(plan);
            }
            return cotizacion;
        },

        buildIntegrantes(integrantes){
            integrantesNew = [];
            for (var i = 0; i < integrantes.length; i++) {
                var integrante = {};
                integrante.parentescoDescripcion =  integrantes[i].DENO_PAREN;
                integrante.sueldoBruto =  integrantes[i].REMUNERACION;
                integrante.edad =  integrantes[i].EDAD;
                integrante.parentesco =  integrantes[i].PARENTEZCO;
                if(integrantes[i].ID_CONDICION){
                    integrante.sueldoBruto = integrantes[i].REMUNERACION;
                    integrante.ID_CONDICION =  integrantes[i].ID_CONDICION;
                }
                integrantesNew.push(integrante);
            }
            return integrantesNew;
        },

        alertMessage: function(message, severity, icon, title) {
            $.gritter.add({
                title: "<i class=\"icon-" + icon + "bigger-120\"></i>&nbsp;" + title,
                text: message,
                class_name: "gritter-" + severity
            });
        },

        buildObjectGFamiliarSMG: function () {
            const integrantes = this.detalleCotizacion.integrantes || [];
            const reemplazarIdCondicion = this.verificarRecotizacionSMG(integrantes);

            // Mapea los datos de integrantes con la lógica de reemplazo por SMG
            return integrantes.map((integrante, index) => {
                let idCondicion = integrante.ID_CONDICION;
        
                if (reemplazarIdCondicion && idCondicion !== null && idCondicion !== undefined) {
                    idCondicion = SMG;
                }
        
                return {
                    inte: index + 1,
                    parentesco: integrante.parentesco || null,
                    sexo: integrante.sexo || "M",
                    edad: integrante.edad || null,
                    obraSocial: idCondicion === -1 ? null : Number(idCondicion) || null,
                    remuneracion: integrante.sueldoBruto || 0
                };
            });
        },

        verificarRecotizacionSMG: function(integrantes) {
            // Verifica si hay algún ID_CONDICION válido (no null) distinto de SMG
            for (let i = 0; i < integrantes.length; i++) {
                const idCondicion = integrantes[i].ID_CONDICION;
                if (idCondicion !== undefined && idCondicion != SMG) {
                    return true;
                }
            }
            return false;
        },
        
        loadObrasSociales: function (version, successFunction) {
            var self = this;

            ObraSocialService.getObrasSocialesVers(
				version,
                function (data) {
                    var obrasSociales = data.resultadoBusqueda.obrasSociales;
					var obrasSocialesF = [];
					obrasSocialesF = self.ordenarObrasSociales(obrasSociales);
					if (successFunction) {
						successFunction(obrasSocialesF);  
					}
                },
                function (xhr, err) {
                    self.onError(xhr, err, "las obras sociales");
                    Util.unBlockBody();
                },
                function (data) {

                }, true);
        },

		ordenarObrasSociales: function(obrasSociales){
			var self = this;
			var primeraObraSocial = obrasSociales.find(os => os.codigoSSSalud === SMG);
			var otrasObrasSociales = obrasSociales.filter(os => os.codigoSSSalud !== SMG);
			
			var obrasSocialesOrdenadas = [];

			if (primeraObraSocial) {
				obrasSocialesOrdenadas.push(primeraObraSocial);
			}

			obrasSocialesOrdenadas = obrasSocialesOrdenadas.concat(otrasObrasSociales);

			return obrasSocialesOrdenadas;
		},

    });

    // Return the alert error message view.
    return new utilCotizador();
});