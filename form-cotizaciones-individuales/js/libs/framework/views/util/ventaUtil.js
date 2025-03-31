define ([
         'jquery',
	     'underscore',
	     'backbone',
	     'util',
], function ($, _, Backbone, Util) {

	var VentaSaludUtil = Backbone.Model.extend ({
		
		isNull: function(object) {
			return (object === undefined || object == null);
		},

		isEmptyString: function(string) {
			var self = this;

			return (self.isNull(string) || $.trim(string).length === 0);
		},

		isEqual: function(o1, o2) {
			var self = this;
			var o1Value = o1;
			var o2Value = o2;
			if(!self.isNull(o1Value) && !self.isNull(o2Value)) {
				o1Value = $.trim(o1Value);
				o2Value = $.trim(o2Value);
			}
			return (o1Value === o2Value);
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
		
		arrayLookup: function (array, prop, val) {
		    for (var i = 0, len = array.length; i < len; i++) {
		        if (array[i].hasOwnProperty(prop) && array[i][prop] === val) {
		            return array[i];
		        }
		    }
		    return null;
		},
		
		arraySort: function( array, prop ) {
			array.sort(function SortByName(a, b){
				  var aName = a[prop].toLowerCase();
				  var bName = b[prop].toLowerCase(); 
				  return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
			});
		},
		
		copyAttributes: function(srcAttributes, dstAttributes) {
			var self = this;
			for(var key in srcAttributes){
				var value = srcAttributes[key];
				
				if( value != null && Array.isArray(value) ) {
					for(var i = 0 ; i < value.length ; i ++) {
						if( value[i] && value[i] != null ) {
							while( dstAttributes[key].length <= i ) {
								dstAttributes[key].push({});
							}
							self.copyAttributes(value[i], dstAttributes[key][i]);
						}
					}
				}
				else if( value != null && typeof(value) === "object"  ) {
					if( dstAttributes[key] == null ) {
						dstAttributes[key] = {}	;
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
		
		alertMessage: function(message, severity, icon, title) {
			$.gritter.add({
				title: "<i class=\"icon-" + icon + "bigger-120\"></i>&nbsp;" + title,
				text: message,
				class_name: "gritter-" + severity
			});
		},

		getMedioPorId: function (medio) {
			var descripcion = '';
			var id = medio;
        	if(id === 16){
				descripcion 	= 'Broker';
			}else if(id === 18){
				descripcion 	= 'Ejecutivo';
			}else if(id === 17){
				descripcion 	= 'PAS';
			}else if(id === 14){
				descripcion 	= 'Asesor';
			}else{
				descripcion 	= 'Personal';
			}
			return descripcion;
		},
		
		showLoadingBubble: function (target, successFunction) {
            target.empty();
            
            target.css("height", "26px");
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

		getTareaPorEtapa: function(processesDetail, successFunction){
			var inicioFix = false;
			var contactarFix = false;
			var entrevistarFix = false;
			var entrevistarFix = false;
			var comercializarFix = false;
			var generarAltaFix = false;

			var process = processesDetail.reverse();
			if(process[0].tarea && process[0].tarea.id != 0){
				for(var i=0;i<process.length;i++){
					if(process[i].tarea.id == 1 && !inicioFix){
						process[i].tarea.id = 0;
						process[i].tarea.descripcion = 'Inicio';
						inicioFix = true;
					}
					if(process[i].tarea.id == 2 && !contactarFix){
						process[i].tarea.id = 1;
						process[i].tarea.descripcion = 'Contactar';
						contactarFix = true;
					}
					if(process[i].tarea.id == 3 && !entrevistarFix){
						process[i].tarea.id = 2;
						process[i].tarea.descripcion = 'Entrevistar';
						entrevistarFix = true;
					}

					if(process[i].tarea.id == 6 && !comercializarFix){
						process[i].tarea.id = 1;
						process[i].tarea.descripcion = 'Contactar';
						comercializarFix = true;
					}

					if(process[i].tarea.id == 7 && !generarAltaFix){
						process[i].tarea.id = 6;
						process[i].tarea.descripcion = 'Comercializar';
						generarAltaFix = true;
					}
				}
			}
			var process = processesDetail.reverse();
			successFunction();
		}
	}); // Finaliza el extend 

	return new VentaSaludUtil();	
});
//# sourceURL=/form-venta-ecco-ap/js/libs/framework/views/util/VentaSaludUtil.js