/*
 *
 *  Name        : routers.js
 *  Description : require and backbone file for routers app.
 *  Author      : Jose Maria Serio (jose.serio@swismedical.com.ar)
 * */


define([
    'jquery',
    'underscore',
    'backbone',
    'backboneRouterFilters',
    'encoding',
    'libs/settings',
    'util',
    'serialize',
    'handlebarsHelpers',
    'libs/framework/views/app/cotizacionIndividuo',
    'libs/framework/views/app/formView',
    'libs/framework/views/app/ventaRetail/formViewRetail',
    'libs/framework/views/app/ventaRetail/formEditViewRetail',
    'libs/framework/views/app/ventaRetail/formShowViewRetail',
    'libs/framework/views/app/formVtaProductoresView',
    'libs/framework/views/app/formEditView',
    'libs/framework/views/app/formShowView',
    'libs/framework/views/app/formVtaProductoresShowView',
    'libs/framework/views/app/formVtaProductoresEditView',
    'libs/framework/views/app/formReservaProductoresEditView',
    'libs/framework/views/app/formVtaPuraCompletarProspectoView',
    'libs/framework/views/app/formAsignarSupervisorEditView',
    'libs/framework/views/app/formAsignarAsesorEditView',
    'libs/framework/views/app/cotizacion/formShowView',
    'text!libs/framework/templates/app/failTemplate.html',
    'text!libs/framework/templates/app/autorizationTemplate.html',
    'session',
    'libs/framework/views/app/reporteCotizacion/ReporteCotizacionView',
], function ($, _, Backbone, BackboneRouterFilters, Encoding, SettingsModel, Util, serialize,
             HandlebarsHelpers, CotizacionIndividuo, FormView, FormViewRetail, FormEditViewRetail, FormShowViewRetail, FormVtaProductoresView, FormEditView,
             FormShowView, FormVtaProductoresShowView, FormVtaProductoresEditView, FormReservaProductoresEditView, FormVtaPuraCompletarProspectoView,
             FormAsignarSupervisorView,FormAsignarAsesorView, FormCotizacionShowView, failTemplate, autorizationTemplate, Session, reporteCotizacionView) {


    var AppRouter = Backbone.Router.extend ({

        notRequresAuth: ['#login'],
        preventAccessWhenAuth: ['#login'],


        beforeFilter: {

            filterMethod: function () {
            }
        },


        afterFilter: {

            filterMethod: function () {

                var isAuth = Session.getLocal('authenticated');

                if (!isAuth) {
                    Backbone.history.navigate('error', {trigger: true});
                    $("#content1").empty ();
                    var compiledTemplate = Handlebars.compile(autorizationTemplate);
                    $("#content1").html (compiledTemplate());
                    return false;
                }

                return true;


            }
        },


        /*
         *  Define teh actions.
         * */
        routes: {
            'cotizacionIndividuo': 'goCotizacionIndividual',
            'formEditView/:tid/:processId': 'goFormEditView',
            'formShowView/:tid/:processId': 'goFormShowView',
            'formAsignarSupervisorView/:tid/:processId': 'goFormAsignarSupervisorView',
            'formAsignarAsesorView/:tid/:processId': 'goFormAsignarAsesorView',
            'formReservaProductoresEditView/:tid/:processId': 'goFormReservaProductoresEditView',
            'formVtaPuraCompletarProspectoView/:tid/:processId': 'goFormVtaPuraCompletarProspectoView',
            'formVtaProductoresEditView/:tid/:processId': 'goFormVtaProductoresEditView',
            'formVtaProductoresShowView/:tid/:processId': 'goFormVtaProductoresShowView',
            'formView/:id/:origen': 'goFormFromAtencionSuc',
            'formView/:id': 'goFormView',
            'formViewRetail/:id': 'goFormViewRetail',
            'formEditViewRetail/:id/:processId': 'goFormEditViewRetail',
            'formShowViewRetail/:tid/:processId': 'goFormShowViewRetail',
            'formVtaProductoresView/:id': 'goFormVtaProductoresView',
            'ReporteCotizacionView': 'goReporte',
            'formCotizacionShowView/:tid/:processId': 'goFormCotizacionShowView',
            '': 'goEmpty',
            '*action': 'goEmpty'
        },

        goEmpty: function () {
            Backbone.history.navigate('error', {trigger: true});
            $("#content1").empty ();
            var compiledTemplate = Handlebars.compile(failTemplate);
            $("#content1").html (compiledTemplate());
        },

        goFormView: function (id) {
            var formView = new FormView();
            this.print(formView.render(id).el);
        },
        
        goFormViewRetail: function (id) {
        	var formViewRetail = new FormViewRetail();
        	formViewRetail.list(id);
        },

        goFormEditViewRetail: function (tid, processId) {
        	var formEditViewRetail = new FormEditViewRetail();
        	formEditViewRetail.list(tid, processId);
        },

        goFormShowViewRetail: function (tid, processId) {
            Util.info(tid, processId);
            var formShowViewRetail = new FormShowViewRetail();
            formShowViewRetail.list (tid, processId);
        },
        
        goFormVtaProductoresView: function (id) {
            Util.info("id", id);
            var formVtaProductoresView = new FormVtaProductoresView();
            formVtaProductoresView.list (id);
        },

        goFormVtaProductoresEditView: function (tid, processId) {
            Util.info(tid, processId);
            var formVtaProductoresEditView = new FormVtaProductoresEditView();
            formVtaProductoresEditView.list (tid, processId);
        },
        goFormVtaProductoresShowView: function (tid, processId) {
            Util.info(tid, processId);
            var formVtaProductoresShowView = new FormVtaProductoresShowView();
            formVtaProductoresShowView.list (tid, processId);
        },

        goFormAsignarAsesorView: function (tid, processId) {
            Util.info(tid, processId);
            var formAsignarAsesorView = new FormAsignarAsesorView();
            formAsignarAsesorView.list (tid, processId);
        },

        goFormAsignarSupervisorView: function (tid, processId) {
            Util.info(tid, processId);
            var formAsignarSupervisorView = new FormAsignarSupervisorView();
            formAsignarSupervisorView.list (tid, processId);
        },

        goFormReservaProductoresEditView: function (tid, processId) {
            Util.info(tid, processId);
            var formReservaProductoresEditView = new FormReservaProductoresEditView();
            formReservaProductoresEditView.list (tid, processId);
        },
        
        goFormVtaPuraCompletarProspectoView: function (tid, processId) {
            Util.info(tid, processId);
            var view = new FormVtaPuraCompletarProspectoView();
            view.list (tid, processId);
        },

        goFormShowView: function (tid, processId) {
            Util.info(tid, processId);
            var formShowView = new FormShowView();
            formShowView.list (tid, processId);
        },

        goFormEditView: function (tid, processId) {
            var formEditView = new FormEditView();
            formEditView.list (tid, processId);
        },

        goCotizacionIndividual: function () {
            var cotizacionIndividuo = new CotizacionIndividuo();
            cotizacionIndividuo.list ();
        },

        goFormFromAtencionSuc: function (id, origen) {
            var formView = new FormView();
            this.print(formView.render(id, origen).el);
        },

        print: function (target) {
            $("#content1").empty ();
            $("#content1").append (target);
        },

        goReporte: function () {
            var ReporteCotizacionView = new reporteCotizacionView();
            ReporteCotizacionView.list ($('#content1'));
        },

        goFormCotizacionShowView: function (tid, processId) {
            Util.info(tid, processId);
            var formCotizacionShowView = new FormCotizacionShowView();
            formCotizacionShowView.list (tid, processId);
        }

    });


    /*
     *  Function for initializing the router.
     * */
    var initialize = function () {
        new AppRouter;
        Backbone.history.start ();
    };


    // Return the object to usage.
    return {

        initialize: initialize
    };
});