/*
 * 
 *  Name        : app.js
 *  Description : JS App Wrapper.
 *  Author      : Jose Maria Serio (jose.serio@swismedical.com.ar)
 * */



define ([
         'jquery', 
         'underscore', 
         'backbone',
         'libs/framework/routers/router',
], function ($, _, Backbone, Router) {
  
	// Declarate to the  initializer function.
    var initialize = function (){

    	// Pass in our Router module and call it's initialize function
    	Router.initialize ();
    };
    
    
        
    // Return the object app.
    return { 
        
    	initialize: initialize
    };
});