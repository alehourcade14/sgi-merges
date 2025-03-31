/*
 * 
 *  Name        : listSearchView.js

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
		'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/listResultTemplate.html',
], function ($, _, Backbone, Handlebars, datatables, Util, datatablesBT, AlertErrorView, ListResultTemplate) {
	
			
	// Create the list view.
	var listSearchView = Backbone.View.extend ({
		
		events : {
			'click .select-search-item' : 'selectItem'
		},

        selectItem: function () {
            var user = $(event.target).closest('tr').data('login');
            var uid = $(event.target).closest('tr').data('uid');
            var legajo = $(event.target).closest('tr').data('legajo');
            var nya = Util.getUserNameComplete(uid);

            Util.debug(legajo + " - " + nya);

			$("#loginUsuario").val(user);
			$("#uidUsuario").val(uid);

			$("#legajoUsuario").val(legajo);
            $("#nombreCompletoUsuario").val(nya);
            $("#usuario").val(legajo + " - " + nya);
            $("#modalSearch").modal("hide")
        },
		
		// Re-render the prestadore list objects.
		render: function (request, supervisor) {
			
			var compiledTemplate = Handlebars.compile(ListResultTemplate);
			this.$el.html (compiledTemplate({data: request, supervisores: supervisor}));
	        
			// Return the html object compiled.
			return this;
		},
		
		
		list : function (param, target, error, method, supervisor, nombre, apellido) {
	        
			var self = this;
			
			target.empty ();
			error.empty ();
			Util.blockBody();
			
			$("#btnSearch2").attr ("disabled", "disabled");
			
			$("body").css({"opacity":"0.4"});
			$("body").css({"filter":"opacity=40"});
			$("body").css({"z-index":"1000"});
			target.css("background-image","url('images/loading_bubble.gif')");
			target.css("background-repeat","no-repeat");
			target.css("background-attachment","relative");
			target.css("background-position","center");
			target.css("min-height","400px");
			
			method(param, true, 
				function (data) {		
					Util.unBlockBody();
					Util.debug("data",data);
					var datos = new Array;
					for(var i=0; i < data.length; i++){
						data[i].nya = Util.getUserNameComplete(data[i].uid);
						//data[i].jefe = Util.getUserNameComplete(data[i].jefe);
						datos.push(data[i]);
					}	
					target.append (self.render (datos, supervisor).el);
				},
				
				function (xhr, err) {
					Util.unBlockBody();
					var alertErrorView = new AlertErrorView ();
					error.append (alertErrorView.render ("No se encontraron resultados para la busqueda").el);
				},
				
				function (data) {
					$("body").removeAttr('style');
	    			target.removeAttr('style');
					$("#btnSearch2").removeAttr ("disabled"); 
				});
		}
	});
	
	return listSearchView;
});