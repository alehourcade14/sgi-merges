define([
	'jquery',
	'underscore',
	'backbone',
	'util',
	'/form-smg-commons/js/libs/services/abmAfiliadoService.js',
	'/form-smg-commons/js/libs/services/filiationDataService.js',
	'/form-smg-commons/js/libs/services/phoneService.js',

], function (
	$,
	_,
	Backbone,
	Util,
	AbmAfiliadoService,
	FiliationDataService,
	PhoneService
) {

	var Servicios = Backbone.View.extend({

		getCondExAfiliado: function (docNum, docTipo) {
			var self = this;
			var result;

			AbmAfiliadoService.findCondExAfiliado(docNum,
				docTipo,
				'1',
				'0D10',
				false,
				function (data) {
					for (let i = 0; i < data.length; i++) {
						let condExAfi = data[i];
						let nuevasSituTerapeuticas = [];
						
						for (let j = 0; j < condExAfi.situ_terapeuticas.length; j++) {
							let situ = condExAfi.situ_terapeuticas[j];
							if (situ.stc_condi !== "ELEGIBLE") {
								nuevasSituTerapeuticas.push(situ);
							}
						}
						
						condExAfi.situ_terapeuticas = nuevasSituTerapeuticas;
					};
					result = data;
				},
				function (xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);

				},
				function () { }
			);

			return result;			
		},

		typeDocToCodMerlin: function(typeDoc) {
			if (typeDoc != null) {
				if (typeDoc.trim()=='DU') {
					typeDoc = 96;
				} else if (typeDoc.trim()=='LC'){
					typeDoc = 89;
				} else if (typeDoc.trim()=='LE'){
					typeDoc = 90;
				} else if (typeDoc.trim()=='PA'){
					typeDoc = 94;
				} else {
					typeDoc = 1;
				}
			} else {
				typeDoc = 96;
			}
			return typeDoc;
		},

		checkDniCuitValido: function( dni, cuit, personaFisica, apellido,tipoDocP) {
			var self = this;
			var datosDniMerlin = {};
			
			var tipoDoc = self.typeDocToCodMerlin(tipoDocP);
			
			var error = FiliationDataService.validateFiliationData(tipoDoc, dni, 80, cuit, apellido, null, null, null, 
				function(data) {
					
					datosDniMerlin = data.datosFiliatorios;

					if ( data.datosFiliatorios.length == 1 && data.datosFiliatorios[0].estado !== "NE" ) {
						datosDniMerlin.valido = true;
					} else if ( data.datosFiliatorios.length > 1 && dni && !apellido) {
						datosDniMerlin.valido = true;
					} else if ( data.datosFiliatorios.length > 1 && dni && apellido ) {
						var text = personaFisica ? 'El DNI y apellido ingresado no son v&aacute;lidos.' : 'El CUIT ingresado no es v&aacute;lido.'
						$.gritter.add({
							title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text: text,
							class_name: 'gritter-warning'
						});
					} else {
						var text = personaFisica ? 'El DNI ingresado no es v&aacute;lido.' : 'El CUIT ingresado no es v&aacute;lido.'
						$.gritter.add({
							title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text: text,
							class_name: 'gritter-warning'
						});
					}
				},
				function( xhr, err ) {
					Util.unBlockBody();
					if ( xhr.responseJSON != undefined && xhr.responseJSON.errorDesc === "Parametros Invalidos" ) {
						var text = personaFisica ? 'El DNI ingresado no es v&aacute;lido.' : 'El CUIT ingresado no es v&aacute;lido.'
						$.gritter.add({
							title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text: text,
							class_name: 'gritter-warning'
						});
					}else{
						$.gritter.add({
							title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text: "El DNI ingresado no es v&aacute;lido.",
							class_name: 'gritter-warning'
						});
					}
					Util.error( 'Sample of error data:', err );
					Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
				},
				function() {
					Util.unBlockBody();
				},
				false,
				null,
				"2.1"		
			);
			
			if ( error !== undefined ) {
				Util.unBlockBody();
				datosDniMerlin.valido = true;
				return datosDniMerlin;
			}
			return datosDniMerlin;
		},

		validarTelefono : function(codTipo, codPais, codNac, numero) {

			var validado = false;
			var ph;
			PhoneService.validatePhone(null, null, null, null, codNac, numero,
			// provincia, partido, localidad, cp, prefijo, numero
			function(data) {
				ph = eval(data);
				if (ph != null) {
					if ((ph.validado === 'SI' || ph.validado === 'CEL') && ph.estado === "CO") {
						validado = true
					}
				}
			}, function(xhr, err, urlRest, typeCall) {

			}, function(data) {

			});
			return validado;
		},

	});

	return new Servicios();
});
//@ sourceURL=serviciosProspectos.js