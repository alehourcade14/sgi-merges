/*
 * 
 *  Name        : usuariosSearchView.js

 * */



define ([
	     'jquery',
	     'underscore',
	     'backbone',
		 'handlebars',
		 'datatables',
		 'util',
		 'datatablesBT',
	     'libs/framework/views/commons/alertErrorView',
	     'text!libs/framework/templates/app/usuariosResultTemplate.html'
], function ($, _, Backbone, Handlebars, datatables, Util, datatablesBT, AlertErrorView, ListResultTemplate) {
	
	var selectUserHandler;
			
	// Create the list view.
	var usuariosSearchView = Backbone.View.extend ({
		
		
		events : {
			'click .select-search-item' : 'selectItem'
		},
		
		selectItem: function() {
             if (selectUserHandler) {
            	 selectUserHandler(event);
             }
		},
		
		// Re-render the supervisores list objects.
		render: function (request) {
			
			var compiledTemplate = Handlebars.compile(ListResultTemplate);
			this.$el.html (compiledTemplate({data: request}));
	        
			// Return the html object compiled.
			return this;
		},

		list : function (target, btnSearch, url, selecItemHandler) {
        
			var self = this;
			
			selectUserHandler = selecItemHandler;
			
			target.empty ();
			Util.blockBody();
			
			btnSearch.attr ("disabled", "disabled");
			
			$("body").css({"opacity":"0.4"});
			$("body").css({"filter":"opacity=40"});
			$("body").css({"z-index":"1000"});
			target.css("background-image","url('images/loading_bubble.gif')");
			target.css("background-repeat","no-repeat");
			target.css("background-attachment","relative");
			target.css("background-position","center");
			target.css("min-height","400px");
			
			Util.debug("Invocando al servicio de usuarios: " + url);
			$.ajax({
				url: url,
				headers: {
					"Content-Type":"application/json; charset=UTF-8",
					"Accept": "application/json"
				},
				beforeSend: function (request){
					request.setRequestHeader("authorization", "Bearer "+Session.getLocal('jwtToken'));
				},
				accept: "application/json",
				cacheControl: "no-cache",
				type:'GET',
				async: true,
				success:function (data) {		
					Util.unBlockBody();
					var datos = new Array;
					for(var i=0; i < data.length; i++){
						data[i].jefe = Util.getUserNameComplete(data[i].jefe);
						//Util.info("data[i]",data[i]);
						datos.push(data[i]);
					}	
					target.append (self.render (datos).el);
				},
    		
				error: function (data) {
					Util.unBlockBody();
					var alertErrorView = new AlertErrorView ();
					target.append (alertErrorView.render ("No se encontraron resultados para la b&#250;squeda").el);
				},
				
				complete: function (data) {
					$("body").removeAttr('style');
	    			target.removeAttr('style');
	    			btnSearch.removeAttr ("disabled"); 
				},
				
			});
		}
	});
	
	return usuariosSearchView;
});