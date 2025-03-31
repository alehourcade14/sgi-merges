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
	     'text!libs/framework/templates/app/alertErrorTemplate.html'
], function ($, _, Backbone, AlertErrorTemplate) {
	
	// Create the list view.
	var alertErrorView = Backbone.View.extend ({
		
		// Re-render the prestadore list objects.
		render: function (request) {
			
			// Compile the html and return the same object.
			var compiledTemplate = _.template (AlertErrorTemplate);
			this.$el.html (compiledTemplate ({data: request}));
	        
			// Return the html object compiled.
			return this;
		}
	});
	
	// Return the alert error message view.
	return alertErrorView;
});