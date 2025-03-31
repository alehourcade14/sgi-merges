define ([
         'jquery',
         'underscore',
         'backbone',
         'handlebars',
         'util',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/estadoVenta.html'
], function ($, _, Backbone, Handlebars, Util, estadoVentaForm){

	var validate  = {
            errorElement: 'span',
            errorClass: 'help-inline',
            focusInvalid: false,
            rules: null,
            messages: null,
            invalidHandler: function (event, validator) { //display error alert on form submit   
            },
            highlight: function (e) {
                  $(e).closest('.control-group').removeClass('info').addClass('error');
            },
            success: function (e) {
                  $(e).closest('.control-group').removeClass('error').addClass('info');
                  $(e).remove();
            },
            errorPlacement: function (error, element) {
                  if(element.is(':checkbox') || element.is(':radio')) {
                        var controls = element.closest('.controls');
                        if(controls.find(':checkbox,:radio').length > 1) {
                            controls.append(error);
                        }
                        else {
                            error.insertAfter(element.nextAll('.lbl:eq(0)').eq(0));
                        }
                  }
                  else if(element.is('.select2')) {
                        error.insertAfter(element.siblings('[class*="select2-container"]:eq(0)'));
                  }
                  else if(element.is('.chzn-select')) {
                        error.insertAfter(element.siblings('[class*="chzn-container"]:eq(0)'));
                  }
                  else {
                      error.insertAfter(element);
                  }
            },

            submitHandler: function (form) {
            },
            invalidHandler: function (form) {
            }
      };
      
    var rulesEstadoVenta= {
            motivo: {
            	required: true
            }
    };

    var messagesEstadoVenta= {
    		  motivo: {
            	required: "Seleccione un motivo"
            }
    }

     
	
	function pad (str, max) {
	  return str.length < max ? pad("0" + str, max) : str;
	};
		     	
	// Create the view object.
    var estadoVentaView = Backbone.View.extend ({
    	

		
    	// The DOM events specific to an item.
		events: {
			'click		#btnFinalizar' 			: 'doSave'
		},
		
		doSave: function(e, info){
			event.preventDefault();
			
			var form = $('#form-estado-venta');
            validate.rules = rulesSolicitudReserva;
            validate.messages = messagesSolicitudReserva;
            form.validate(validate);
			
			if(!form.valid()){
				
				var target = $("#toolbarLogin");
				$.gritter.add({
                     title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
                     text: 'Por favor ingrese los datos necesarios',
                     class_name: 'gritter-warning'
                });
                Util.unBlockBody();
                target.empty();
				return false;
			}
			
		},
        
		
		
        
        render: function (){
        	var compiledTemplate = Handlebars.compile(estadoVentaForm);
        	        	
        	// Print the html content.
            this.$el.html (compiledTemplate ());
            
            
            return this;
        }
      
    });
    
   $.ajaxSetup({
       headers: {
           'Content-type':'application/json; charset=UTF-8',
           'Accept':'application/json; charset=UTF-8'
       }
   });        
    
    // Return the view object.
    return estadoVentaView;
});