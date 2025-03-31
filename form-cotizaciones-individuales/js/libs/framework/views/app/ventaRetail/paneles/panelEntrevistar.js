define([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	'bootstrap',
	'text!libs/framework/templates/app/ventaRetail/paneles/panelEntrevistar.html',  
	'/form-smg-commons/js/libs/asyncProcessor.js',
	'/form-smg-commons/js/libs/objectSerializer.js',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js'
], function ($, _, Backbone, Handlebars, bootstrap,	entrevistarWizardTemplate, AsyncProcessor, ObjectSerializer, AjaxScreenLockUtil) {

		var panelEntrevistar = Backbone.View.extend({

			readOnly: false,
			
			events: {
				
			},
			
			fillObject: function (object) {
				var self = this;

			},

			render: function (context, onSuccess) {
				var self = this;
				self.context = context;
				
				self.renderAsyncElements();
				self.delegateEvents();
				if ( onSuccess ) {
					onSuccess();
				}
			},

			renderAsyncElements: function () {
				var self = this;
	
				AsyncProcessor.process([
					function(successFunction, context) {
						AjaxScreenLockUtil.lock();
						successFunction();
					},
					function (successFunction) {
						self.renderTemplate(successFunction);
					},
					function(successFunction, context) {
						
						AjaxScreenLockUtil.unlock();
						successFunction();
					}
				], self.context);
	
			},
			
			renderTemplate: function (onSuccess) {			
				var self = this;
				var attributes = {};
				var compiledTemplate = Handlebars.compile(entrevistarWizardTemplate);

				self.$el.html(compiledTemplate({  context: attributes }));
				$("#entrevistarContainer").html(self.el);

				onSuccess();
			},			
			
			getForm: function () {
				var self = this;
				return  $("#validation-form");
			},

			serializeObject: function () {
				var self = this;
				return ObjectSerializer.serializeObject(self.getForm());
			},

			// ==================================================================== //
			// ============================== EVENTS ============================== //
			// ==================================================================== //

			aplicarDescuento:function(){

				var self = this
				var primerProceso;
				
				for(var i=0;i<self.context.processesDetail.length;i++){
					if(self.context.processesDetail[i].idEtapa===1){
						primerProceso=self.context.processesDetail[i];
						break;
					}
				}
	
				var aplicarDescuento = false;
				if(primerProceso['poliza_smg_seg'] != null || primerProceso['poliza_smg_life'] != null){
					aplicarDescuento = true;
				}
				return aplicarDescuento;
			},
					
		});

		return panelEntrevistar;
	});
