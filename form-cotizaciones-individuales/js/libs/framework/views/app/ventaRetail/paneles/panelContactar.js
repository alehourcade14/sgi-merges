define([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	'bootstrap',
	'text!libs/framework/templates/app/ventaRetail/paneles/panelContactar.html',  
	'/form-smg-commons/js/libs/asyncProcessor.js',
	'/form-smg-commons/js/libs/objectSerializer.js',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js'
], function ($, _, Backbone, Handlebars, bootstrap,	contactarWizardTemplate, AsyncProcessor, ObjectSerializer, AjaxScreenLockUtil) {

		var panelContactar = Backbone.View.extend({

			readOnly: false,
			wizzardActual: "",
			paso: 0,
			
			events: {
				'stepclick .ace-wizard' 		: 	'clickPaso',
				'changed.fu.wizard .ace-wizard' : 	'cambioStep'
			},

			cambioStep: function(){
				var self = this;
				if (self.paso !=0 && self.paso!=2){
					self.paso = 0;
					self.context.prev();
				}
				if (self.paso==2){
					self.paso = 0;
					self.context.identificarAcciones(true, '#step2-contactar');
				}
			},

			clickPaso: function(e, p){
				this.paso = p.step;
			},

			next: function(){
				var self = this;
				
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
				var compiledTemplate = Handlebars.compile(contactarWizardTemplate);
	
				self.$el.html(compiledTemplate({  context: attributes, omitirCompletarProspecto: self.context.omitirCompletarProspecto }));
				$("#contactarContainer").html(self.el);
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
			
		});

		return panelContactar;
	});
//# sourceURL=/form-venta-ecco-ap/js/libs/framework/views/app/panels/entityDetailView.js