define([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	'bootstrap',
	'ace',
	'encoding',
	'libs/settings',
	'util',
	'inboxService',
	'session',
	'text!libs/framework/templates/app/cotizacion/formShowTemplate.html',
	'text!libs/framework/templates/app/cotizacion/membersShowTemplate.html',
	'text!libs/framework/templates/app/cotizacion/plansShowTemplate.html',
	'/form-smg-commons/js/libs/asyncProcessor.js',
	'/form-smg-commons/js/libs/util/ajaxScreenLockUtil.js',
	'/form-smg-commons/js/libs/services/fuseService.js'

], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, InboxService,
	Session, formShowTemplate, membersShowTemplate, plansShowTemplate, AsyncProcessor,
	AjaxScreenLockUtil, FuseService) {

	var newView = Backbone.View.extend({
		
		events: {
			'click 		#btnCloseTask'	: 	'closeTask'
		},

		closeTask: function () {
			window.top.location.href = SettingsModel.get("open_task");
		},

		loadInitialData: function (onSuccess) {
			if (this.taskId != 0) {
				this.task = InboxService.getTaskById(this.taskId);
			} else {
				this.process = InboxService.getProcess(this.processId);
			}
			onSuccess();
		},

		getProcessDetail: function (onSuccess) {
			var self = this;
			var success = function (data) {
				Util.debug('processDetail', data);
				self.processDetail = data;
			}

			FuseService.getDetallePorProcessId(this.processId, true, success, self.logError, onSuccess);
		},

		getRelatedProcessDetail: function (onSuccess) {
			var self = this;
			var success = function (data) {
				Util.debug('processDetail', data);
				self.relatedProcessesDetail = [];
				$.each(data, function (key, task) {
					if (task.cotizacion && task.cotizacion.id == self.processDetail.cotizacionId) {
						self.relatedProcessesDetail.push(task);
					}
				});
				self.relatedProcessDetail = self.relatedProcessesDetail[0];
			}

			FuseService.getDetallePorProcessId(this.processDetail.processId, true, success, self.logError, onSuccess);
		},

		list: function (taskId, processId) {
			this.userId = Session.getLocal("userId");
			this.taskId = parseInt(taskId);
			this.processId = processId;

			this.initView();
		},

		initView: function () {
			var self = this;

			var asyncFunctions = [];

			asyncFunctions.push(function (successFunction, context) {
				AjaxScreenLockUtil.lock();
				successFunction();
			});

			asyncFunctions.push(function (successFunction, context) {
				self.loadInitialData(successFunction);
			});

			asyncFunctions.push(function (successFunction, context) {
				self.getProcessDetail(successFunction);
			});

			asyncFunctions.push(function (successFunction, context) {
				self.getRelatedProcessDetail(successFunction);
			});

			asyncFunctions.push(function (successFunction, context) {
				$("#content1").empty();
				$("#content1").append(self.render().el);
				successFunction()
			});

			asyncFunctions.push(function (onSuccess, context) {
				AjaxScreenLockUtil.unlock();
				onSuccess();
			});

			AsyncProcessor.process(asyncFunctions, {});
		},

		// Render method.
		render: function () {
			var self = this;

			var compiledTemplate = Handlebars.compile(formShowTemplate);
			var membersTemplate = Handlebars.compile(membersShowTemplate);
			var plansTemplate = Handlebars.compile(plansShowTemplate);

			this.$el.html(compiledTemplate({
				context: self
			}));
			this.$el.find('#membersContainer').html(membersTemplate({
				members: self.processDetail.integrantes
			}));
			this.$el.find('#plansContainer').html(plansTemplate({
				plans: self.processDetail.planes
			}));

			return this;
		},

		logError: function (xhr, err) {
			Util.error("Sample of error data:", err);
			Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
		}

	});

	return newView;
});