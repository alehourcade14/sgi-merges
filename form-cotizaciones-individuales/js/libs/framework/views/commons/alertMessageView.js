/*
 * 
 *  Name        : alertErrorTemplate.js
 *  Description : require and backbone file for alert message error.
 *  Author      : Jose Maria Serio (jose.serio@swismedical.com.ar)
 * */



define ([
	     'jquery',
	     'underscore',
	     'backbone',
	     'text!libs/framework/templates/commons/alertMessageTemplate.html'
], function ($, _, Backbone, AlertMessageTemplate) {
	
	// Create the list view.
	var alertMessage = Backbone.View.extend ({
		
		// Re-render the prestadore list objects.
		render: function (message) {
			
			// Compile the html and return the same object.
			var compiledTemplate = _.template (AlertMessageTemplate);
			this.$el.html (compiledTemplate ({message: message}));
	        
			// Return the html object compiled.
			return this;
		}
	});
	
	// Return the alert error message view.
	return alertMessage;
});