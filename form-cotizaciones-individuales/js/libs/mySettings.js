/*
 *
 *  Name        : setting.js
 *  Description : require and backbone file for setting parameters application.
 *  Author      : Jose Maria Serio (jserio@grupomercel.com)
 * */

define([
    'underscore',
    'backbone',
    '/form-smg-commons/js/libs/commonsSettings.js',
], function (_, Backbone, CommonsSettings) {

    var MySettings = CommonsSettings.extend({
        defaults: _.extend({}, CommonsSettings.prototype.defaults, {
            entorno: 'form-cotizaciones-individuales-{environment_desc}'
        }),

    });

    return MySettings;
});