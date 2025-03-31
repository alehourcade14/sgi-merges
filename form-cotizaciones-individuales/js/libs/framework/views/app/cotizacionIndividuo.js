define ([
         'jquery',
         'underscore',
         'backbone',
         'handlebars',
         'util',
         '/form-cotizaciones-individuales/js/libs/util.js',
         'libs/settings',
         'libs/framework/views/commons/alertErrorView',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/cotizacionIndividuoTemplate.html',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/cotizacionIndividuo.html',
         'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/listPlanesTemplate.html',
		 'session',
		 '/form-smg-commons/js/libs/services/terinService.js',
		 '/form-smg-commons/js/libs/services/configuracionTextService.js',
		 'text!/form-cotizaciones-individuales/imagenCotizacion.json'
], function ($,
			_, 
			Backbone, 
			Handlebars,
			Util,
			CotizacionUtil,
			SettingsModel, 
			AlertErrorView,
			cotizacionIndividuoTemplate,
			cotizacionIndividuoForm,
			listPlanesTemplate,
			Session,
			TerinService, 
			ConfiguracionTextService,
			ImagenCotizacion){

	var jsonObrasSociales = "sgi.form.obras.sociales.nombres.list";
	var validate  = {
            errorElement: 'span',
            errorClass: 'help-inline',
            focusInvalid: false,
            rules: {},
    		messages: {},
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
      
	var validatorSolicitarCotizacion = [{
		rules: {
			'reserva[solicitudCotizacion][zona][id]': {
				required: true
			},
			'reserva[solicitudCotizacion][productoSmg][id]': {
				required: true
			},
			'individuos-errors': {
				validateIndividuosFilled: true
			}
		}, 
		messages: {
			'reserva[solicitudCotizacion][zona][id]': {
				required: "Debe seleccionar la zona del prospecto"
			},
			'reserva[solicitudCotizacion][productoSmg][id]': {
				required: "Debe seleccionar el Producto SMG"
			},
			'individuos-errors': {
				validateIndividuosFilled: "Debe completar todas las filas del Grupo Familiar"
			}
		}
	},null,null,null];

     
	
	function pad (str, max) {
	  return str.length < max ? pad("0" + str, max) : str;
	}
	
		     	
	// Create the view object.
    var cotizacionIndividuoView = Backbone.View.extend ({
    			
    	events: {
    		'click 		#btnCloseTask'					: 'closeTask',
    		'click		.span-nuevo-individuo'			: 'addNewRowCotizacion',
			'change		select[name*="obraSocial"]'		: 'obraSocialChange',
			'click		#btnCotizarIndividuo'			: 'cotizarIndividuo',
			'change		#slZonas'						: 'zonasChanged',
			'click 		#btnConfirmarCotizacion' 		: 'confirmarCotizacion',
			'click		#btnExportarPDF'				: 'exportarPDF'
		},
		
		
exportarPDF: function() {
			
			this.generatePDF(true);
			
		},
		
		generatePDF: function (download) {
			var doc = new jsPDF('l', 'pt', 'a4');
			
			var specialElementHandlers = {
				'#editor': function(element, renderer){
					return true;
				}
			};

			try{
				var data =  JSON.parse(ImagenCotizacion);
				var logo = data.logo;
			} catch (e) {   
				Util.error("Error al intentar recuperar el archivo imagenCotizacion.json");
				return;
			}
				
			doc.addImage(logo, 'JPEG', 700, 10, 120, 60);
			
			doc.setFontType("bold");
			doc.setFontSize("12");
			doc.text(100, 100, 'Cotización Individuo');
			
			doc.setFontType("italic");
			doc.setFontSize("10");
			doc.text(100, 350, '* Los Datos exhibidos en el siguiente reporte son una aproximación de los valores finales, pueden variar por ajuste de precios o dependiendo de la fidelidad de ');
			doc.text(100, 360, 'los datos brindados al Cotizador.');
			doc.text(100, 380, '* Los precios mencionados corresponden a la fecha de: ' + Util.prettifyDate(new Date().getTime()), 0, 90);
			
			doc.fromHTML( $('#ciCotizacionesModal div .nopadding').get(0), 
					100, 
					150, 
					{
                	//'width': 7.5,
                	'elementHandlers': specialElementHandlers
					}
			);
			
			if (download) {
				doc.save('Cotizacion-Individuo.pdf');
			}

			return doc.output('blob');
			
		},
		
		
		closeTask: function () {
			window.top.location.reload();
		},
		
		loadZonas: function (attr){
			
			$.ajax({
				url: SettingsModel.get('cotizaciones_prospecto_rest_api_url')+'/zona/1?date='+new Date().getTime(),
				type:'GET',
				async: false,
				success:function (data) {
					attr.zonas = eval(data.zona);
				},
				error: function(data) {
					Util.error(data);
				}
			});
		},	
		
		loadProductosSMG: function (attr){
			
			$.ajax({
				url: SettingsModel.get('productos_smg_rest_api_url')+'?date='+new Date().getTime(),
				type:'GET',
				async: false,
				success:function (data) {
					attr.productosSMG = eval(data.productoSmg);
				},
				error: function(data) {
					Util.error(data);
				}
			});
		},	
		
		loadParentescos: function (attr){
			var parentescos;
			$.ajax({
				url: "../staticJson/parentescos.json?date="+new Date().getTime(),
				type:'GET',
				async: false,
				success:function (data) {
					parentescos = data;
				},
				error: function(data) {
					Util.error(data);
				}
			});
		},
		
		setTitular: function (attributes) {
			var parentescos;
			if ( parentescos && parentescos.length ) {
				var i=0;
				while ( i < parentescos.length && parentescos[i].codigo !== 'T' ) {
					i++;
				}
				
				if ( i < parentescos.length ) {
					attributes.titular = parentescos[i];
				}
			}
		},
		
		loadObrasSociales: function (attr){

			var obrassociales = ConfiguracionTextService.getConfiguracionText(jsonObrasSociales);
				if(!Util.isEmpty(obrassociales)){
					attr.obrasSociales = JSON.parse(obrassociales.propertyValue);
				}
				else {
					Util.error( 'No se encontró property con name ' + jsonObrasSociales);
				}
		},
		
		
		obraSocialChange: function (event) {
			
			var self = this;
			var target = $(event.target).attr("name").replace(/\[obraSocial\]\[id\]/, "[remuneracionBruta]");
			if ( $(event.target).val() === "-1" || $(event.target).val() === "") {//Directo
				$("input[name='"+target+"']").attr("disabled", "disabled");
				$("input[name='"+target+"']").val("");
			} else {
				$("input[name='"+target+"']").removeAttr("disabled");
			}
		},
		
		
		addNewRowCotizacion: function () {
			var self = this;

			Util.blockBody();
			var target = $("#toolbarLogin");
			target.html("<img src='../static/images/pleasewait.gif'/>");
			
			//userId me indica la cantidad de selects de parentesco que ya existen
			var userId = $("select[userId]").length;
			
			$("#dvGrupoFliar").append( "<div class=\"control-group span3\"><div class=\"controls\"><div class=\"span6 parentesco\"></div></div></div>" );
			$("#dvGrupoFliar").append( "<div class=\"control-group span1\"><div class=\"controls edad\"></div></div>" );
			$("#dvGrupoFliar").append( "<div class=\"control-group span3\"><div class=\"controls \"><div class=\"span6 condicion\"></div></div></div>" );
			$("#dvGrupoFliar").append( "<div class=\"control-group span2\"><div class=\"controls \"><div class=\"span12 remuneracion\"></div></div></div>" );
			
			var clonedSelect = $("#slParentescos").clone();
			$("#txtRemuneracion").clone().removeAttr("id").attr("name", "reserva[solicitudCotizacion][individuos]["+ userId +"][remuneracionBruta]")
			.attr("disabled", "disabled").appendTo(".remuneracion").val("");
			if ( userId === 1 ) {
				
				clonedSelect.append(self.getParentescoOptions()).removeAttr("id").attr("name", "reserva[solicitudCotizacion][individuos]["+ userId +"][parentesco]").appendTo(".parentesco").find('option[value="T"]').remove();
				clonedSelect.on("change", self.slPareChanged);
				$("#slCondiciones").clone().removeAttr("id").attr("name", "reserva[solicitudCotizacion][individuos]["+ userId +"][obraSocial][id]").appendTo(".condicion");
			
			} else {
			
				clonedSelect.append(self.getParentescoOptions()).removeAttr("id").attr("name", "reserva[solicitudCotizacion][individuos]["+ userId +"][parentesco]").appendTo(".parentesco");
				clonedSelect.find('option[value="T"]').remove()
				clonedSelect.find('option[value="E"]').remove();
				
				$("#slCondiciones").clone().removeAttr("id").attr("name", "reserva[solicitudCotizacion][individuos]["+ userId +"][obraSocial][id]")
					.attr("disabled", "disabled").appendTo(".condicion");
			}
			
			$("#txtEdad").clone().removeAttr("id").attr("name", "reserva[solicitudCotizacion][individuos]["+ userId +"][edad]").appendTo(".edad").val("");
			
			
			$("div .parentesco").removeClass("parentesco");
			$("div .edad").removeClass("edad");
			$("div .condicion").removeClass("condicion");
			$("div .remuneracion").removeClass("remuneracion");
			
			Util.unBlockBody();
    		target.empty();
		},
		
		getParentescoOptions: function () {
			
			var options = '';
			if ( parentescos ) {
				for ( var i=0; i<parentescos.length; i++ ) {
					options += '<option value="'+parentescos[i].codigo+'">'+parentescos[i].descripcion+'</option>';
				}
			}
			
			return options;
		},
		
		
		/**
		 * Este handler es solo para el select de parentescos de la 2da fila unicamente.
		 */
		slPareChanged: function (event) {
			var targetRemuneracion = $(event.target).attr("name").replace(/\[parentesco\]/, "[remuneracionBruta]");
			var targetObra = $(event.target).attr("name").replace(/\[parentesco\]/, "[obraSocial][id]");
			if (!$(event.target).val() || $(event.target).val() === "E") {
				$("input[name='"+targetRemuneracion+"']").removeAttr("disabled");
				$("select[name='"+targetObra+"']").removeAttr("disabled");
			} else {
				$("input[name='"+targetRemuneracion+"']").attr("disabled", "disabled");
				$("input[name='"+targetRemuneracion+"']").val("");
				$("select[name='"+targetObra+"']").attr("disabled", "disabled");
				$("select[name='"+targetObra+"']").val("");
			}
		},
		
		zonasChanged: function (event) {
			
			/*if (event.target.value == '') {
				$('input[type=text]').attr("disabled", "disabled");
				$("select").not("#slZonas").attr("disabled", "disabled");
				$("#spNuevoIndividuo").removeClass("span-nuevo-individuo");
			} else {*/
				//$("input[disabled]").not("#txtRemuneracion").removeAttr("disabled");
				$("select[disabled]").removeAttr("disabled");
				$("#spNuevoIndividuo").addClass("span-nuevo-individuo");
				$("#slZonas option[value='']").remove();
				$(this.el).off('change', '#slZonas');
			//}
			
		},
		
		cotizarIndividuo: function () {
			
			var self = this;
			var target = $("#toolbarLogin");
			var start = new Date().getTime();
			
			Util.blockBody();
			
			target.html("<img src='../static/images/pleasewait.gif'/>");
		
			var form = $("#validation-form");
			var settings = form.validate(validate).settings;
			
			settings.rules = {};
			settings.messages = {};
			
			self.beforeValidateSolicitarCotizacion(settings);
			
			if ( !form.valid() ) {
				self.onValidationFailure();
				target.empty();
			} else {
				var generico = form.serializeObject();
				self.afterBuildObjectSolicitarCotizacion(generico);
				var solicitudCotizacion = generico.reserva.solicitudCotizacion;
				
				var urlPutCall = SettingsModel.get("cotizaciones_prospecto_rest_api_url")+'/cotizar-individuo-menu';
				$.ajax({
					url : urlPutCall,
					data : JSON.stringify({"solicitudCotizacion" : solicitudCotizacion}),
					contentType : "application/json; charset=UTF-8",
					accept : "application/json; charset=UTF-8",
					cacheControl : "no-cache",
					type : 'POST',
					async : true,
					success : function(data) {
						
						var template = Handlebars.compile(listPlanesTemplate);
						$("#ciCotizacionesModal").html(template({cotizaciones: eval(data.cotizaciones)}));
						
						Util.unBlockBody();
				    	target.empty();
				    		
						$("#ciCotizacionesModal").modal("show");
					},
					error: function( xhr,err ) {
		        		
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
					}
				});
			}
		},
		
		
		confirmarCotizacion: function () {
		
			if ( $("input[name='reserva[solicitudCotizacion][email]']").val() ) {
				
				var reader = new window.FileReader();
				reader.readAsDataURL( this.generatePDF(false) ); 
				reader.onloadend = function() {
					var jsonMail = {"to": $("input[name='reserva[solicitudCotizacion][email]']").val(),
							"subject": "JSON de Prueba",
							"template": "Cotizacion_VA_VDP.html",
							"attachment": [
							               {
							            	   "name": "Cotizacion-Individuo.pdf",
							            	   "base64": reader.result
							               }
							               ]
					};
					TerinService.sendTerinMailWithTemplate(jsonMail, 
						function(data) {
							Util.debug("Envio PDF OK");
						}, function( xhr,err ) {
							Util.error( 'Envio PDF NOT OK:', err );
						},
						function () {
						}
					);

					TerinService.sendTerinMailWithTemplate(JSON.stringify(json),
						function(data) {
								Util.debug("Envio PDF OK");
						}, function( xhr,err ) {
							Util.error( 'Envio PDF NOT OK:', err );
						},
						function () {
						},
						false
					);
				}
			}
			
			$("#ciCotizacionesModal").modal("hide");
			this.closeTask();
		},

		beforeValidateSolicitarCotizacion: function(settings) {
			var self = this;

			for(var i = 0 ; i < validatorSolicitarCotizacion.length ; i ++) {
				if( validatorSolicitarCotizacion[i] != null ) {
					CotizacionUtil.copyAttributes(validatorSolicitarCotizacion[i].rules, settings.rules);
					CotizacionUtil.copyAttributes(validatorSolicitarCotizacion[i].messages, settings.messages);
				}
			}
			
			
			$.validator.addMethod("validateIndividuosFilled", function(value, elem, param) {
				return self.validateIndividuosFilled();
			});
		},
		
		afterSaveAndEndSolicitarCotizacion: function() {
			
			if ( $("input[name='reserva[solicitudCotizacion][email]']").val() ) {
				
				var reader = new window.FileReader();
				reader.readAsDataURL( this.generatePDF(false) ); 
				reader.onloadend = function() {
					var json = {"to": $("input[name='reserva[solicitudCotizacion][email]']").val(),
							"subject": "JSON de Prueba",
							"template": "Cotizacion_VA_VDP.html",
							"attachment": [
							               {
							            	   "name": "Cotizacion-Individuo.pdf",
							            	   "base64": reader.result
							               }
							               ]
					};
					
					TerinService.sendTerinMailWithTemplate(JSON.stringify(json),
						function(data) {
							Util.debug("Envio PDF OK");
						}, function( xhr,err ) {
							Util.error( 'Envio PDF NOT OK:', err );
						},
						function () {
						},
						false
					);
				}
			}
			
		},
		
		validateIndividuosFilled: function() {
			var self = this;
			var form =  $("#validation-form").serializeObject();
			
			if (!form.reserva.solicitudCotizacion.individuos || !form.reserva.solicitudCotizacion.individuos.length) {
				return false;
			}
			
			for(var i = 0 ; i < form.reserva.solicitudCotizacion.individuos.length ; i ++) {
				var individuo = form.reserva.solicitudCotizacion.individuos[i];
				if( !individuo.parentesco || !individuo.edad ) {
					return false;
				}
				
				if ( individuo.obraSocial && individuo.obraSocial.id && individuo.obraSocial.id !== "-1" && !individuo.remuneracionBruta ) {
					return false;
				}
			}
			
			return true;
		},
		
		afterBuildObjectSolicitarCotizacion: function(object) {
			if (object.reserva.solicitudCotizacion.individuos) {
				var i=0;
				var individuosArray = [];
				while (i < object.reserva.solicitudCotizacion.individuos.length) {
					
					var individuo = object.reserva.solicitudCotizacion.individuos[i];
					if (individuo.parentesco && individuo.edad) {
						individuosArray.push( individuo );
					}
					i++;
				}
				
				object.reserva.solicitudCotizacion.individuos = individuosArray;
			}
		},
		
		onValidationFailure: function() {
			$.gritter.add({
				title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci&#243;n',
				text: 'Por favor ingrese los datos necesarios',
				class_name: 'gritter-warning'
			});
			Util.unBlockBody();
		},
		
		list: function (){
			var attributes = {};
			
			this.loadZonas(attributes);
			this.loadProductosSMG(attributes);
			this.loadParentescos(attributes);
			this.setTitular(attributes);
			this.loadObrasSociales(attributes);
			
			
			$("#content1").empty();
          	$("#content1").append(this.render().el);
          	
          	var cotizacionForm = Handlebars.compile(cotizacionIndividuoForm);
          	$("#form-body").html(cotizacionForm(attributes));
		},
		
        render: function (){
        	
        	var compiledTemplate = Handlebars.compile(cotizacionIndividuoTemplate);
            this.$el.html (compiledTemplate());
            
            return this;
        }
      
    });
    
    // Return the view object.
    return cotizacionIndividuoView;
});