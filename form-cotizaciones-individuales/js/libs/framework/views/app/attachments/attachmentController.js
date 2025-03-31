define([
	'jquery',
	'underscore',
	'backbone',
	'util',
	'/form-smg-commons/js/libs/services/rudiService.js',
	'/form-visualizador-tiff/js/libs/framework/views/helpers/controladorArchivos/archivoController.js',
], function ($, _, Backbone, Util, RudiService, ArchivoController) {
	
	var attachmentController = Backbone.Model.extend({
		
		tipoTramiteRudi: 'VPI',
		
		idRudi: null,
		
		init: function (containerId, idRudi, nroTramite, readOnly, onFinish) {
			var self = this;
			self.containerId = containerId;
			self.idRudi = idRudi;
			self.nroTramite = nroTramite;
			self.readOnly = readOnly;

			if (self.readOnly) {
				self.initReadOnly();
			} else {
				self.initArchivoController();
			}

			if (onFinish) {
				onFinish();
			}
		},

		initReadOnly: function () {
			var self = this;
			
			$(self.containerId).click(function () {
				self.nroTramite = $(event.target).closest('a').data("nro-tramite");
				
				self.showModalArchivosCargados();
			});
		},

		initArchivoController: function () {
			var self = this;

			self.archivosCargados = [];
			self.archivosParaCargar = [];
			self.archivoController = new ArchivoController({
				id: self.idRudi
			});
			self.archivoController.setRudiTipoTrm(self.tipoTramiteRudi);
			self.archivoController.container = "modalRUDI";
			self.archivoController.limiteArchivos = 5;
			self.archivoController.puedeEliminar = false;
			self.archivoController.notaAlPie = "Extensiones permitidas .ppt, .doc, xls, xlsx ó .pdf y .msg. Caracteres no permitidos: ~ ` ! @ # $ % ^ & * ( ) + = < > ? ¿ : \ \" { } | , / ; ' [ ] —";
			self.archivoController.archivosValidos.push(
				'text/plain',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'application/vnd.ms-excel',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'application/msword',
				'');
			self.archivoController.setArchivosCallBack = function () {
				self.archivosParaCargar = self.archivoController.getArchivos();
				$("#cantidadArchivos" + self.idRudi).text("Cantidad de archivos adjuntos: " + (self.archivosParaCargar.length + self.archivosCargados.length));
				$("#" + self.idRudi + "Validator").val(self.archivosParaCargar.length);
				console.log(self.archivosParaCargar);
			};

			if (self.nroTramite != null && self.nroTramite != undefined) {
				self.archivoController.initModalViewAndEdit();

				RudiService.getFilesByNroTramite(self.tipoTramiteRudi, self.nroTramite, false,
					function (data) {
						var result = eval(data);
						if (result.imagenesArchivo != undefined && result.imagenesArchivo != null) {
							for (var i in result.imagenesArchivo.items) {
								self.archivosCargados.push(result.imagenesArchivo.items[i]);
								self.archivosParaCargar.push(result.imagenesArchivo.items[i]);
							}
							$("#cantidadArchivos" + self.idRudi).text("Cantidad de archivos adjuntos: " + self.archivosParaCargar.length);
						}
					},
					function (xhr, err) {
						Util.error('Error data: ', err);
						Util.error("readyState:" + xhr.readyState + "\nstatus:" + xhr.status + "\nresponseText: " + xhr.responseText);
					},
					function (data) {}
				);
			} else {
				self.archivoController.initModal();
			}

			$(self.containerId).click(function () {
				self.showModalCargarArchivos();
			});
		},

		showModalCargarArchivos: function () {
			var self = this;

			if (self.nroTramite != null && self.nroTramite != undefined) {
				self.archivoController.openModalViewAndEditByNroDeTramite(self.nroTramite);
			} else {
				self.archivoController.openModal();
			}
		},

		showModalArchivosCargados: function () {
			var self = this;
			
			require(["/form-visualizador-tiff/js/libs/framework/views/helpers/controladorArchivos/archivoController.js"], function (ArchivoController) {
				var archivoController = new ArchivoController({
					id: self.idRudi
				});
				archivoController.setRudiTipoTrm(self.tipoTramiteRudi);
				archivoController.container = "modalRUDIDetalle";
				archivoController.limiteArchivos = 0;
				archivoController.cargaIlimitada = true;
				archivoController.viewInBlankWindow = true;
				archivoController.seEdita = false;
				archivoController.titulo = "Archivos Adjuntos"
				archivoController.initModal();
				archivoController.openModal();

				if (self.nroTramite != null && self.nroTramite != undefined) {
					archivoController.cargarArchivosPorBusinessKey(self.nroTramite);
				}
			});
		},

		fillObject: function (generico) {
			var self = this;

			if (self.archivosParaCargar != null && self.archivosParaCargar != undefined && self.archivosParaCargar.length > 0) {
				var attachment = {};
				if (generico.archivosAdjuntos == null || generico.archivosAdjuntos == undefined) {
					generico.archivosAdjuntos = [];
				}
				attachment.pk = {};

				attachment.pk.tipoTramite = self.tipoTramiteRudi;
				attachment.origen = "SGI";
				attachment.idRudi = self.idRudi;
				attachment.observaciones = "";
				attachment.imagenesArchivo = {
					items: self.archivosParaCargar
				};
				if (self.nroTramite != null && self.nroTramite != undefined) {
					attachment.pk.nroTramite = self.nroTramite;
				}

				generico.archivosAdjuntos.push(attachment);
			}
		},

		getArchivosParaCargar: function () {
			var self = this;

			return self.archivoController.getArchivos();
		},

		getArchivosCargados: function () {
			var self = this;

			return self.archivosCargados;
		},

		countArchivosParaCargar: function () {
			var self = this;

			if (self.archivosParaCargar != null && self.archivosParaCargar != undefined) {
				return self.archivosParaCargar.length;
			}
			return 0;
		},

		countArchivosCargados: function () {
			var self = this;

			if (self.archivosCargados != null && self.archivosCargados != undefined) {
				return self.archivosCargados.length;
			}
			return 0;
		},

		countArchivos: function () {
			var self = this;

			return self.countArchivosCargados() + self.countArchivosParaCargar();
		},
	}); // Finaliza el extend

	return attachmentController;
});
//# sourceURL=/form-venta-ecco-ap/js/libs/framework/views/app/attachments/attachmentController.js