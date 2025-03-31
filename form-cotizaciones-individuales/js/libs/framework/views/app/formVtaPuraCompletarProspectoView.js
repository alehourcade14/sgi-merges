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
	'text!libs/framework/templates/app/formVtaPuraCompletarProspectoTemplate.html',
	'text!libs/framework/templates/app/taskDetailVtaProductoresTemplate.html',
	'text!libs/framework/templates/app/taskNotFoundTemplate.html',
	'text!libs/framework/templates/app/actorNotFoundTemplate.html',
    '/form-visualizador-tiff/js/libs/framework/views/helpers/controladorArchivos/archivoController.js',
    '/form-smg-commons/js/libs/services/prospectoService.js',
	'/form-smg-commons/js/libs/prospectoUtil.js',
	'/form-smg-commons/js/libs/services/guardiasVendedoresService.js',
	'/form-smg-commons/js/libs/services/subsidiariesService.js',
	'session',
	'/form-smg-commons/js/libs/services/fuseService.js',
	'/form-smg-commons/js/libs/services/inboxService.js',
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, MessagesService, 
			 LoginService, formEditTemplate, taskDetailTemplate, taskNotFoundTemplate,
			 actorNotFoundTemplate, ControladorArchivos, ProspectoService, ProspectoUtil, GuardiasVendedoresService, SubsidiariesService,
			 Session, FuseService, InboxService){

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
	var motivos;
	
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
			'motivo[id]': {
				required: true
			},
	        'ambitoOperador': {
	            required: true
	        }
	    };

	    var messagesSaveAndEnd = {
	        'process[action]': {
	            required: " "
			},
			'motivo[id]': {
				required: "El campo motivo es necesario."
			},
	        'ambitoOperador': {
	            required: " "
	        }
	    };
	
	var newView = Backbone.View.extend ({
		
		prospectoIncompleto: true,
		sucursales: [],
		
		events: {
			'click 		#btnSaveAndEndTask' 			: 'saveAndEndTask',
			'click 		#btnSaveTask'					: 'saveTask',
			'click 		#btnCloseTask'					: 'closeTask',
			'click 		#myTab li'						: 'showTab',
			'change		#actions'						: 'habilitarPorEstado',
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

			$.ajax({
				url: 'process.json?date='+new Date(),
				type:'GET',
				async: false,
				success:function (data) {
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
							tasks.actions = [];

							for (var x=0;x<allTasks.length;x++){
								if(allTasks[x].taskName === tasks.name){
									$.each(allTasks[x].actions, function(key, action) {
										if (!Util.hasOneOfThisRoles(action.rolesToHide)) {
											tasks.actions.push(action);
										}
									});
								}
							}
							break;
						}
					}
				},
				error: function( xhr,err ) {
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}
			});
		},

		buildObject: function (form) {
			//ARMO EL OBJECT DEL MOTIVO generico
			var self = this;
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

			venta.estado.id = parseInt(venta.estado.id,10);

			venta.motivo.id = parseInt(venta.motivo.id,10);

			var detalle = '<status '+venta.estado.descripcion+'>'+" - "+venta.observacion;

			//CREO EL OBJETO PROCESS DE JBPM
			venta.process.observaciones = venta.observacion;
			venta.process.detalle = detalle.length > 255 ? detalle.substring(0,255): detalle;
			
			if ( ProspectoUtil.isUserAsesorByRol() ) {
//				self.assignActorId( venta.process.id, Session.getLocal("userId") );
				self.actorId = Session.getLocal("userId");
				var tasks = [];
				tasks.push("P_" + venta.process.id);
				Session.setLocal('tasks', JSON.stringify(tasks));
			} else {
				var sucursalSelected = self.arrayLookup(self.sucursales, 'sucursalId', parseInt(venta.ambitoOperador, 10));
				venta.process.ambitoGestion = sucursalSelected.ambitoGestion;
				venta.process.variables.workContext = sucursalSelected.ambitoGestion;
				venta.process.workContext = sucursalSelected.ambitoGestion;
				venta.sucursal.descripcion = sucursalSelected.ambitoGestion;
				var updateWorkContext = {
					"name" : "workContext",
					"value": sucursalSelected.ambitoGestion,
					"dataType": "STRING"
				};
				InboxService.updateVariable(venta.process.id, "workContext", updateWorkContext, false, function(){}, function(){}, function(){});
				GuardiasVendedoresService.findAsesorGuardiaActivo(sucursalSelected.sucursalId, false, 
					function(userGuardia) {
						if (userGuardia.userName != null) {
							console.log("user guardia", userGuardia);
							LoginService.userInformation( userGuardia.userName, false, 
								function ( user ) {
//									self.assignActorId( venta.process.id, user.uid );
								self.actorId = user.uid;
								},
								function(){
									Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
									Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
								}, 
								function(){/* complete function*/} 
							);
						}
					},
					function(  ) {
						Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
					},
					function() {
						
					}
				);
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

			//IMPRIMO POR CONSOLA EL JSON DE venta QUE VOY A POSTEAR
			Util.debug("generico",JSON.stringify(venta));
			Util.debug("generico",venta);

			return venta;
		},
		
		assignActorId: function(processId, actorId) {
			var self = this;

			var variableDetalle = {
				"name" : "actorId",
				"value": actorId,
				"dataType": "STRING"
			};

			InboxService.updateVariable(processId, 'processInfo', variableDetalle, true,
				function(data) {},
				function(xhr, err) {
					Util.error( 'Sample of error data:', err );
					Util.error("readyState: "+xhr.readyState+"\nstatus: "+xhr.status+"\nresponseText: "+xhr.responseText);
				},
				function(data) {}
			);
		},

		saveTask: function () {

			var target = $("#toolbarLogin");

			Util.blockBody();

			target.empty();
			target.append("<img src='../static/images/pleasewait.gif'/>");

			var self = this;
			var form = $("#validation-form");
			//validar info

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
					var body =  generico.observacion;
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
						title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
						text: 'No se pudo grabar el llamado',
						class_name: 'gritter-warning'
					});
				},
				function(){},
				true,
			);

		},

		saveAndEndTask: function () {
			var self = this;
			var target = $("#toolbarLogin");
			var start = new Date().getTime();
			var userId = Session.getLocal("userId");

			Util.blockBody();

			target.empty();
			target.append("<img src='../static/images/pleasewait.gif'/>");

            var action = parseInt($("#actions option:selected").data("status"),10);
            var actionName = $("#actions").val();

			var form = $("#validation-form");
			$("#validation-form").removeData("validator");
			validate.rules = rulesSaveAndEnd;
			validate.messages = messagesSaveAndEnd;
			
			form.validate(validate);
			
			if ( self.prospectoIncompleto && actionName !== 'a_cerrado_sin_vta' ) {
				$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text: 'Por favor complete los datos del prospecto',
					class_name: 'gritter-warning'
				});
				Util.unBlockBody();
				target.empty();
				return false;
			}

			if(!form.valid()){
				$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
					text: 'Por favor ingrese los datos necesarios',
					class_name: 'gritter-warning'
				});
				Util.unBlockBody();
				target.empty();
				return false;
			}
			
			//validar data

			//CONSTRUYO EL OBJECTO A GRABAR
			var generico = this.buildObject(form);
			tasks = InboxService.getTaskById(generico.task.id);

			if (tasks && tasks.end == null){

				//LLAMO AL SERVICIO DE GRABACION DEL LLAMADO
				var processInstance;
	
				

				FuseService.actualizarProceso(
					generico,
					true,
					function(data) {
						var actionDescription = 'terminó la tarea ' +generico.task.name+' del proceso';
						MessagesService.sendNotificationsTask(generico.process.id, actionDescription);
						//GRABO EN EL MURO
						var body =  generico.observacion;
						var subject = "Salvar tarea";
						var processId = generico.process.id;
						var userName = Session.getLocal('userName');
						var recipientsArray = [];recipientsArray.push(processId);
						MessagesService.sendMessage(subject,body,processId,userName,recipientsArray);
						
						var tasks = InboxService.getTaskByProccessId(generico.process.id);
						tasks = Util.sortDescByKey(tasks, 'id');
						InboxService.assignTaskAsync(tasks[0].id, self.actorId, false, function(){}, function(){}, function(){});
						
						if ( ProspectoUtil.isUserAsesorByRol() && generico.process.action !== "a_cerrado_sin_vta") {
							var tasks = InboxService.getTaskByProccessId(generico.process.id);
							var task = tasks[tasks.length - 1];
							var taskId = task.id;
							Session.setLocal('tasks', JSON.stringify([taskId.toString()]));
						} else {
							Session.setLocal('tasks', JSON.stringify([]));
						}
	
						Util.unBlockBody();
						target.empty();
	
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

			} else {
				Backbone.history.navigate('error', { trigger : true });
				$("#content1").empty ();
				var compiledTemplate = Handlebars.compile(taskNotFoundTemplate);
				$("#content1").html (compiledTemplate());
			}
		},


		list: function (taskId,processId){
			var self = this;
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
					self.getMotivosRechazo(function(motivosResult) {
                        motivos = motivosResult;
                    });
					var successFunctionSucursales = function(data) { self.sucursales = data; self.arraySort(self.sucursales, 'detalle'); };
					SubsidiariesService.getSubsidiaries(false, successFunctionSucursales, function(){/* error function*/}, function(){/* complete function*/});
					$("#content1").empty ();
					$("#content1").append (this.render (id,motive,userId,finalize,submotive,tasks,finalize,hasSubmotive,workcontext,processNameJBPM, processDetail,workflowId).el);

					var prospectosDetailView = '../../form-prospectos/js/libs/framework/views/prospectos/prospectosDetailView';

					require([prospectosDetailView],function(View){
						var target = $('#entityDetail');
						var view = new View();
						view.list(processesDetail[0], target);
						prospecto = view.getProspecto();
						self.viewEditProspecto();
						self.prospectoIncompleto = ProspectoUtil.isIncompleteProspectoF( prospecto );
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
	                    controladorArchivos.cargarArchivosPorBusinessKey(processDetail.id_VentaPura);
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

		getMotivosRechazo: function(onSuccess) {
			$.ajax({
				url: 'motivosRechazo.json?date='+new Date(),
				type:'GET',
				async: false,
				success:function (data) {
				   	motivos = eval( data );
				   	if (onSuccess) {
				   		onSuccess(motivos);
				   	}
				},
			    error: function( xhr,err ) {
			        Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			    }
			});
		},

		getAseguradora: function(processesDetail) {
			$.ajax({
				type: "GET" ,
				url: "aseguradoras.json?date="+new Date().getTime(),
				async: false,
				success : function(data) {
					for(var pos = 0; pos < processesDetail.length; pos++) {
						if(processesDetail[pos].aseguradora_id) {
							for(var i = 0; i < data.length; i++) {
								if(data[i].id == processesDetail[pos].aseguradora_id) {
									processesDetail[pos].aseguradora_descripcion = data[i].name;
								}
							}
						}
					}
				},
				error : function(xhr, err) {
					Util.error('Sample of error data:', err);
					Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
				}
			});
		},

		// Render method.
		render: function (id,motive,userId,finalize,submotive,tasks,finalize,hasSubmotive,workcontext,processNameJBPM,processDetail, workflowId){
			var self = this;
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
				processDetail: processDetail, workflowId: workflowId, sucursales: self.sucursales, motivos: motivos}));

			return this;
		},
		
		viewEditProspecto : function() {
			Util.debug("editbutton", "prospecto", prospecto);
			var url;
			if (Util.hasRole("SGI_SUPERVISOR_FFVV")) {
				url = SettingsModel.get("url_show_prospecto") + ProspectoUtil.composeProspectoPk(prospecto.pk);
			} else {
				url = SettingsModel.get("url_edit_prospecto") + ProspectoUtil.composeProspectoPk(prospecto.pk) + '/' + processNameJBPM;
			}
			Util.debug("url",url);
			$("#abmPrspectoIframe").attr('src', url);
			$("#abmPrspectoIframe").height($(window).height() - 180);
		},

		habilitarPorEstado: function (e) {
			var ventaEstado = $("#actions option:selected").attr("id");

			if(ventaEstado === "action-2"){
				$("#divVentaMotivo").show();
			}else{
				$("#ventaMotivo").val("");
				$("#divVentaMotivo").hide();
			}
		},
		
		arraySort: function( array, prop ) {
			array.sort(function SortByName(a, b){
				  var aName = a[prop].toLowerCase();
				  var bName = b[prop].toLowerCase(); 
				  return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
			});
		},
		
		arrayLookup: function (array, prop, val) {
		    for (var i = 0, len = array.length; i < len; i++) {
		        if (array[i].hasOwnProperty(prop) && array[i][prop] === val) {
		            return array[i];
		        }
		    }
		    return null;
		},

	});

	return newView;
});