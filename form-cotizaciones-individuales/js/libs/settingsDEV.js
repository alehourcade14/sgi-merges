/*
 *
 *  Name        : setting.js
 *  Description : require and backbone file for setting parameters application.
 *  Author      : Jose Maria Serio (jose.serio@swismedical.com.ar)
 * */

define([
   'underscore',
   'backbone',
   '/form-cotizaciones-individuales/js/libs/mySettings.js'
], function (_, Backbone, MySettings) {

   var Settings = MySettings.extend({
       defaults: _.extend({}, MySettings.prototype.defaults, {
           environment: 'DEV'
       })
   });

   return new Settings();
});