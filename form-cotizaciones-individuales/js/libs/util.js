define ([
	     'underscore',
	     'backbone',
		 'util'
], function ( _, Backbone, Util ) {

	var Util = Backbone.Model.extend ({		
		
		/**
		 * Convierte un json generico a String y además reemplaza los id por
		 * -id para que el servicio pueda interpretar correctamente los id.
 		 * @param {Object} obj
		 */
		jsonToString: function(obj){
			// TODO: Eliminar Util.debug
			Util.debug("obj");
			Util.debug(obj);
			// Se pasa el objeto a string
			var strData = JSON.stringify(obj);
			// TODO: Eliminar Util.debug
			Util.debug("strData");
			Util.debug(strData);

			// Por un tema de validacion se debe pasar -id y equivale a id
			while (strData.search('{"id":') !== -1) {
				strData = strData.replace('{"id":', '{"-id":');
			}
			
			return strData;
		},
		
		pad: function(str, max){
	  	return str.length < max ? this.pad("0" + str, max) : str;
		},	
		
		/**
		 * Devuelve la fecha en formato 2014-07-25T16:13:10 
		 */
    getDate: function(){
	   	var d = new Date();
	   	var str;
	    	var curr_date = d.getDate();
			if(curr_date < 10){
				curr_date = '0'+curr_date;	
			}
	    	var curr_month = d.getMonth() + 1; // El mes esta basado en cero
			if(curr_month < 10){
				curr_month = '0'+curr_month;	
			}
	    	var curr_year = d.getFullYear();
			var hour = d.getHours();
			if(hour < 10){
				hour = '0'+hour;	
			}
			var minutes = d.getMinutes();
			if(minutes < 10){
				minutes = '0'+minutes;	
			}
			var seconds = d.getSeconds();
			if(seconds < 10){
				seconds = '0'+seconds;	
			}
			
			var milliseconds = d.getMilliseconds();
			if(milliseconds < 10){
				milliseconds = '000'+milliseconds;
			}else if(milliseconds < 100){
				milliseconds = '00'+milliseconds;
			}else if(milliseconds < 1000){
				milliseconds = '0'+milliseconds;
			}			
	 
			
		  str = curr_year+'-'+curr_month+'-'+curr_date+'T'+hour+':'+minutes+':'+seconds;
			
			return str;
    },
    
    /**
     * Devuelve la fecha en formato 2014-07-25T16:13:10 
     */
    messageId: function(){
	   	var d = new Date();
	   	var str;
	    var curr_date = d.getDate();
			if(curr_date < 10){
				curr_date = '0'+curr_date;	
			}
			
	    var curr_month = d.getMonth() + 1; //Months are zero based
			if(curr_month < 10){
				curr_month = '0'+curr_month;	
			}
			
	    var curr_year = d.getFullYear();
			var hour = d.getHours();
			if(hour < 10){
				hour = '0'+hour;	
			}
			
			var minutes = d.getMinutes();
			if(minutes < 10){
				minutes = '0'+minutes;	
			}
			
			var seconds = d.getSeconds();
			if(seconds < 10){
				seconds = '0'+seconds;	
			}
			
			var milliseconds = d.getMilliseconds();
			if(milliseconds < 10){
				milliseconds = '000'+milliseconds;
			}else if(milliseconds < 100){
				milliseconds = '00'+milliseconds;
			}else if(milliseconds < 1000){
				milliseconds = '0'+milliseconds;
			}
	 
			
		  str = curr_year+''+curr_month+''+curr_date+''+hour+''+minutes+''+seconds+'.'+milliseconds;
			
			
			return str;
    },
    
		/**
		 * Recibe una fecha y le resta 180 días. 
 		 * @param {Object} date
		 */
		cientoOchentaDiasAntes: function(date){
			var millisactual = date.getTime();
			// restamos 180 días en milisegundos
			var diasarestar =  180 * 24 * 60 * 60 * 1000;
			
			var nuevafecha = new Date();
			nuevafecha.setTime(millisactual - diasarestar);
			
			return nuevafecha;
		},
		
 		getWarning : function(nombreGrupo,id) {
	  	var warning = 
				"<div id='warning-"+id+"' class='alert alert-warning'>"+
				"<button type='button' class='close' data-dismiss='alert'>"+
				"<i class='icon-remove'></i></button>"+
				"No se seleccionaron integrantes para el <strong>"+nombreGrupo+"</strong><br/></div>";
			return warning;
		}, // fin: getWarning
		
		getAMD: function(fecha){
			var fullYear = fecha.getFullYear();
			var month = fecha.getMonth()+1;
			var date = fecha.getDate();
			var fechaStr = fullYear.toString()+"-"+month.toString()+"-"+date.toString();
			return fechaStr;
		},
		
		createHiddenInputs: function(formId, containerId, object, prefix) {
			var self = this;
			var hiddenInputs = [];
			var hiddenInputsString = "";
			
			$(containerId).empty();
			
			self.fillHiddenInputs(formId, hiddenInputs, object, prefix);
			
			for(var i = 0 ; i < hiddenInputs.length ; i ++) {
				hiddenInputsString += hiddenInputs[i];
			}
			
			$(containerId).html(hiddenInputsString);
		},
		
		fillHiddenInputs: function(formId, hiddenInputs, object, prefix) {
			var self = this;
			for(var key in object){
				var value = object[key];
				if( value != null ) {
					var inputName = (prefix + "[" + key + "]");
					
					if( Array.isArray(value) ) {
						for(var i = 0 ; i < value.length ; i ++) {
							var itemKeyPrefix = (inputName + "[" + i + "]");
							
							self.fillHiddenInputs(formId, hiddenInputs, value[i], itemKeyPrefix);
						}						
					}
					else if (typeof(value) === "object") {
						self.fillHiddenInputs(formId, hiddenInputs, value, inputName);
					}
					else {
						var exists = ($(formId + " [name='" + inputName + "']").length > 0);
						if(!exists) {
							hiddenInputs.push("<input type=\"hidden\" name=\"" + inputName + "\" value=\"" + value + "\" />");
						}
					}
				}
			}
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
						dstAttributes[key] = {};
					}
					self.copyAttributes(value, dstAttributes[key]);
				}
				else {
					dstAttributes[key] = value;
				}
			}
		},
	}); // Finaliza el extend

	return new Util();	
});