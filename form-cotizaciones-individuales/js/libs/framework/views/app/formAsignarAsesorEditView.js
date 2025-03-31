define ([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	'bootstrap',
	'ace',
	'encoding',
	'libs/settings',
	'util',
	'messagesService',
	'/static/js/libs/services/loginService.js',
	'libs/framework/views/app/listSearchView',
	'text!libs/framework/templates/app/formAsignarAsesorTemplate.html',
	'text!libs/framework/templates/app/taskDetailVtaProductoresTemplate.html',
	'text!libs/framework/templates/app/taskNotFoundTemplate.html',
	'text!libs/framework/templates/app/actorNotFoundTemplate.html',
	'text!libs/framework/templates/app/searchTemplate.html',
    '/form-visualizador-tiff/js/libs/framework/views/helpers/controladorArchivos/archivoController.js',
    '/form-smg-commons/js/libs/services/inboxService.js',
	'session',
	'/form-smg-commons/js/libs/services/fuseService.js',
    '/form-smg-commons/js/libs/services/conversorPresmedAfilmed.js',
	'text!/form-cotizaciones-individuales/process.json',
	'text!/form-cotizaciones-individuales/aseguradoras.json'
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, MessagesService,
			 LoginService, ListSearchView, formEditTemplate, taskDetailTemplate, taskNotFoundTemplate,
			 actorNotFoundTemplate, searchTemplate, ControladorArchivos, InboxService, Session, FuseService, ConversorPresmedAfilmed, ProcessJson,
			 AseguradorasJson){

	var historialLlamadoPDF;
	var idProcess;

	var processTypes;
	var id;
	var motive;
	var encontrado = false;
	var tomada = true;
	var finalize,submotive = false;
	var tasks = null;
	var workflowId;
	var process = null;
	var prospecto = null;
	var processesDetail;
	var processDetail;
	var statusSave;
	var hasSubmotive;
	var processNameJBPM;
	var workcontext;
	var allTasks;

	function pad (str, max) {
		return str.length < max ? pad("0" + str, max) : str;
	}

	var validate  = {
		errorElement: 'span',
		errorClass: 'help-inline',
		focusInvalid: false,
		rules: null,
		messages: null,
		invalidHandler: function (event, validator) { //display error alert on form submit
		},
		highlight: function (e) {
			$(e).closest('.control-group').removeClass('info').addClass('error');
		},
		success: function (e) {
			$(e).closest('.control-group').removeClass('error').addClass('info');
			$(e).remove();
		},
		errorPlacement: function (error, element) {
			if(element.is(':checkbox') || element.is(':radio')) {
				var controls = element.closest('.controls');
				if(controls.find(':checkbox,:radio').length > 1) {
					controls.append(error);
				}
				else {
					error.insertAfter(element.nextAll('.lbl:eq(0)').eq(0));
				}
			}
			else if(element.is('.select2')) {
				error.insertAfter(element.siblings('[class*="select2-container"]:eq(0)'));
			}
			else if(element.is('.chzn-select')) {
				error.insertAfter(element.siblings('[class*="chzn-container"]:eq(0)'));
			}
			else {
				error.insertAfter(element);
			}
		},

		submitHandler: function (form) {
		},
		invalidHandler: function (form) {
		}
	};

    var rulesSaveAndEnd= {
        'process[action]': {
            required: true
        },
        'asesor[descripcion]': {
            required: true
        }
    };

    var messagesSaveAndEnd = {
        'asesor[descripcion]': {
            required: "El campo Asesor es necesario."
        },
        'process[action]': {
            required: " "
        },
    };


	var newView = Backbone.View.extend ({

		events: {
			'click 		#btnSaveAndEndTask' 			: 'saveAndEndTask',
			'click 		#btnSaveTask'					: 'saveTask',
			'click 		#btnCloseTask'					: 'closeTask',
			'click 		#myTab li'						: 'showTab',
			'click 		#btnPrintTask'					: 'printTask',
			'click      #usuario'     					: 'searchSupervisor',
            'click      #verArchivos'                   : 'verArchivos'
		},

		verArchivos: function() {
//			var controladorArchivos;
			controladorArchivos.businessKey = null;
			controladorArchivos.seCargoLasImagenes = false;
			controladorArchivos.openModalViewByBusinessKey(processDetail.id_Venta);
			event.preventDefault();
			event.stopPropagation();
		},

		searchSupervisor: function(){
			var manager = null;
			$("#modalSearch").modal("show");
			$("#processSearch").empty ();
			var compiledTemplate = Handlebars.compile(searchTemplate);
			$("#processSearch").append (compiledTemplate());

			// Validate the search field.
			this.$('#searchResultsContent').empty ();
			//Esté harcodeo está solo para pruebas en los ambientes de desarrollo
			if(processDetail.supervisor.trim() == 'SGI Supervisor'){
				LoginService.userInformation('sgisupervisor', false,
					function (data) {

						manager = [data];
					},
					function (xhr,err) {
						Util.error( 'Sample of error data:', err );
						Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
					},
					function (data) {
					});
			}else{
				var legajo = pad(processDetail.legajo_supervisor.trim(),8);

				LoginService.usersByLegajo(legajo,false,
				function (data) {
					manager = data;
				},
				function (xhr,err) {
					Util.error( 'Sample of error data:', err );
					Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
				},
				function (data) {
				});
			}
			
			Util.debug("manager",manager);
			
			var listSearchView = new ListSearchView();
			//listSearchView.list(comercial, this.$('#searchResultsContent'), this.$('#searchRefErrorContent'),url,false);
			listSearchView.list(manager[0].uid, this.$('#searchResultsContent'), this.$('#searchRefErrorContent'),LoginService.managerOf,false);
		},


		printTask: function () {
			var doc = new jsPDF();

			doc.text(10, 8, 'PROCESO '+motive.toUpperCase() + " #" +idProcess);
			var pos = 12;


			for (var i = 0; i < processesDetail.length; i++) {

				var prettyDate;
				var d = new Date(processesDetail[i].registro_fecha);
				var curr_date = d.getDate();
				if (curr_date < 10) {
					curr_date = '0' + curr_date;
				}
				var curr_month = d.getMonth() + 1;
				//Months are zero based
				if (curr_month < 10) {
					curr_month = '0' + curr_month;
				}
				var curr_year = d.getFullYear();
				var hour = d.getHours();
				if (hour < 10) {
					hour = '0' + hour;
				}
				var minutes = d.getMinutes();
				if (minutes < 10) {
					minutes = '0' + minutes;
				}
				if (hour === '00' && minutes === '00') {
					prettyDate = curr_date + '/' + curr_month + '/' + curr_year;
				} else {
					prettyDate = curr_date + '/' + curr_month + '/' + curr_year + ' ' + hour + ':' + minutes;
				}

				if(pos > 240){
					doc.addPage();
					pos = 10;
				}

				// Filled red square
				doc.setDrawColor(0);
				doc.setFillColor(255,0,0);
				doc.rect(10, pos, 190, 6, 'F');

				pos = pos + 5;

				doc.setFontSize(12);
				doc.setTextColor(255,255,255);
				doc.text(20, pos, prettyDate);
				doc.setTextColor(255,255,255);
				doc.setTextColor(255,255,255);

				pos= pos +1;

				var dark = true;

				doc.setDrawColor(0);

				if(dark){
					doc.setFillColor(200,200,200);
					dark = false;
				}else{
					doc.setFillColor(217,217,217);
					dark = true;
				}

				doc.rect(10, pos, 190, 6, 'F');

				doc.setFontSize(10);

				doc.setTextColor(0,0,0);
				doc.text(20, pos+5, "Apellido y Nombre:");
				doc.text(55, pos+5, processesDetail[i].ape + ", " + processesDetail[i].nombre);
				doc.text(140, pos+5, "Abono/Solicitud:");
				doc.text(175, pos+5, processesDetail[i].contra);

				pos= pos+6;

				if(dark){
					doc.setFillColor(200,200,200);
					dark = false;
				}else{
					doc.setFillColor(217,217,217);
					dark = true;
				}

				doc.rect(10, pos, 190, 6, 'F');

				doc.setFontSize(10);

				doc.setTextColor(0,0,0);
				doc.text(20, pos+5, "Prepaga:");
				doc.text(55, pos+5, Util.getDescripcionPrepaga(ConversorPresmedAfilmed.getPrepagaAfilmed(processesDetail[i].contra).toString()));
				doc.text(140, pos+5, "Inte:");
				doc.text(175, pos+5, processesDetail[i].inte);

				pos= pos+6;

				if(dark){
					doc.setFillColor(200,200,200);
					dark = false;
				}else{
					doc.setFillColor(217,217,217);
					dark = true;
				}

				doc.rect(10, pos, 190, 6, 'F');

				doc.setFontSize(10);

				doc.setTextColor(0,0,0);
				doc.text(20, pos+5, "Medio:");
				doc.text(55, pos+5, Util.getDescripcionMedio(processesDetail[i].medio_id));
				doc.text(140, pos+5, "Medio Nro:");
				doc.text(175, pos+5, processesDetail[i].medio_numero);

				pos= pos+6;

				if(processesDetail[i].submotivo_id != null){
					if(dark){
						doc.setFillColor(200,200,200);
						dark = false;
					}else{
						doc.setFillColor(217,217,217);
						dark = true;
					}

					doc.rect(10, pos, 190, 6, 'F');

					doc.setFontSize(10);

					doc.setTextColor(0,0,0);
					doc.text(20, pos+5, "Motivo:");
					doc.text(55, pos+5, processesDetail[i].submotivo_detalle);
					doc.text(140, pos+5, "Motivo Numero:");
					doc.text(175, pos+5, processesDetail[i].submotivo_id.toString());

					pos= pos+6;
				}

				if(dark){
					doc.setFillColor(200,200,200);
					dark = false;
				}else{
					doc.setFillColor(217,217,217);
					dark = true;
				}

				doc.rect(10, pos, 190, 6, 'F');

				doc.setFontSize(10);

				doc.setTextColor(0,0,0);
				doc.text(20, pos+5, "Registrado por:");
				doc.text(55, pos+5, processesDetail[i].registro_usuario);
				doc.text(140, pos+5, "Sucursal:");
				doc.text(175, pos+5, processesDetail[i].sucursal_detalle);

				pos= pos+6;

				if(dark){
					doc.setFillColor(200,200,200);
					dark = false;
				}else{
					doc.setFillColor(217,217,217);
					dark = true;
				}
				doc.setFontSize(10);


				if(processesDetail[i].observacion.length > 200){
					doc.rect(10, pos, 190, 6, 'F');
					doc.rect(10, pos+6, 190, 6, 'F');
					doc.rect(10, pos+12, 190, 6, 'F');
					doc.rect(10, pos+18, 190, 6, 'F');

					doc.setTextColor(0,0,0);
					doc.text(20, pos+5, "Observación:");
					doc.text(55, pos+5, doc.splitTextToSize(processesDetail[i].observacion, 140));

					pos= pos+18;
				}else{
					if(processesDetail[i].observacion.length > 100){
						doc.rect(10, pos, 190, 6, 'F');
						doc.rect(10, pos+6, 190, 6, 'F');
						doc.rect(10, pos+12, 190, 6, 'F');

						doc.setTextColor(0,0,0);
						doc.text(20, pos+5, "Observación:");
						doc.text(55, pos+5, doc.splitTextToSize(processesDetail[i].observacion, 140));

						pos= pos+12;
					}else{
						if(processesDetail[i].observacion.length > 50){
							doc.rect(10, pos, 190, 6, 'F');
							doc.rect(10, pos+6, 190, 6, 'F');

							doc.setTextColor(0,0,0);
							doc.text(20, pos+5, "Observación:");
							doc.text(55, pos+5, doc.splitTextToSize(processesDetail[i].observacion, 140));

							pos= pos+6;
						}else{

							doc.rect(10, pos, 190, 6, 'F');

							doc.setTextColor(0,0,0);
							doc.text(20, pos+5, "Observación:");
							doc.text(55, pos+5, doc.splitTextToSize(processesDetail[i].observacion, 140));

						}
					}
				}



				pos= pos+10;
			}

			//Fin armado del PDF

			historialLlamadoPDF = doc.output('datauristring');

			$("#modal-form-edit").modal("show");
			$('#iframeEdit').attr('src', historialLlamadoPDF);

			var elemToChange = document.getElementById("iframeEdit");
			elemToChange.style.height = $(window).height() - 300 + "px";
		},

		closeTask: function () {
			window.top.location.href= SettingsModel.get("open_task");
		},

		showTab: function (ev) {

			var id = ev.target.id;

			if(id === "formTabDetail"){
				this.showFormTabDetail();
			}else{
				if(id === "processTabDetail"){
					this.showProcessTabDetail();
				}else{
					this.showEntityTabDetail();
				}
			}
		},

		showEntityTabDetail: function () {
			$("#controlActions").hide();
			$("#btnSaveTask").hide();
			$("#btnPrintTask").hide();
		},

		showProcessTabDetail: function () {
			$("#controlActions").hide();
			$("#btnSaveTask").hide();
			$("#btnPrintTask").show();
		},

		showFormTabDetail: function () {
			$("#controlActions").show();
			$("#btnSaveTask").show();
			$("#btnPrintTask").hide();
		},


		getProcessDetail: function () {
			var self = this;
			

			FuseService.getDetallePorProcessIdSMMP(
				idProcess,
				false,
				function(data) {
					processesDetail = data;
					processDetail = processesDetail[processesDetail.length-1];
					self.getAseguradora(processesDetail);
					Util.debug("processDetail", processDetail);
				},
				function( xhr,err ) {
					encontrado = false;
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}
			);



		},

		getProcessConfiguration: function () {
			try{
				var data =  JSON.parse(ProcessJson);
				processTypes = eval( data );
				for (var i=0;i<processTypes.length;i++){
					if(processTypes[i].processNameJBPM === tasks.processName){
						encontrado = true;
						id = processTypes[i].id;
						motive = processTypes[i].processName;
						finalize = processTypes[i].choisefinalize;
						hasSubmotive = processTypes[i].hasSubmotive;
						processNameJBPM = processTypes[i].processNameJBPM;
						workcontext =  processTypes[i].workcontext;
						allTasks = processTypes[i].tasks;
						statusSave= processTypes[i].statusSave;

						for (var x=0;x<allTasks.length;x++){
							if(allTasks[x].taskName === tasks.name){
								tasks.actions = allTasks[x].actions;
							}
						}
						break;
					}
				}
			} catch (e) {   
				Util.error("Error al intentar recuperar el archivo process.json");
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);		
			}

		},

		buildObject: function (form) {
			//ARMO EL OBJECT DEL MOTIVO generico
			var venta = form.serializeObject();

			prosp = {};
			prosp.pk = {};
			prosp.pk.idProsp = processDetail.id_prosp;
			prosp.pk.version = processDetail.pro_version;
			prosp.pk.idTipoUnidadNegocio = processDetail.id_tipo_pros;
			venta.prospecto = prosp;

			venta.idVenta = parseInt(venta.idVenta,10);
			venta.estado.id = parseInt(venta.estado.id,10);
            venta.tipo.id = parseInt(venta.tipo.id,10);
			venta.medio.id 	= parseInt(venta.medio.id,10);
			venta.ventaPura	= parseInt(venta.ventaPura,10);

			if(venta.process.action != ""){
				venta.estado.id = parseInt($("#actions option:selected").data("status"),10);
				venta.estado.descripcion = $("#actions option:selected").data("status-description");
			}else{
				venta.estado.id = parseInt(venta.estado.id,10);
			}

			var detalle = '<status '+venta.estado.descripcion+'>'+" - "+venta.observacion;

			//CREO EL OBJETO PROCESS DE JBPM
			venta.process.observaciones = venta.observacion;
			venta.process.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle;

			var prospectoReservado = $("#prospectoReservado").is(":checked");
			if(prospectoReservado){
				venta.reserva.motivo.id = parseInt(venta.reserva.motivo.id,10);
			}else{
				venta.reserva = null;
			}

			if (prospecto == null) {
				var prosp = {};
				prosp.pk = {};
				prosp.pk.idProsp = processDetail.id_prosp;
				prosp.pk.version = processDetail.pro_version;
				prosp.pk.idTipoUnidadNegocio = processDetail.id_tipo_pros;
				venta.prospecto = prosp;
			} else {
				venta.prospecto = prospecto;
			}

			if(venta.polizaSeguro === "") {
				venta.polizaSeguro = null;
			} else {
				venta.polizaSeguro = parseInt(venta.polizaSeguro);
			}

			if(venta.productoSeguro === "") {
				venta.productoSeguro = null;
			}

			if(venta.polizaLife === "") {
				venta.polizaLife = null;
			} else {
				venta.polizaLife = parseInt(venta.polizaLife);
			}

			if(venta.fechaLife === ""){
				venta.fechaLife = null;
			}
			else{
				if(venta.fechaLife != null) {
					var momentDate = moment(parseInt(venta.fechaLife)).format("YYYY/MM/DD");
					venta.fechaLife = momentDate;					}
			}

			if(venta.fechaSeguros === ""){
				venta.fechaSeguros = null;
			}
			else{
				if(venta.fechaSeguros != null) {
					var momentDate = moment(parseInt(venta.fechaSeguros)).format("YYYY/MM/DD");
					venta.fechaSeguros = momentDate;
				}
			}

			if(venta.fechaAseguradora === ""){
				venta.fechaAseguradora = null;
			}else{
				if(venta.fechaAseguradora != null) {
					var momentDate = moment(parseInt(venta.fechaAseguradora)).format("YYYY/MM/DD");
					venta.fechaAseguradora = momentDate;
				}
			}

			if (venta.aseguradora != "") {
				venta.aseguradora = parseInt(venta.aseguradora);
			} else {
				delete venta.aseguradora;
			}

			//IMPRIMO POR CONSOLA EL JSON DE venta QUE VOY A POSTEAR
			Util.debug("generico",JSON.stringify(venta));
			Util.debug("generico",venta);

			return venta;
		},

		saveTask: function () {

			var target = $("#toolbarLogin");

			Util.blockBody();

			target.empty();
			target.append("<img src='../static/images/pleasewait.gif'/>");

			var self = this;

			var form = $("#validation-form");
			$("#validation-form").removeData("validator");
			validate.rules= {'observacion': {required: true}};
			validate.messages = {'observacion': {required: "El campo observación es necesario."}};
			form.validate(validate);

			if(!form.valid()){
				$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text: 'Por favor ingrese los datos necesarios',
					class_name: 'gritter-warning'
				});
				Util.unBlockBody();
				target.empty();
			}else{

				//CONSTRUYO EL OBJECTO A GRABAR
				var generico = this.buildObject(form);
				generico.motivo = null;
				generico.process.action = null;

				var processInstance;


				FuseService.actualizarProceso(
					generico,
					true,
					function(data) {

						//GRABO EN EL MURO
						var body =  $("#observacion").val();
						var subject = "Salvar tarea";
						var processId = generico.process.id;
						var userName = Session.getLocal('userName');
						var recipientsArray = [];recipientsArray.push(processId);
						if(body){
						MessagesService.sendMessage(subject,body,processId,userName,recipientsArray);
						}
						self.getProcessDetail();

						var compiledTemplate = Handlebars.compile(taskDetailTemplate);
						$("#processDetail").empty ();
						$("#processDetail").append (compiledTemplate({tasks: tasks,process: process, processesDetail: processesDetail.reverse(),processDetail: processDetail}));


						$("#observacion").val("");

						Util.unBlockBody();
						$.gritter.add({	
		                    title : '<i class="icon-ok bigger-120"></i>&nbsp;Exito',
		                    text : 'Datos guardados correctamente',
		                    class_name : 'gritter-success'
		                });
						target.empty();
					},
					function( xhr,err ) {

						//ERROR EL SERVICIO NO RESPONDE, ENVIO EL MENSAJE DE ERROR
						Util.error( 'Sample of error data:', err );
						Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);

						Util.unBlockBody();
						target.empty();

						$.gritter.add({
							title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
							text: 'No se pudo grabar el llamado',
							class_name: 'gritter-warning'
						});
					},
					function(){},
					true,
				);

			}
		},

		saveAndEndTask: function () {

			var target = $("#toolbarLogin");
			var start = new Date().getTime();
			var userId = Session.getLocal("userId");

			Util.blockBody();

			target.empty();
			target.append("<img src='../static/images/pleasewait.gif'/>");

            var action = parseInt($("#actions option:selected").data("status"),10);

			var form = $("#validation-form");
			$("#validation-form").removeData("validator");
            $("#validation-form").removeData("validator");
            validate.rules= {
                'process[action]': {
                    required: true
                },
                'asesor[descripcion]': {
                    required: (action === 7 || action === 8)
				},
				'observacion': {
                    required: (action === 12)
                }
            };
            validate.messages = {
                'asesor[descripcion]': {
                    required: "El campo Asesor es necesario."
                },
                'process[action]': {
                    required: " "
				},
				'observacion': {
                    required: "El campo Observación es necesario."
                }
            };
			form.validate(validate);

            var usuarioNotSelected = ($("#usuario").val() === "");

            if(!form.valid() || ((action === 7 || action === 8)  && usuarioNotSelected)){
				$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text: 'Por favor ingrese los datos necesarios',
					class_name: 'gritter-warning'
				});
				Util.unBlockBody();
				target.empty();
			}else{

				//CONSTRUYO EL OBJECTO A GRABAR
				var generico = this.buildObject(form);
				tasks = InboxService.getTaskById(generico.task.id);
				
				if (tasks && tasks.end == null){

					Util.debug(tasks.actorId && tasks.actorId === userId,tasks.actorId,userId);
					if(tasks.actorId && tasks.actorId === userId){

						if(action === 12){
							generico.asesor.descripcion = "";
							generico.asesor.legajo = "";
							generico.asesor.login = "";
							generico.asesor.nombreCompleto = "";
							generico.asesor.uid = "";
						}

                        var variableDetalle = {
                            "name" : "actorId",
                            "value": generico.asesor.uid,
                            "dataType": "STRING"
                        };

						InboxService.updateVariable(generico.process.id, 'actorId', variableDetalle, true,
							function(data) {},
							function(xhr, err) {
								Util.error('Sample of error data:', err);
								Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
							},
							function(data) {}
					   	);
                       
						var variableDetalle = {
							"name" : "workContext",
							"value": action === 8 || action === 7 ? "AMB_OV_ASESOR" : "AMB_OV_ASISTENTE",
							"dataType": "STRING"
						};

						InboxService.updateVariable(generico.process.id, 'workContext', variableDetalle, true,
							function(data) {},
							function(xhr, err) {
								Util.error('Sample of error data:', err);
								Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
							},
							function(data) {}
					   	);


						//LLAMO AL SERVICIO DE GRABACION DEL LLAMADO
						var processInstance;

					

						FuseService.actualizarProceso(
							generico,
							true,
							function(data) {
								var actionDescription = 'terminó la tarea ' +generico.task.name+' del proceso';
								MessagesService.sendNotificationsTask(generico.process.id, actionDescription);
								//GRABO EN EL MURO
								var body =  $("#observacion").val();
								var subject = "Salvar tarea";
								var processId = generico.process.id;
								var userName = Session.getLocal('userName');
								var recipientsArray = [];recipientsArray.push(processId);
								if(body){
								MessagesService.sendMessage(subject,body,processId,userName,recipientsArray);
								}
								Util.unBlockBody();
								target.empty();
								
								var tasks = InboxService.getTaskByProccessId(processId);
								tasks = Util.sortDescByKey(tasks, 'id');
								if(generico.asesor.uid != ""){
									InboxService.assignTask(tasks[0].id, generico.asesor.uid, true, function(){}, function(){}, function(){});
								}
								window.top.location.href= SettingsModel.get("open_task");

							},
							function( xhr,err ) {

								//ERROR EL SERVICIO NO RESPONDE, ENVIO EL MENSAJE DE ERROR
								Util.error( 'Sample of error data:', err );
								Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);

								Util.unBlockBody();
								target.empty();

								$.gritter.add({
									title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
									text: 'No se pudo grabar el llamado',
									class_name: 'gritter-warning'
								});
							},
							function(){},
							true,
						);


						var detalle = generico.process.detalle;
						var start = detalle.indexOf('<status ');
						var end =	detalle.indexOf('>');

						if(start !== -1){
							var statusDetail = detalle.substring(start,end+1);
							detalle = detalle.replace(statusDetail,'<status '+generico.estado.descripcion+'>');
							var processInfoDetalle = {detalle: detalle};

							InboxService.updateVariable(generico.process.id, 'processInfo', processInfoDetalle, true,
								function(data) {},
								function(xhr, err) {
									Util.error('Sample of error data:', err);
									Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
								},
								function(data) {}
						   );

						}else{
							return "";
						}
					}else{
						Backbone.history.navigate('error', { trigger : true });
						$("#content1").empty ();
						var compiledTemplate = Handlebars.compile(actorNotFoundTemplate);
						$("#content1").html (compiledTemplate());
					}
				}else{
					Backbone.history.navigate('error', { trigger : true });
					$("#content1").empty ();
					var compiledTemplate = Handlebars.compile(taskNotFoundTemplate);
					$("#content1").html (compiledTemplate());
				}


			}
		},


		list: function (taskId,processId){

			idProcess = processId;
			var userId = Session.getLocal("userId");
			taskId = parseInt(taskId,10);

			if (taskId !== 0){

				var self= this;
				var start = new Date().getTime();
				tasks = InboxService.getTaskById(taskId);

				if (tasks && tasks.end == null){

					if(tasks.actorId && tasks.actorId === userId){

						tomada = true;
						workflowId = InboxService.getBussinessKey(taskId);
						this.getProcessConfiguration();
						this.getProcessDetail();

					}else{
						tomada = false;
					}
				}
			}

			if(tomada){
				if(encontrado){
					var userId = Session.getLocal('userId');
					$("#content1").empty ();
					$("#content1").append (this.render (id,motive,userId,finalize,submotive,tasks,finalize,hasSubmotive,workcontext,processNameJBPM, processDetail,workflowId).el);

					var self = this;

					var prospectosDetailView = '../../form-prospectos/js/libs/framework/views/prospectos/prospectosDetailView';

					require([prospectosDetailView],function(View){
						var target = $('#entityDetail');
						var view = new View();
						view.list(processesDetail[0], target);
						prospecto = view.getProspecto();
					});

					var compiledTemplate = Handlebars.compile(taskDetailTemplate);
					$("#processDetail").empty ();
					$("#processDetail").css ("background","");
					$("#processDetail").append (compiledTemplate({editable: true, tasks: tasks,process: process, processesDetail: processesDetail.reverse(),processDetail: processDetail}));
					
					if (processDetail.id_Venta) {
	                    controladorArchivos = new ControladorArchivos({
	                        id : "RUDI"
	                    });
	                    
	                    controladorArchivos.setRudiTipoTrm("VPI");
	                    controladorArchivos.container = "modalRUDI";
	                    controladorArchivos.titulo = "Adjuntos del tr\u00E1mite";
	                    controladorArchivos.seEdita = false;
	                    controladorArchivos.limiteArchivos = 999;
	                    controladorArchivos.initModal();
	                    controladorArchivos.cargarArchivosPorBusinessKey(processDetail.id_Venta);
					}
				}else{
					Backbone.history.navigate('error', { trigger : true });
					$("#content1").empty ();
					var compiledTemplate = Handlebars.compile(taskNotFoundTemplate);
					$("#content1").html (compiledTemplate());
				}
			}else{
				Backbone.history.navigate('error', { trigger : true });
				$("#content1").empty ();
				var compiledTemplate = Handlebars.compile(actorNotFoundTemplate);
				$("#content1").html (compiledTemplate());
			}
		},

		getAseguradora: function (processesDetail) {
			try {
				var data = JSON.parse(AseguradorasJson);
				for (var pos = 0; pos < processesDetail.length; pos++) {
					if (processesDetail[pos].aseguradora_id) {
						for (var i = 0; i < data.length; i++) {
							if (data[i].id == processesDetail[pos].aseguradora_id) {
								processesDetail[pos].aseguradora_descripcion = data[i].name;
							}
						}
					}
				}
			} catch (e) {
				Util.error("Error al intentar recuperar el archivo aseguradoras.json");
				Util.error('Sample of error data:', err);
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			}
		},

		// Render method.
		render: function (id,motive,userId,finalize,submotive,tasks,finalize,hasSubmotive,workcontext,processNameJBPM,processDetail, workflowId){
			var compiledTemplate = Handlebars.compile(formEditTemplate);

			var userName = Session.getLocal("userName");
			var userId = Session.getLocal("userId");
			var subsidiary = Session.getLocal("subsidiary");
			var subsidiaryId = Session.getLocal("subsidiaryId");
			var entorno = SettingsModel.get("entorno");

			$('#version-container').empty();

			$.ajax({
				type: "GET" ,
				url: "META-INF/maven/pom.xml?date="+new Date().getTime(),
				dataType: "xml" ,
				success: function(xml) {
					$('#version-container').append(entorno+"-"+$(xml).find('version').eq(1).text());
				},
				error:function(date) {
					$('#version-container').remove();
				}
			});


			this.$el.html (compiledTemplate({id: id,motive: motive, userId: userId, userName: userName, subsidiary: subsidiary, subsidiaryId: subsidiaryId,
				finalize: finalize, submotive: submotive, tasks: tasks, hasSubmotive: hasSubmotive, workcontext: workcontext,
				processDetail: processDetail, workflowId: workflowId}));

			return this;
		}

	});

	return newView;
});
