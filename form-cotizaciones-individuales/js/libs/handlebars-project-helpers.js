define ([
	     'jquery',
	     'underscore',
	     'backbone',
	     'handlebars',
         'text!/static/js/libs/templates/failServiceTemplate.html',
		 'util'
], function ($, _, Backbone, Handlebars, failServiceTemplate, Util ) {


    Handlebars.registerHelper('getAseguradora', function(id){
        Util.debug("En myHelper...");
        Util.debug("id:"+id);
        var aseguradoras, i, returnValue = "";
        $.ajax({
            type: "GET" ,
            url: "aseguradoras.json?date="+new Date().getTime(),
            async: false,
            success : function(data) {
                aseguradoras = eval(data);
                Util.debug("aseguradoras:",aseguradoras);
                for(i = 0; i < aseguradoras.length; i++){
                    var aseguradora=aseguradoras[i];
                    if(aseguradora.id === id){
                        Util.debug("myHelper devuelve "+aseguradoras.name);
                        returnValue = aseguradora.name;
                    }
                }
            },
            error : function(xhr, err) {
                Util.error('Sample of error data:', err);
                Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
            }
        });
        Util.debug("myHelper devuelve "+returnValue);
        return returnValue;
    });

});
//@sourceURL=handlebarsProjectHelper.js