define ([
         'jquery',
	     'underscore',
	     'backbone',
	     'util',
	     '/form-smg-commons/js/libs/services/loginService.js'
], function ($, _, Backbone, Util, LoginService) {

	var OvUtil = Backbone.Model.extend ({
		
		isNull: function(object) {
			return (object == undefined || object == null);
		},

		isEmptyString: function(string) {
			var self = this;

			return (self.isNull(string) || $.trim(string).length == 0);
		},

		isEqual: function(o1, o2) {
			var self = this;
			var o1Value = o1;
			var o2Value = o2;
			if(!self.isNull(o1Value) && !self.isNull(o2Value)) {
				o1Value = $.trim(o1Value);
				o2Value = $.trim(o2Value);
			}
			return (o1Value == o2Value);
		},
		
		isEqualToString: function(o1, o2) {
			var self = this;
			var o1Value = (o1 != null ? o1.toString() : null);
			var o2Value = (o2 != null ? o2.toString() : null);
			
			return self.isEqual(o1Value, o2Value);
		},
		
		isSameObject: function(o1, o2, idField) {
			var self = this;
			var o1Id = (!self.isNull(o1) ? o1[idField] : null);
			var o2Id = (!self.isNull(o2) ? o2[idField] : null);

			return self.isEqual(o1Id, o2Id);
		},
		
		toString: function(object) {
			var self = this;
			
			return (self.isNull(object) ? "" : object.toString());
		},
		
		toTrimmedString: function(object) {
			var self = this;
			
			return $.trim(self.toString(object));
		},
		
		getCurrentDateFormatted: function() {
			var d = new Date();
			return String(d.getFullYear()) + String(d.getMonth()) + String(d.getDate()) + String(d.getHours()) + String(d.getMinutes()) + String(d.getSeconds());
		},
		
		alertMessage: function(message, severity, icon, title) {
			$.gritter.add({
				title: "<i class=\"icon-" + icon + "bigger-120\"></i>&nbsp;" + title,
				text: message,
				class_name: "gritter-" + severity
			});
		},
		
		showAjuste: function () {
			var self = this;
			
			return Util.hasWorkContext("AMB_OV_PLANEAMIENTO") || Util.hasWorkContext("AMB_OV_DVC");
		},
		
		copyAttributes: function(srcAttributes, dstAttributes) {
			var self = this;
			for(var key in srcAttributes){
				var value = srcAttributes[key];
				
				if( value != null && Array.isArray(value) ) {
					for(var i = 0 ; i < value.length ; i ++) {
						if( value[i] && value[i] != null ) {
							while( dstAttributes[key].length <= i ) {
								dstAttributes[key].push(new Object());
							}
							self.copyAttributes(value[i], dstAttributes[key][i]);
						}
					}
				}
				else if( value != null && typeof(value) == "object"  ) {
					if( dstAttributes[key] == null ) {
						dstAttributes[key] = new Object();
					}
					self.copyAttributes(value, dstAttributes[key]);
				}
				else {
					dstAttributes[key] = value;
				}
			}
		},
		
		blockScreen: function() {
			Util.blockBody();
			$("#toolbarLogin").append("<img src='../static/images/pleasewait.gif'/>");
		},
		
		unblockScreen: function() {
			$("#toolbarLogin").empty();
			Util.unBlockBody();
		},
		
		getOOSS: function(id) {
			switch(parseInt(id)){
				case 400909:
				  return 'ASE';
				  break;
				case 116105:
				  return 'OSCEP';
				  break;
				case 402806:
				  return 'OSDAAP';
				  break;
				case 401704:
				  return 'OSDEPYM';
				  break;
				case 301202:
				  return 'OSDO';
				  break;
				case 402400:
				  return 'OSEDEIV';
				  break;
				case 401209:
				  return 'OSIM';
				  break;
				case 100601:
				  return 'OSPADEP';
				  break;
				case 406:
				  return 'OSPOCE';
				  break;
				case 400206:
				  return 'OSPREME';
				  break;
				case 119906:
				  return 'OSSDEB';
				  break;
				case 119807:
				  return 'OSSEG';
				  break;
				case 100304:
				  return 'OSTVLA';
				  break;
				default:
				  return 'N/A';
			};
		},
		
		getZona: function(id) {
			switch(parseInt(id)){
				case 0:
				  return 'AMBA';
				  break;
				case 1:
				  return 'Buenos Aires, C&oacute;rdoba y Santa Fe';
				  break;
				case 2:
				  return 'Patagonia y Salta';
				  break;
				case 3:
				  return 'Resto del Pa&iacute;s';
				  break;
				default:
				  return 'N/A';
			};
		},
		
		getHeaderParentesco: function(parentesco) {
			switch(parentesco){
				case 'Titular':
				  return 'T';
				  break;
				case 'Conyuge':
				  return 'C';
				  break;
				case 'Hijo':
				  return 'H';
				  break;
				case 'Fliar a cargo':
				  return 'FC';
				  break;
				default:
				  return 'N/A';
			};
		},
		
		fillArray: function(array, index) {
			for (var i = array.length; i < index; i++) {
				array.push(null);
			}
		},
		
		findSupervisor: function ( userName, onSuccess ) {
			var self = this;
			
			LoginService.userInformation( userName, false, 
				function( user ){ 
					LoginService.userInformation( user.jefe =="" ?user.uid : user.jefe, false,
						function( supervisor ){
							onSuccess(supervisor);
						},
						function( xhr, err ){
							Util.error( 'Sample of error data:', err );
							Util.error("readyState: " + xhr.readyState+"\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
							self.alertMessage("Hubo un error en el servicio de login para recuperar supervisor.", "warning", "exclamation-sign", "Atenci\u00F3n");
						}, 
						function(){ 
							//oncomplete
						}
					);
				},
				function(){ 
					Util.error( 'Sample of error data:', err );
					Util.error("readyState: " + xhr.readyState+"\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					self.alertMessage("Hubo un error en el servicio de login para recuperar supervisor.", "warning", "exclamation-sign", "Atenci\u00F3n");
				}, 
				function(){ 
					//oncomplete
				}
			);
		},
		
		processDetailCotizacion: function(context) {
       		var self = this;
       		var result = [];
       		
       		$.each(context.resultCotizacion, function(index, cotizacion) {
       			context.cuit = cotizacion.familias[0].cuit;
       			
       			$.each(cotizacion.familias, function(index, detail) {
	       			detail.zona = self.getZona(detail.zona);
	       			detail.ooss = self.getOOSS(detail.ooss);
	       			detail.plan = cotizacion.plan;
	       			
	       			var valorPlan = detail.valorPlan - detail.valorAporte;
					var valorAMostrar = valorPlan < 0 ? 0 : valorPlan;
					ajuste = self.isNull(context.ajuste) ? 0 : context.ajuste;
					
					detail.estimados = ((detail.valorAporte * ajuste / 100) + detail.valorAporte).toFixed(2);
					detail.valorPlan = ((detail.valorPlan * ajuste / 100) + detail.valorPlan).toFixed(2);
					detail.total = ((valorAMostrar * ajuste / 100) + valorAMostrar).toFixed(2);
	       			
					var titular = null;
					var conyuge = null;
					var hijos = [];
					var aCargo = [];
	       			$.each(detail.integrantes, function(i, inte) {
	       				inte.headerParen = self.getHeaderParentesco(inte.parentesco);
	       				if (self.isEqualToString(inte.headerParen, 'T')) {
	       					titular = inte.edad;
	       				}
	       				else if (self.isEqualToString(inte.headerParen, 'C')) {
	       					conyuge = inte.edad;
	       				}
	       				else if (self.isEqualToString(inte.headerParen, 'H')) {
	       					hijos.push(inte.edad);
	       				}
	       				else if (self.isEqualToString(inte.headerParen, 'FC')) {
	       					aCargo.push(inte.edad);
	       				}
	       			});
	       			self.fillArray(hijos, 10);
	       			self.fillArray(aCargo, 5);
	   				detail.titular = titular;
	   				detail.conyuge = conyuge;
	   				detail.hijos = hijos;
	   				detail.aCargo = aCargo;
	   				
	   				result.push(detail);
       			});
       		});
       		context.resultCotizacion = result;
       	},
		
	}); // Finaliza el extend

	return new OvUtil();	
});
//# sourceURL=/form-cotizaciones-pymes/js/libs/framework/views/helpers/ovUtil.js