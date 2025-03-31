define ([
         'jquery',
	     'underscore',
	     'backbone',
	     'util',
		 'libs/framework/views/app/ventaRetail/paneles/panelContactar', //Wizard con etapas de contactar, cotizar y el detalle de la cotizacion
		 'libs/framework/views/app/ventaRetail/paneles/panelEntrevistar', //Wizard con etapas de contactar, cotizar
		 'libs/framework/views/app/ventaRetail/paneles/completarProspecto', //View de step 1
		 'libs/framework/views/app/ventaRetail/paneles/completarGrupoFamiliarView', //View de step 2
		 'libs/framework/views/app/ventaRetail/paneles/detalleCotizacionIndividuo', //View de step 3
], function ($, _, Backbone, Util, contactarView, entrevistarView, completarProspecto, completarGrupoFamiliarView, detalleCotizacion ) {

	var ViewConfiguration = Backbone.Model.extend ({
		
		viewsConfiguration: [
	        {
	            taskName: "Contactar",
	            panels: [contactarView, completarProspecto, completarGrupoFamiliarView, detalleCotizacion],
	            rules: {
	    			"process[action]": {
	    				required: true
					},
					'prospecto[nombre]': {
						required: true
					},
					'prospecto[apellido]': {
						required: true
					},
					'prospecto[docTipo]': {
						required: true
					},
					'prospecto[docNum]': {
						required: true
					},
					'prospecto[razonSocial]': {
						required: true
					},
					'prospecto[cuit]': {
						required: true
					},
					'prospecto[emails][princ][denominacion]': {
						email: true
					},
					'prospecto[emails][sec][denominacion]': {
						email: true
					},
					'prospecto[emails][generico][denominacion]': {
						email: true
					},
					'domicilio[provinciaId]': {
						required: {
							depends: function (element) {
								return !Util.hasRole('CRM_ATENCION_SUCURSAL')
							}
						},
					},
					'domicilio[partidoId]': {
						required: {
							depends: function (element) {
								return !Util.hasRole('CRM_ATENCION_SUCURSAL')
							}
						},
					},
					'domicilio[localidadId]': {
						required: {
							depends: function (element) {
								return !Util.hasRole('CRM_ATENCION_SUCURSAL')
							}
						},
					},
					'domicilio[calle]': {
						required: {
							depends: function (element) {
								return !Util.hasRole('CRM_ATENCION_SUCURSAL')
							}
						},
					},
					'domicilio[nro]': {
						required: {
							depends: function (element) {
								return !Util.hasRole('CRM_ATENCION_SUCURSAL')
							}
						},
					},
					'solicitudCotizacion[zona][id]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][parentesco]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][sexo]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][edad]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][tipo_doc]':{
						required: false
					},
					'solicitudCotizacion[grupoFamiliar][][num_doc]':{
						required: false
					},	
					'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][remuneracion]':{
						required: true
					},
					'ventaSalud[motivoNoVenta]':{
						required: true
					},
					'contacto':{
						required: false
					}
	    		},
	    		messages: {
	    			"process[action]" : {
	    				required : " "
					},
					'prospecto[nombre]': {
						required: "Ingrese el nombre."
					},
					'prospecto[apellido]': {
						required: "Ingrese el apellido."
					},
					'prospecto[docTipo]': {
						required: "Ingrese el tipo de documento."
					},
					'prospecto[docNum]': {
						required: "Ingrese el número de documento."
					},
					'prospecto[razonSocial]': {
						required: "Ingrese la Razón Social."
					},
					'prospecto[cuit]': {
						required: "Ingrese el CUIT."
					},
					'prospecto[emails][princ][denominacion]': {
						email:"Por favor ingrese un email válido."
					},
					'prospecto[emails][sec][denominacion]': {
						email:"Por favor ingrese un email válido."
					},
					'prospecto[emails][generico][denominacion]': {
						email:"Por favor ingrese un email válido."
					},
					'domicilio[provinciaId]': {
						required: "Ingrese la provincia."
					},
					'domicilio[partidoId]': {
						required: "Ingrese el partido."
					},
					'domicilio[localidadId]': {
						required: "Ingrese la localidad."
					},
					'domicilio[calle]': {
						required: "Ingrese la calle."
					},
					'domicilio[nro]': {
						required: "Ingrese el número."
					},
					'solicitudCotizacion[zona][id]':{
						required: "Ingrese la Zona."
					},
					'solicitudCotizacion[grupoFamiliar][][parentesco]':{
						required: "Ingrese el Tipo de Integrante."
					},
					'solicitudCotizacion[grupoFamiliar][][edad]':{
						required: "Ingrese la Edad."
					},
					'solicitudCotizacion[grupoFamiliar][][tipo_doc]':{
						required: "Ingrese la Fecha de Nacimiento."
					},	
					'solicitudCotizacion[grupoFamiliar][][num_doc]':{
						required: "Ingrese el Número de Documento"
					},
					'solicitudCotizacion[grupoFamiliar][][sexo]':{
						required: "Ingrese el Sexo."
					},
					'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
						required: "Ingrese la Condición de Afiliación."
					},
					'solicitudCotizacion[grupoFamiliar][][remuneracion]':{
						required: "Ingrese la Remuneración."
					},
					'ventaSalud[motivoNoVenta]':{
						required: "Ingrese un motivo."
					},
					'contacto':{
						required: "Ingrese el Contacto."
					}
	    		}
			},
			{
	            taskName: "Entrevistar",
	            panels: [entrevistarView, completarGrupoFamiliarView, detalleCotizacion],
	            rules: {
	    			"process[action]": {
	    				required: true
					},				
					'solicitudCotizacion[zona][id]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][parentesco]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][sexo]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][edad]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][tipo_doc]':{
						required: false
					},
					'solicitudCotizacion[grupoFamiliar][][num_doc]':{
						required: false
					},
					'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
						required: true
					},
					
					'ventaSalud[motivoNoVenta]':{
						required: true
					},
					'contacto':{
						required: true
					}
	    		},
	    		messages: {
	    			"process[action]" : {
	    				required : " "
					},
					'solicitudCotizacion[zona][id]':{
						required: "Ingrese la Zona."
					},
					'solicitudCotizacion[grupoFamiliar][][parentesco]':{
						required: "Ingrese el Tipo de Integrante."
					},
					'solicitudCotizacion[grupoFamiliar][][edad]':{
						required: "Ingrese la Edad."
					},
					'solicitudCotizacion[grupoFamiliar][][tipo_doc]':{
						required: "Ingrese la Fecha de Nacimiento."
					},
					'solicitudCotizacion[grupoFamiliar][][num_doc]':{
						required: "Ingrese el Número de Documento"
					},
					'solicitudCotizacion[grupoFamiliar][][sexo]':{
						required: "Ingrese el Sexo."
					},
					'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
						required: "Ingrese la Condición de Afiliación."
					},
					'ventaSalud[motivoNoVenta]':{
						required: "Ingrese un motivo."
					},
					'contacto':{
						required: "Ingrese el Contacto."
					}
	    		}
			},
			{
	            taskName: "Cerrar Venta",
	            panels: [entrevistarView, completarGrupoFamiliarView, detalleCotizacion],
	            rules: {
	    			"process[action]": {
	    				required: true
					},				
					'solicitudCotizacion[zona][id]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][parentesco]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][sexo]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][edad]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][tipo_doc]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][num_doc]':{
						required: true
					},
					'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
						required: true
					},
					'ventaSalud[motivoNoVenta]':{
						required: true
					}
	    		},
	    		messages: {
	    			"process[action]" : {
	    				required : " "
					},
					'solicitudCotizacion[zona][id]':{
						required: "Ingrese la Zona."
					},
					'solicitudCotizacion[grupoFamiliar][][parentesco]':{
						required: "Ingrese el Tipo de Integrante."
					},
					'solicitudCotizacion[grupoFamiliar][][edad]':{
						required: "Ingrese la Edad."
					},
					'solicitudCotizacion[grupoFamiliar][][tipo_doc]':{
						required: "Ingrese la Fecha de Nacimiento."
					},
					'solicitudCotizacion[grupoFamiliar][][num_doc]':{
						required: "Ingrese el Número de Documento"
					},
					'solicitudCotizacion[grupoFamiliar][][sexo]':{
						required: "Ingrese el Sexo."
					},
					'solicitudCotizacion[grupoFamiliar][][obraSocial]':{
						required: "Ingrese la Condición de Afiliación."
					},
					'ventaSalud[motivoNoVenta]':{
						required: "Ingrese un motivo."
					}
	    		}
			}
		],
		
		
	    
	}); // Finaliza el extend

	return new ViewConfiguration();	
});
//# sourceURL=/form-venta-ecco-ap/js/libs/framework/views/util/viewConfiguration.js