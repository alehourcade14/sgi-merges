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
         'text!libs/framework/templates/app/formShowTemplate.html',
         'text!libs/framework/templates/app/taskDetailTemplate.html',
         'text!libs/framework/templates/app/taskDetailIntegrantesTemplate.html',
         'text!libs/framework/templates/app/taskDetailPlanesTemplate.html',
         'text!libs/framework/templates/app/entityDetailTemplate.html',
         'text!libs/framework/templates/app/taskNotFoundTemplate.html',
		 'session',
		 '/form-smg-commons/js/libs/services/fuseService.js',
		 '/form-smg-commons/js/libs/services/obraSocialService.js',
		 '/form-smg-commons/js/libs/services/cotizacionesService.js',
		 '/form-smg-commons/js/libs/services/prospectoService.js',
		 '/form-smg-commons/js/libs/services/inboxService.js',
		 'text!/form-cotizaciones-individuales/process.json',
], function ($, _, Backbone, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, 
	formShowTemplate, taskDetailTemplate, taskDetailIntegrantesTemplate, taskDetailPlanesTemplate, 
	entityDetailTemplate, taskNotFoundTemplate, Session, FuseService, ObraSocialService, CotizacionesService, ProspectoService, InboxService, ProcessJson){

	var historialLlamadoPDF;
	var processesDetail;
	var motive;
	var idProcess;
	var prospecto;
	var processDetail;
	var processesDetail;
	var integrantes;
	var cotizacionSeleccionada;
	     	
	function getStatus(motivo,finalizado) {

		var estado = {
		    id: null,
		    descripcion: null
		};
		
		return estado;
	}
	
    var newView = Backbone.View.extend ({
    	
		events: {
			'click 		#btnCloseTask'					: 'closeTask',
			'click 		#btnPrintTask'					: 'printTask'		
		},
		
		printTask: function () {
			var self = this;
			var doc = new jsPDF();
			
			numeral.language('es', {
			    delimiters: {
		            thousands: '.',
		            decimal: ','
		        },
		        abbreviations: {
		            thousand: 'k',
		            million: 'mm',
		            billion: 'b',
		            trillion: 't'
		        },
		        ordinal: function (number) {
		            var b = number % 10;
		            return (b === 1 || b === 3) ? 'er' :
		                (b === 2) ? 'do' :
		                (b === 7 || b === 0) ? 'mo' : 
				(b === 8) ? 'vo' :
				(b === 9) ? 'no' : 'to';
		        },
		        currency: {
		            symbol: '$'
		        }
			});
			
		
			numeral.language('es');
			
			doc.setFontSize(8);
			doc.text(10, 8, 'PROCESO '+motive.toUpperCase() + " #" +idProcess);
			var pos = 12;
            
			// Filled red square
			doc.setDrawColor(0);
			doc.setFillColor(96,96,96);
			doc.rect(10, pos, 190, 6, 'F'); 
			
			pos = pos + 5;
			
			doc.setFontSize(9);
			doc.setTextColor(255,255,255);
			doc.text(20, pos, "DATOS DEL PROSPECTO");
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
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Apellido y Nombre:");
			doc.text(55, pos+5, prospecto.apellido + ", " + prospecto.nombre);
			doc.text(120, pos+5, "DU:");
			doc.text(155, pos+5, prospecto.docNum.toString());
			
			pos= pos+6;							
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Dirección:");
			doc.text(55, pos+5, prospecto.domicilio.calle);
			doc.text(120, pos+5, "Nro.:");
			doc.text(155, pos+5, prospecto.domicilio.nro.toString());
			
			pos= pos+6;
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Pais:");
			doc.text(55, pos+5, prospecto.domicilio.pais);
			doc.text(120, pos+5, "Provincia:");
			doc.text(155, pos+5, prospecto.domicilio.provincia);
			
			pos= pos+6;
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Localidad:");
			doc.text(55, pos+5, prospecto.domicilio.localidad);
			doc.text(120, pos+5, "Partido:");
			doc.text(155, pos+5, prospecto.domicilio.partido);
			
			pos= pos+6;
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Barrio:");
			doc.text(55, pos+5, prospecto.domicilio.barrio ? prospecto.domicilio.barrio : "");
			doc.text(120, pos+5, "Código Postal:");
			doc.text(155, pos+5, prospecto.domicilio.cp? prospecto.domicilio.cp : "");
			
			pos= pos+6;
			
			if(dark){
			   doc.setFillColor(200,200,200);
			   dark = false;   
			}else{
			   doc.setFillColor(217,217,217);
			   dark = true;   
			}
			
			doc.rect(10, pos, 190, 6, 'F');
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Teléfono:");
			doc.text(55, pos+5, prospecto.telefonos[0].codigo_pais + " - " + prospecto.telefonos[0].codigo_nacional +" - "+ prospecto.telefonos[0].numero);
			doc.text(120, pos+5, "Email:");
			doc.text(155, pos+5, prospecto.emails[0].denominacion);
			
			pos= pos+6;				

			doc.setFillColor(255,255,255);
			doc.rect(10, pos, 190, 6, 'F');
			
			pos= pos+6;
            
			var prettyDate;
			var d = new Date(processDetail.alta_fecha);
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
			doc.setFillColor(96,96,96);
			doc.rect(10, pos, 190, 6, 'F'); 
			
			pos = pos + 5;
			
			doc.setFontSize(9);
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
			
			doc.setFontSize(8);
			
			doc.setTextColor(0,0,0);
			doc.text(20, pos+5, "Registrado por:");
			doc.text(55, pos+5, processDetail.VtaPura_usuario);
			doc.text(120, pos+5, "Sucursal:");
			doc.text(155, pos+5, processDetail.VtaPura_sucursal);
			
			pos= pos+6;				

			doc.setFillColor(255,255,255);
			doc.rect(10, pos, 190, 6, 'F');
			
			pos= pos+6;
            
			if(pos > 240){
			  doc.addPage();
              pos = 10;
			}

			// Filled red square
			doc.setDrawColor(0);
			doc.setFillColor(96,96,96);
			doc.rect(10, pos, 190, 6, 'F'); 
			
			doc.setFontSize(9);
			doc.setTextColor(255,255,255);
			doc.text(20, pos+5, "Individuo");
			doc.text(55, pos+5, "Sexo");
			doc.text(75, pos+5, "Edad");
			doc.text(100, pos+5, "Condición");
			doc.text(165, pos+5, "Remuneración");
			doc.setTextColor(255,255,255);
			doc.setTextColor(255,255,255);
			
			pos= pos +6;
			var integrantes = self.integrantes;							
            for (var i = 0; i < integrantes.length; i++) {
            	if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.rect(10, pos, 190, 6, 'F');
				
				doc.setFontSize(8);
				
				doc.setTextColor(0,0,0);
				doc.text(20, pos+5, integrantes[i].DENO_PAREN);
				doc.text(55, pos+5, integrantes[i].SEXO);
				doc.text(75, pos+5, integrantes[i].EDAD.toString());
				doc.text(100, pos+5, integrantes[i].ID_CONDICION ? integrantes[i].DESC_OS : "Directo");
				doc.text(165, pos+5, integrantes[i].REMUNERACION !== 0 ? integrantes[i].REMUNERACION.toString() : "");
				
				pos= pos +6;
            }
            
            if(processDetail.VtaPura_estado !== 2){
	            if(pos > 240){
				  doc.addPage();
	              pos = 10;
				}else{
					doc.setFillColor(255,255,255);
					doc.rect(10, pos, 190, 6, 'F');
					pos= pos+6;
				}
	
				doc.setDrawColor(0);
				doc.setFillColor(96,96,96);
				doc.rect(10, pos, 190, 6, 'F'); 
				
				doc.setFontSize(9);
				doc.setTextColor(255,255,255);
				
				doc.text(20, pos+5, "Plan Vendido");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, cotizacionSeleccionada[i].PLAN_OS);	
							}
						}else{
							doc.text(column, pos+5, cotizacionSeleccionada[i].PLAN_OS);
						}
					}
					column = column + 20;
				}
				
				doc.setTextColor(255,255,255);
				doc.setTextColor(255,255,255);
				
				pos= pos +6;
	
				//AGREGO UN NUEVO REGISTRO DE PLANES
				var dark = true;
				var format = '0,0.00';
				
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "Valor Detalle");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].VALOR_TOTAL).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].VALOR_TOTAL).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "Familiar a Cargo");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].VALOR_FLIAR_CARGO).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].VALOR_FLIAR_CARGO).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "Valor Total Plan");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION != 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].APORTES_DESC).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].APORTES_DESC).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "Aportes a Descontar");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].TOTAL).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].TOTAL).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				
				if(dark){
				   doc.setFillColor(200,200,200);
				   dark = false;   
				}else{
				   doc.setFillColor(217,217,217);
				   dark = true;   
				}
				
				doc.setTextColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F');
							
				doc.text(20, pos+5, "IVA");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].IVA).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].IVA).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
				
				
				//AGREGO UN NUEVO REGISTRO DE PLANES
				doc.setDrawColor(0);
				doc.setFillColor(0,0,0);
				doc.rect(10, pos, 190, 6, 'F'); 
				
				doc.setFontSize(9);
				doc.setTextColor(255,255,255);
										
				doc.text(20, pos+5, "Total a Pagar");	
				
				var column = 60;
				
				for (var i = 0; i < cotizacionSeleccionada.length; i++) {
					
					if (cotizacionSeleccionada[i].COMPOSICION !== 'FAMILIAR A CARGO'){
						if(processDetail.VtaPura_plan != null){
							if(cotizacionSeleccionada[i].PLAN_OS === processDetail.VtaPura_plan){
								doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].TOTAL_A_COBRAR).format(format));	
							}
						}else{
							doc.text(column, pos+5, numeral(cotizacionSeleccionada[i].TOTAL_A_COBRAR).format(format));
						}
					}
					column = column + 20;
				}
				pos= pos +6;
            	
            }
			
            historialLlamadoPDF = doc.output('datauristring');

            $("#modal-form-show").modal("show");
            $('#iframeShow').attr('src', historialLlamadoPDF);

            var elemToChange = document.getElementById("iframeShow");
            elemToChange.style.height = $(window).height() - 200 + "px";     
		},
		
		closeTask: function () {
			window.top.location.href= SettingsModel.get("open_task");
		},

		getIntegrantes: function (){
			var self = this;
			
			for (var i = 0; i < processesDetail.length; i++) {
				
				if(processesDetail[i].id_cotizacion){
					CotizacionesService.getIntegrantes(processesDetail[i].id_cotizacion,
						function (data) {
							var compiledTemplate = Handlebars.compile(taskDetailIntegrantesTemplate);
							$("#cotizacionIntegrante"+processesDetail[i].id_Etapa).empty ();
							$.each(self.obrasSociales, function (index, obraSocial) {
								$.each(data, function (index, integrante) {
									if (obraSocial.codigoSSSalud == integrante.ID_CONDICION) {
										integrante.DESC_OS = obraSocial.sigla ? obraSocial.sigla : obraSocial.descripcion;
									}
								});
							});
							self.integrantes = data;
							$("#cotizacionIntegrante"+processesDetail[i].id_Etapa).append (compiledTemplate({integrantes: data}));
						},
						function (xhr, err) {
							Util.error('Sample of error data:', err);
							Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						},
						function () {
						}
					);
				}
				
			}
		},
		
		
		getCotizaciones: function() {
			for (var i = 0; i < processesDetail.length; i++) {		
				CotizacionesService.getCotizacion(processesDetail[i].id_cotizacion,
					function (cotizaciones) {
						var compiledTemplate = Handlebars.compile(taskDetailPlanesTemplate);

						var coti1, coti2;

						for (var i = 0; i < cotizaciones.length; i++) {
							coti1 = cotizaciones[i];
							coti1.VALOR_FLIAR_CARGO = 0;
							for (var j = i+1; j < cotizaciones.length; j++) {
								coti2 = cotizaciones[j];
								if (coti1.PLAN_OS === coti2.PLAN_OS) {
									coti1.IVA = coti1.IVA + coti2.IVA;
									if (coti2.COMPOSICION === "FAMILIAR A CARGO") {
										coti1.VALOR_FLIAR_CARGO += coti2.VALOR_TOTAL;
									}
									cotizaciones.splice(j,1);
									j--;
								}
							}
							coti1.TOTAL_A_COBRAR = parseFloat(coti1.VALOR_TOTAL) + parseFloat(coti1.VALOR_FLIAR_CARGO) + parseFloat(coti1.IVA) - parseFloat(coti1.APORTES_DESC);
						}
						
						$("#cotizacionPlanes"+processesDetail[i].id_Etapa).empty ();
						$("#cotizacionPlanes"+processesDetail[i].id_Etapa).append (compiledTemplate({cotizaciones: cotizaciones, vtaPuraPlan: processesDetail[i].VtaPura_plan}));

					},
					function (xhr, err) {
					},
					function (data) { }
				);				
			}
		},

		buscarObrasSociales : function() {
			var listado, i = 0;
			var osociales = ['OSPOCE', 'OSSEG', 'OSCEP', 'OSPADEP', 'OSDAAP', 'OSDO', 'OSSDEB', 'ASE', 'OSDEPYM', 'OSPREME', 'OSIM', 'OSEDEIV', 'OSTVLA']; 
			var obrasSociales = [];


			var success = function(data) {
				listado = eval(data);

				for (i; i < listado.resultadoBusqueda.obrasSociales.length; i++) {
					for (var j = 0; j < osociales.length; j++) {
						if (listado.resultadoBusqueda.obrasSociales[i].sigla === osociales[j]) {
							obrasSociales.push(listado.resultadoBusqueda.obrasSociales[i]);
						}
					}
				}
			}

			var error = function(xhr, err) {
				encontrado = false;
				Util.error('Sample of error data:', err);
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			}


			ObraSocialService.getObrasSociales(
				success, 
				error, 
				function(){}, 
				false
			);

			return obrasSociales;
		},

		list: function (taskId,processId){

			var self= this;
			var processTypes;
			var id;			
			var encontrado = false;
			var finalize,submotive = false;
			var tasks = null;
			var process = null;
			processDetail;
			var bussinessKey;
			
			idProcess = processId;
						
			var userId = Session.getLocal("userId");
			taskId = parseInt(taskId,10);

			self.obrasSociales = this.buscarObrasSociales();

			process =InboxService.getProcess(processId,function(){});
			bussinessKey = process.key;

			Util.debug("PROCESS",process,bussinessKey);

			try {
				var data = JSON.parse(ProcessJson);
				processTypes = eval(data);
				for (var i=0;i<processTypes.length;i++){
					
					if(processTypes[i].processNameJBPM === process.processName){
						encontrado = true;
						id = processTypes[i].id;
						motive = processTypes[i].processName;
						var allTasks = processTypes[i].tasks;
						break;
					}
				}
			} catch (e) {
				Util.error("Error al intentar recuperar el archivo process.json");
				Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			    Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			}

			FuseService.getDetallePorProcessIdSMMP(
				processId,
				false,
				function(data) {
					processesDetail = data;
					processDetail = processesDetail[processesDetail.length-1];
					Util.debug("processDetail", processDetail);
				},
			    function( xhr,err ) {
			    	encontrado = false;
			        Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			        Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
			    }
			);


			if(encontrado){
				
				var userId = Session.getLocal('userId');
	        	$("#content1").empty ();
	          	$("#content1").append (this.render (id,motive,userId,finalize,submotive,tasks,process).el);
				
				if(processDetail.id_cotizacion){

					CotizacionesService.getIntegrantes(processDetail.id_cotizacion,
						function (data) {
							
							integrantes = data;
							
							CotizacionesService.getCotizacion(processDetail.id_cotizacion,
								function (cotizaciones) {
									
									cotizacionSeleccionada = cotizaciones;
									
									var coti1, coti2;

									for (var i = 0; i < cotizaciones.length; i++) {
										coti1 = cotizaciones[i];
										coti1.VALOR_FLIAR_CARGO = 0;
										for (var j = i+1; j < cotizaciones.length; j++) {
											coti2 = cotizaciones[j];
											if (coti1.PLAN_OS === coti2.PLAN_OS) {
												coti1.IVA = coti1.IVA + coti2.IVA;
												if (coti2.COMPOSICION === "FAMILIAR A CARGO") {
													coti1.VALOR_FLIAR_CARGO += coti2.VALOR_TOTAL;
												}
												cotizaciones.splice(j,1);
												j--;
											}
										}
										coti1.TOTAL_A_COBRAR = parseFloat(coti1.VALOR_TOTAL) + parseFloat(coti1.VALOR_FLIAR_CARGO) + parseFloat(coti1.IVA) - parseFloat(coti1.APORTES_DESC);
									}
									
									var compiledTemplate = Handlebars.compile(taskDetailTemplate);
									processDetail.integrantes = integrantes; 
									processDetail.cotizaciones = cotizaciones; 
									
									$("#processDetail").empty ();
									$("#processDetail").append (compiledTemplate({
										tasks: tasks,
										process: process, 
										processesDetail: processesDetail.reverse(),
										processDetail: processDetail,
										editable: false
									}));
									
									self.getIntegrantes();
									self.getCotizaciones();

									ProspectoService.getProspectoByIncBajas(processDetail.id_prosp,processDetail.id_tipo_pros,processDetail.pro_version,true,
										function (data) {
											prospecto = data;
											Util.debug("prospecto", prospecto);
											var compiledTemplate = Handlebars.compile(entityDetailTemplate);
											$("#entityDetail").empty().append(compiledTemplate({prospecto: prospecto}));
										},
										function (xhr, err) {
											encontrado = false;
											Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
											Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
										},
										function () {
										}
									);
								},
								function (xhr, err) {
									Util.error('Sample of error data:', err);
									Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
								},
								function (data) { }
							);

							
						},
						function (xhr, err) {
							Util.error('Sample of error data:', err);
							Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						},
						function () {
						}
					);

				}else{
					var compiledTemplate = Handlebars.compile(taskDetailTemplate);
					$("#processDetail").empty ();
					$("#processDetail").append (compiledTemplate({
						tasks: tasks,
						process: process, 
						processesDetail: processesDetail.reverse(),
						processDetail: processDetail,
						editable: false
					}));

					ProspectoService.getProspectoByIncBajas(processDetail.id_prosp,processDetail.id_tipo_pros,processDetail.pro_version,true,
						function (data) {
							prospecto = data;
							Util.debug("prospecto", prospecto);
							var compiledTemplate = Handlebars.compile(entityDetailTemplate);
							$("#entityDetail").empty().append(compiledTemplate({prospecto: prospecto}));
						},
						function (xhr, err) {
							encontrado = false;
							Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
							Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
						},
						function () {
						}
					)
				}
			}else{
				Backbone.history.navigate('error', { trigger : true });
		      	$("#content1").empty ();
				var compiledTemplate = Handlebars.compile(taskNotFoundTemplate);
				$("#content1").html (compiledTemplate());
			}
			
       	},
       
		 // Render method.
        render: function (id,motive,userId,finalize,submotive,tasks,process){
        	var compiledTemplate = Handlebars.compile(formShowTemplate);

			var entorno = SettingsModel.get("entorno");
			var userName = Session.getLocal("userName");
			var userId = Session.getLocal("userId");
			var subsidiary = Session.getLocal("subsidiary");
			var subsidiaryId = Session.getLocal("subsidiaryId");
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
	      	finalize: finalize, submotive: submotive, tasks: tasks, process: process}));
	      	
			return this;
       	}
		
    });
    
    return newView;
});