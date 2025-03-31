define([
	'jquery',
	'backbone',
	'handlebars',
	'util',
	'/form-smg-commons/js/libs/services/finalizadorTramitesService.js',
	'session'
], function ($, Backbone, Handlebars, Util, finalizadorTramitesService, Session) {

	var FinalizeProcesoVentaSaludUtil = Backbone.Model.extend({

		finalizeProcessVentaSaludIndi: function (task) {
			var user = Session.getLocal("userId");
			var sucursal = Session.getLocal("subsidiary");
			var processId = task.processId;
			var success = function (data) {
			};
			var error = function (err) {
			};
			var complete = function () {
				$("#" + task.processId).empty();
			};

			finalizadorTramitesService.finalizeVentaSaludIndividuo(user, sucursal, processId, success, error, complete);
		},

		finalizeProcessVentaEccoRetail: function (task) {
			var user = Session.getLocal("userId");
			var sucursal = Session.getLocal("subsidiary");
			var processId = task.processId;
			var success = function (data) {
			};
			var error = function (err) {
			};
			var complete = function () {
				$("#" + task.processId).empty();
			};

			finalizadorTramitesService.finalizeVentaEccoRetail(user, sucursal, processId, success, error, complete);
		},

		finalizeProcessVentaOnlineEcco: function (task) {
			var user = Session.getLocal("userId");
			var sucursal = Session.getLocal("subsidiary");
			var processId = task.processId;
			var success = function (data) {
			};
			var error = function (err) {
			};
			var complete = function () {
				$("#" + task.processId).empty();
			};

			finalizadorTramitesService.finalizeVentaOnlineEcco(user, sucursal, processId, success, error, complete);
		}
	});

	return new FinalizeProcesoVentaSaludUtil();
});