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
	'/form-smg-commons/js/libs/prospectoUtil.js',
	'text!libs/framework/templates/app/formReservaProductoresEditTemplate.html',
	'text!libs/framework/templates/app/taskDetailVtaProductoresTemplate.html',
	'text!libs/framework/templates/app/taskNotFoundTemplate.html',
	'text!libs/framework/templates/app/actorNotFoundTemplate.html',
	'/form-visualizador-tiff/js/libs/framework/views/helpers/controladorArchivos/archivoController.js',
	'/form-smg-commons/js/libs/services/inboxService.js',
	'session',
	'/form-smg-commons/js/libs/services/fuseService.js',
    '/form-smg-commons/js/libs/services/conversorPresmedAfilmed.js',
    '/form-smg-commons/js/libs/services/terinService.js',
	'text!/form-cotizaciones-individuales/process.json',
	'text!/form-cotizaciones-individuales/aseguradoras.json',
	'/form-smg-commons/js/libs/services/prospectoService.js',
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, MessagesService,
			 LoginService, ProspectoUtil, formEditTemplate, taskDetailTemplate, taskNotFoundTemplate, actorNotFoundTemplate,
			 ControladorArchivos, InboxService, Session, FuseService, ConversorPresmedAfilmed, TerinService, ProcessJson, 
			 AseguradorasJson, ProspectoService){

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
	var supervisor;

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

	rulesSaveAndEndV = {
        'observacion': {
            required: true
        },
        'process[action]': {
            required: true
        },
        'reserva[motivo][id]': {
            required: true
        }
    };

    messagesSaveAndEndV = {
        'observacion': {
            required: "El campo' Observaci\u00F3n' es necesario."
        },
        'process[action]': {
            required: " "
        },
        'reserva[motivo][id]': {
            required: "El campo 'Motivo' es necesario."
        }
    };


	var newView = Backbone.View.extend ({

		events: {
			'click 		#btnSaveAndEndTask' 			: 'saveAndEndTask',
			'change		#prospectoReservado'			: 'changeReserva',
			'click 		#btnSaveTask'					: 'saveTask',
			'click 		#btnCloseTask'					: 'closeTask',
			'click 		#myTab li'						: 'showTab',
			'click 		#btnPrintTask'					: 'printTask',
			'click		#verArchivos'           		: 'verArchivos',
			'change		#actions'						: 'changeAction'
		},

        verArchivos: function() {
//			var controladorArchivos;
            controladorArchivos.businessKey = null;
            controladorArchivos.seCargoLasImagenes = false;
            controladorArchivos.openModalViewByBusinessKey(processDetail.id_Venta);
            event.preventDefault();
            event.stopPropagation();
		},

		changeReserva: function(){

			var prospectoReservado = $("#prospectoReservado").is(":checked");

			$('.control-group').removeClass('error').addClass('info');
            $('label.help-inline').remove();

			if(!prospectoReservado){
				$("#motivoReservaDiv").show();
				$("#motivoReserva").show();
				$("#actions").val("");
				$("#action-1").hide();
				$("#action-2").show();
				$("#action-3").hide();
			}else{
				$("#motivoReservaDiv").hide();
				$("#motivoReserva").hide();
				$("#actions").val("");
				$("#action-1").show();
				$("#action-2").hide();
				$("#action-3").show();
			}

		},

		changeAction: function(){
			var actionSelected = $("#actions option:selected").text();
			var esReservado = $("#prospectoReservado").is(":checked");

			$('.control-group').removeClass('error').addClass('info');
            $('label.help-inline').remove();

			if ( !esReservado ) {
				if(actionSelected === "Devolver al Supervisor" ){
					$("#motivoReservaDiv").hide();
					$("#motivoReserva").hide();
					$("#motivoReserva").val("");
				}else{
					$("#motivoReservaDiv").show();
					$("#motivoReserva").show();
					$("#motivoReserva").val("");
				}
			}
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
			try {
				var data = JSON.parse(ProcessJson);
				processTypes = eval(data);
				for (var i = 0; i < processTypes.length; i++) {
					if (processTypes[i].processNameJBPM === tasks.processName) {
						encontrado = true;
						id = processTypes[i].id;
						motive = processTypes[i].processName;
						finalize = processTypes[i].choisefinalize;
						hasSubmotive = processTypes[i].hasSubmotive;
						processNameJBPM = processTypes[i].processNameJBPM;
						workcontext = processTypes[i].workcontext;
						allTasks = processTypes[i].tasks;
						statusSave = processTypes[i].statusSave;

						for (var x = 0; x < allTasks.length; x++) {
							if (allTasks[x].taskName === tasks.name) {
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

        getAseguradora: function(processesDetail) {
			try {
				var data = JSON.parse(AseguradorasJson);
				for(var pos = 0; pos < processesDetail.length; pos++) {
					if(processesDetail[pos].aseguradora_id) {
						for(var i = 0; i < data.length; i++) {
							if(parseInt(data[i].id) == processesDetail[pos].aseguradora_id) {
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

		buildObject: function (form) {
			//ARMO EL OBJECT DEL MOTIVO generico
			var venta = form.serializeObject();


			venta.idVenta = parseInt(venta.idVenta,10);
			venta.tipo.id = parseInt(venta.tipo.id,10);
			venta.estado.id = parseInt(venta.estado.id,10);
			venta.medio.id 	= parseInt(venta.medio.id,10);
			venta.ventaPura	= parseInt(venta.ventaPura,10);

			if(venta.motivo != null && venta.motivo === ""){
				venta.motivo = null;
			}

			if(venta.process.action != null){
				venta.estado.id = parseInt($("#actions option:selected").data("status"),10);
				venta.estado.descripcion = $("#actions option:selected").data("status-description");
			}else{
				venta.estado.id = parseInt(venta.estado.id,10);
			}

			var detalle = '<status '+venta.estado.descripcion+'>'+prospecto.apellido+', '+prospecto.nombre+" - "+prospecto.docTipo+"-"+prospecto.docNum+" - "+venta.observacion;

			//CREO EL OBJETO PROCESS DE JBPM
			venta.process.observaciones = venta.observacion;
			venta.process.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle;

			var prospectoReservado = $("#prospectoReservado").is(":checked");
			if(!prospectoReservado){
				venta.reserva.motivo.id = parseInt(venta.reserva.motivo.id,10);
			}else{
				venta.reserva = null;
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
			
			if (!venta.asesor.legajo.trim()) {
				delete venta.asesor;
			}

/*            if (venta.aseguradora != "") {
                venta.aseguradora = parseInt(venta.aseguradora);
            } else {
                delete venta.aseguradora;
            }*/

			venta.prospecto = prospecto;

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

						MessagesService.sendMessage(subject,body,processId,userName,recipientsArray);

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
                            				title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
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
			var self = this;

			var target = $("#toolbarLogin");
			var start = new Date().getTime();
			var userId = Session.getLocal("userId");

			Util.blockBody();

			target.empty();
			target.append("<img src='../static/images/pleasewait.gif'/>");

			var form = $("#validation-form");
			$("#validation-form").removeData("validator");

			validate.rules = rulesSaveAndEndV;
			validate.messages = messagesSaveAndEndV;
			
			var actionSelected = $("#actions option:selected").val();
            if (actionSelected === 'a_cotizar' ||  actionSelected ===  'Devolver al Supervisor'){
                validate.rules = {
                    'process[action]': {
                        required: true
                    },
                    'reserva[motivo][id]': {
                        required: true
                    }
                };
                validate.messages = {
                    'process[action]': {
                        required: " "
                    },
                    'reserva[motivo][id]': {
                        required: "El campo 'Motivo' es necesario."
                    }
                };
			}
	
			form.validate(validate);

			if(!form.valid()){
				$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
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
						var variableDetalle = {
							"name" : "workContext",
							"value": generico.tipo.id === 1 ? ProspectoUtil.getAmbitoUserTipo() : 'AMB_OV_ASESOR',
							"dataType": "STRING"
						};

						InboxService.updateVariable(generico.process.id, 'workContext', variableDetalle, true,
							function(data) {},
							function(xhr, err) {
								Util.error( 'Sample of error data:', err );
								Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
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
								
								var tasks = InboxService.getTaskByProccessId(processId);
								tasks = Util.sortDescByKey(tasks, 'id');
								if(generico.asesor && generico.asesor.uid){
									InboxService.assignTaskAsync(tasks[0].id, generico.asesor.uid, true, function(){}, function(){}, function(){});
								}
								if(body){
								MessagesService.sendMessage(subject,body,processId,userName,recipientsArray);
								}
								/////////////////
								if (generico.process.action === "a no corresponde" || generico.process.action === "no_corresponde") {
									var tasks = InboxService.getTaskByProccessId(processId);
									tasks = Util.sortDescByKey(tasks, 'id');
									if (self.supervisor) {
										InboxService.assignTaskAsync(tasks[0].id, self.supervisor.uid, true, function(){}, function(){}, function(){});
									}
								}
								//////////////////

								Util.unBlockBody();
								target.empty();

								if (generico.canal != 'WEB') {
									var prospectoReservado = $("#prospectoReservado").is(":checked");
									var subject = "";
									var observacionesMail = "";
									if(!prospectoReservado){
										subject = "SWISS MEDICAL - Reserva "+idProcess+" - Rechazada";
										observacionesMail = "Motivo de rechazo: <b>"+$("#motivoReserva option:selected" ).text()+"</b> <br/> <br/> Observaciones: <b>"+$("#observacion").val() +"</b><br/><br/>";
									}else{
										subject = "SWISS MEDICAL - Reserva "+idProcess+" - Aprobada";
										observacionesMail = "Observaciones: <b>"+$("#observacion").val() +"</b><br/><br/>";
									}

									var emailTo = null;

									if(generico.tipo.id === 1) {
										emailTo = $("#emailProductor").val();
									} else {
										emailTo = $("#emailProductor").val()+",DVC@swissmedical.com.ar";
									}

									var mailJson = {
										"to": emailTo,
										"template": 'reserva-validacion-notif-sgi.htm',
										"subject": subject,
										"body": subject,
										custom: [
											{
												name: 'custom_nombre',
												value: processDetail.ape+", "+processDetail.nombre
											},
											{
												name: 'custom_prospecto',
												value: prospecto.apellido+", "+prospecto.nombre
											},
											{
												name: 'custom_docTipo',
												value: 'DU'
											},
											{
												name: 'custom_du',
												value: prospecto.docNum
											},
											{
												name: 'custom_nroTramite',
												value: idProcess
											},
											{
												name: 'custom_fechaenvio',
												value: moment().format("DD/MM/YYYY")
											},
											{
												name: 'custom_estado',
												value: !prospectoReservado ? "rechazada" : "aprobada"
											},
											{
												name: 'custom_observaciones',
												value: observacionesMail
											},
											{
												name: 'custom_tipo',
												value: "reserva"
											}
										]
									};
									
									TerinService.sendTerinMailWithTemplate(JSON.stringify(mailJson),
										function(data) {
											$.gritter.add({
												title : '<i class="icon-ok bigger-120"></i>&nbsp;Exito',
												text : 'El mail ha sido enviado',
												class_name : 'gritter-success'
											});
										}, function( xhr,err ) {
											Util.error( 'Sample of error data:', err );
											Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);

											$.gritter.add({
												title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
												text : 'El mail no se pudo enviar',
												class_name : 'gritter-warning'
											});
											return false;
										},
										function () {
										},
										false
									);
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
                                    title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
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
									Util.error( 'Sample of error data:', err );
									Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
								},
								function(data) {}
							);
						}else{
							return "";
						}
						if (generico.estado.id === 6) {
							ProspectoService.liberarProspecto(generico.prospecto.pk,true);
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

					var asesor = null;

					if(processDetail.legajo_asesor){
						var legajo = pad(processDetail.legajo_asesor.trim(),8);

						LoginService.usersByLegajo(legajo,false,
						function (data) {
							asesor = data[0];
						},
						function (xhr,err) {
							Util.error( 'Sample of error data:', err );
							Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
						},
						function (data) {
						});
					}

					if(processDetail.legajo_supervisor){
						var legajo = pad(processDetail.legajo_supervisor.trim(),8);

						LoginService.usersByLegajo(legajo,false,
						function (data) {
							self.supervisor = data[0];
						},
						function (xhr,err) {
							Util.error( 'Sample of error data:', err );
							Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
						},
						function (data) {
						});
					}

					var userId = Session.getLocal('userId');
					$("#content1").empty ();
					$("#content1").append (this.render (id,motive,userId,finalize,submotive,tasks,finalize,hasSubmotive,workcontext,processNameJBPM, processDetail,workflowId, asesor).el);
					$("#action-2").hide();
					$("#action-3").show();

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

		// Render method.
		render: function (id,motive,userId,finalize,submotive,tasks,finalize,hasSubmotive,workcontext,processNameJBPM,processDetail,workflowId,asesor){
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
				processDetail: processDetail, workflowId: workflowId, asesor: asesor}));

			return this;
		}

	});

	return newView;
});
