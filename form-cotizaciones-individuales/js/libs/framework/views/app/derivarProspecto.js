define ([
         'jquery',
         'underscore',
         'backbone',
         'handlebars',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/derivarProspecto.html'
], function ($, _, Backbone, Handlebars, derivarProspectoForm){

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
                        if(controls.find(':checkbox,:radio').length > 1){
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
      
	var rulesDerivarProspecto= {
            supervisor: {
            	required: true
            }
      };

     var messagesDerivarProspecto= {
    		  supervisor: {
            	required: "Seleccione un supervisor"
            }
      };

     
	
	function pad (str, max) {
	  return str.length < max ? pad("0" + str, max) : str;
	}
		     	
    var derivarProspectoView = Backbone.View.extend ({
    	
    	events: {
			'click		#btnSaveAndEndTask' 			: 'doSave'
		},
		
		doSave: function(e, info){
			event.preventDefault();
			
			if ( $("#actions option:selected").val() ) {
				window.location = "#" + $("#actions option:selected").val();
			} else { return false;}
			
		},
		
        
        render: function (){
        	var compiledTemplate = Handlebars.compile(derivarProspectoForm);
        	        	
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
    return derivarProspectoView;
});