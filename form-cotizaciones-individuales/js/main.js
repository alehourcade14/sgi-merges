/*
 * 
 *  Name        : main.js
 *  Description : Main script, this file contain the bootstrap app.
 *  Author      : Jose Maria Serio (jose.serio@swismedical.com.ar)
 * */

if (!window.getSGIVersion && parent && parent.getSGIVersion) {
	window.getSGIVersion = parent.getSGIVersion;
}

/*
 *  Configure dependencies for scripts that do not call define() to register a module
 */
require.config ({
     
	shim : {
		    underscore: {
		    	exports: '_'
		    },
		    backbone: {
		    	deps: [
		    	       'underscore',
		    	       'jquery'
		    	],
			    exports: 'Backbone'
		    },
			backboneRouterFilters: { 
				deps: ["backbone"] 
			},
			handlebars: {
				exports: 'Handlebars'
			},
			bootstrap: { 
				deps: ["jquery"] 
			},
			handlebarsHelpers: { 
				deps: ["jquery"] 
			},
			encoding: { 
				deps: ["jquery"] 
			},
			serialize: { 
				deps: ["jquery"] 
			},
			util: { 
				deps: ["jquery"] 
			},
			ace: { 
				deps: ["jquery"] 
			},
			datatables: { 
				deps: ["jquery"] 
			},
			highcharts: { 
				deps: ["jquery"] 
			},
			highchartsGrid: { 
				deps: ["highcharts"] 
			},
			highchartsMore: { 
				deps: ["highcharts"] 
			},
			exporting: { 
				deps: ["highcharts"] 
			},
			jeditable: { 
				deps: ["jquery"] 
			},
			jspdfautotable: { 
				deps: ["jquery","jspdf"] 
			},
			jspdfjspdfcell: { 
				deps: ["jquery","jspdf"] 
			},
			jspdfaddimage: { 
				deps: ["jquery","jspdf"] 
			},
			metrics: { 
				deps: ["jquery","jspdf"] 
			},
			jspdfsillysvgrenderer: { 
				deps: ["jquery","jspdf"] 
			},
			jspdfsplit: { 
				deps: ["jquery","jspdf"] 
			},
			jspdfhtml: { 
				deps: ["jquery","jspdf"] 
			},
			jspdfbasic: { 
				deps: ["jquery","jspdf"] 
			},
			datatablesBT: { 
				deps: ["jquery","datatables"] 
			},
			TableTools: { 
				deps: ["jquery","datatables","jeditable"] 
			},
			bootstrapTabs: { 
				deps: ["jquery","backbone"] 
			},
		    jqueryvalidate : {
		        deps: ["jquery"],
		        exports: "jquery.validation"
		    }
	},	
	paths: {
			bootstrap	   			: '../../static/js/libs/thirds/jquery/bootstrap.min',
			ace	   					: '../../static/js/libs/thirds/jquery/ace-elements.min',
			handlebars	   			: '../../static/js/libs/thirds/handlebars/handlebars-1.0.0-rc.4',
		    jquery         			: '../../static/js/libs/thirds/jquery/jquery-2.0.3.min',
		    underscore     			: '../../static/js/libs/thirds/underscore/lodash.min',
		    backbone       			: '../../static/js/libs/thirds/backbone/backbone',	
			backboneRouterFilters 	: '../../static/js/libs/thirds/backbone/routerFilters',
			bootstrapTabs  			: '../../static/js/libs/thirds/jquery/bootstrap-tabdrop',
			async		   			: '../../static/js/libs/thirds/require/async',	
		    text           			: '../../static/js/libs/thirds/require/text',
		    jqueryvalidate 			: '../../form-cotizaciones-individuales/js/libs/thirds/jquery/jquery.validate.min',
			datatables	   			: '../../static/js/libs/thirds/jquery/jquery.dataTables.min',
			datatablesBT   			: '../../static/js/libs/thirds/jquery/jquery.dataTables.bootstrap',
			jeditable   			: '../../static/js/libs/thirds/jquery/jquery.jeditable',
			TableTools   			: '../../static/js/libs/thirds/jquery/TableTools',
			highcharts   			: '../../static/js/libs/thirds/highcharts/js/highcharts',
			highcharts3d   			: '../../static/js/libs/thirds/highcharts/js/highcharts-3d',
			highchartsGrid   		: '../../static/js/libs/thirds/highcharts/js/themes/grid',
			highchartsMore   		: '../../static/js/libs/thirds/highcharts/js/highcharts-more',
			exporting 				: '../../static/js/libs/thirds/highcharts/js/modules/exporting',
			serialize				: '../../static/js/libs/thirds/jquery/jquery.serialize-object.min',
			jspdf					: '../../static/js/libs/thirds/jquery/jspdf',
			jspdfaddimage			: '../../static/js/libs/thirds/jquery/jspdf.plugin.addimage',
			jspdfjspdfcell			: '../../static/js/libs/thirds/jquery/jspdf.plugin.cell',
			jspdfautotable			: '../../static/js/libs/thirds/jquery/jspdf.plugin.autotable',
			metrics					: '../../static/js/libs/thirds/jquery/jspdf.plugin.standard_fonts_metrics',
			jspdfsillysvgrenderer	: '../../static/js/libs/thirds/jquery/jspdf.plugin.sillysvgrenderer',
			jspdfsplit				: '../../static/js/libs/thirds/jquery/jspdf.plugin.split_text_to_size',
			jspdfhtml				: '../../static/js/libs/thirds/jquery/jspdf.plugin.from_html',
			jspdfbasic				: '../../static/js/libs/thirds/jquery/jspdf/basic',
			inboxService			: '../../static/js/libs/services/inboxService',			
			messagesService			: '../../form-smg-commons/js/libs/services/messagesService',			
			session	 				: '../../form-smg-commons/js/libs/framework/model/sessionModel',
			util	 				: '../../form-smg-commons/js/libs/util',
			encoding 				: '../../form-smg-commons/js/libs/encoding',
			handlebarsHelpers 		: '../../form-smg-commons/js/libs/handlebars-helpers'
	},
    waitSeconds: 10,
    urlArgs: 'v=' + window.getSGIVersion()
	
});



/*
 *  Configure dependencies for scripts that do not call define() to register a module
 */
require (['app'], function (App) {
    	
	// The "app" dependency is passed in as "App"
    // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
	App.initialize ();	
});