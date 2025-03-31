define(['jquery',
        'underscore',
        'backbone',
        'datatablesBT',
        'handlebars',
        'bootstrap',
        'ace',
        'encoding',
        '/form-cotizaciones-individuales/js/libs/settings.js',
        'util',
        '/form-smg-commons/js/libs/services/loginService.js',
        'session',
        'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/reporte/reporteVtaAsistida.html',
        'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/reporte/tablaVtaProductoresReporte.html',
        'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/reporte/detallePlanesTemplate.html',
        'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/reporte/comboAsesores.html',
        'text!/form-cotizaciones-individuales/js/libs/framework/templates/app/searchTemplate.html',
        '/form-cotizaciones-individuales/js/libs/framework/views/app/listSearchView.js',
        '/form-smg-commons/js/libs/services/prospectoService.js'
    ],
    function ($, _, Backbone, datatablesBT, Handlebars, bootstrap, ace, Encoding, SettingsModel, Util, LoginService,
              Session, ReporteCotizacion, TablaReporte, ListPlanesTemplate, Combo,
              searchTemplate, ListSearchView, ProspectoService) {

        var contacto = null, cotizacion = null, obrasSociales = [], resultArray = null,


            reporteCotizacionView = Backbone.View.extend({

                events: {
                    'click		    #btnSearch'             : 'buscar',
                    'click		    .visualizar'            : 'visualizarReporte',
                    'change         #cmbcoordinadores'      : 'cargarAsesores',
                    'click          #exportToExcel'         : 'exportToExcel',
                    'click          #btnCancelar'           : 'cancelar',
                    'click          #usuario'     			: 'searchSupervisor',
                    'click          #btnClean'              : 'doClean'
                },

                keys: {
                    'x+alt+shift': 'closeTask',
                    'right+alt+shift': 'nextTab',
                    'left+alt+shift': 'previousTab'
                },

                closeTask: function () {
                    bootbox.confirm("¿Está seguro que desea cerrar el formulario?…", function (result) {
                        if (result) {
                            var removeTabUrl = SettingsModel.get("remove_tab_url") + $("#id").val() + "/" + entity.contra.trim().replace(/^0+/, '');
                            window.top.location.href = removeTabUrl;
                        }
                    });
                },

                cancelar: function () {
                    $("#modal-form").hide();
                },

                doClean: function () {
                    $('#nombre').val("");
                    $('#apellido').val("");

                    if (!Util.hasRole("SGI_PAS")) {
                        $('#productor').val("");
                    }

                    $('#loginUsuario').val("");
                    $('#uidUsuario').val("");
                    $('#legajoUsuario').val("");
                    $('#nombreCompletoUsuario').val("");
                    $('#usuario').val("");
                    $('#asesor').val("");
                    $('#nrotramite').val("");
                    $('#codigoNp').val("");
                    $('#zona').val("1");

                    $("#resultsPanel").hide();
                },

                searchSupervisor: function(){
                    $("#modalSearch").modal("show");
                    $("#processSearch").empty ();
                    var compiledTemplate = Handlebars.compile(searchTemplate);
                    $("#processSearch").append (compiledTemplate());

                    // Validate the search field.
                    this.$('#searchResultsContent').empty ();
                    
                    var callback = function (rol, async, successFunction, errorFunction, completeFunction) {
        				LoginService.memberOf(rol, async, successFunction, errorFunction, completeFunction);
        			};
                    
                    var listSearchView = new ListSearchView();
                    listSearchView.list("CN=GPS_REFERIDOS_SUPERVISOR,OU=CRM_PRUEBA,OU=APPLS,DC=SWM,DC=COM,DC=AR", this.$('#searchResultsContent'), this.$('#searchRefErrorContent'), callback, true);
                },

                previousTab: function () {
                    var nextTabUrl = SettingsModel.get("remove_tab_url").replace("#removeTab", "#previousTab");
                    window.top.location.href = nextTabUrl;
                },

                nextTab: function () {
                    var nextTabUrl = SettingsModel.get("remove_tab_url").replace("#removeTab", "#nextTab");
                    window.top.location.href = nextTabUrl;
                },


                visualizarReporte: function () {

                    $("#modal-form").show();
                    var tdEl = $(event.target).closest('td');
                    var id = tdEl.attr('id');
                   // var url = SettingsModel.get("cotizaciones_prospecto_rest_api_url") + 'cotizaciones/' + id;

                    var url = "http://localhost:8080/ws.cotizaciones-prospecto/api/reporte-venta-asistida?fechaDesde=2016-02-22&fechaFin=2016-03-22&zona=0&_=1458642942252";
                    //var url = SettingsModel.get("reporte_url") +"oficinavirtual/cotizacion/"+id+"/detalle";
                    //  	url = '../form-cotizaciones-individuales/cotizaciones.json?date=',
                    // url ='http://localhost:8080/ws.prospectos/api/oficinavirtual/reporte/cotizaciones?';
                    var cotizaciones;
                    Util.debug("URL Cotizar", url);
                    $.ajax({
                        url: url,
                        type: 'GET',
                        encoding: "UTF-8",
                        async: false,
                        cache: false,
                        success: function (data) {
                            cotizaciones = eval(data);
                            Util.info(cotizaciones);
                        },
                        error: function (xhr, err) {
                            Util.debug('Sample of error data:', err);
                            Util.debug("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                        }
                    });

                    for (var i = 0; i < cotizaciones.length; i++) {

                        var coti1 = cotizaciones[i];
                        coti1.TOTAL_A_COBRAR = 0;
                        coti1.VALOR_FLIAR_CARGO = 0;

                        if (coti1.COMPOSICION === "Individual") {

                        	if(coti1.COMPOSICION !== "FAMILIAR A CARGO"){
        						$.each(cotizaciones, function(index, coti2) {
        							if (coti1.PLAN_OS === coti2.PLAN_OS) {
        								if(coti2.COMPOSICION === "FAMILIAR A CARGO"){
        									if(coti1.PLAN_OS === coti2.PLAN_OS){
        										coti1.VALOR_FLIAR_CARGO = coti1.VALOR_FLIAR_CARGO + coti2.VALOR_TOTAL;
        									}
        									coti1.IVA = coti1.IVA + coti2.IVA;
        								}
        							}
        						});
        					}
                        }

                        coti1.TOTAL_A_COBRAR = parseFloat(coti1.VALOR_TOTAL) + parseFloat(coti1.VALOR_FLIAR_CARGO) + parseFloat(coti1.IVA) - parseFloat(coti1.APORTES_DESC);
                    }


                    Util.debug("cotizacionSeleccionada", cotizaciones);
                    var compiledTemplate = Handlebars.compile(ListPlanesTemplate);
                    $("#processDetail").empty();
                    $("#processDetail").append(compiledTemplate({
                        cotizaciones: cotizaciones
                    }));

                },


                buscar: function () {
                    Util.debug("Buscar");
                    var cotizaciones = null;
                    var fechasCreacion = this.readRangoFechaCreacion();

                    if (!this.validateRangoFechaCreacion()) {
                        $.gritter.add({
                            title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atención',
                            text: 'Por favor la fecha limite no debe superar los 365 días.',
                            class_name: 'gritter-warning'
                        });
                        Util.unBlockBody();
                        return false;
                    }

                    var searchFilter = {};
                    searchFilter.fecha_desde = fechasCreacion[0];
                    searchFilter.fecha_fin_vigencia = fechasCreacion[1];
                    searchFilter.Supervisor = $("#legajoUsuario").val();
                    searchFilter.Asesor = $("#asesor").val();
                    searchFilter.Nro_tramite = $("#nrotramite").val();
                    searchFilter.nombre = $("#nombre").val();
                    searchFilter.apellido = $("#apellido").val();
                    searchFilter.productor = $("#productor").val();
                    searchFilter.codigoNp = $("#codigoNp").val();

                   var url = SettingsModel.get("cotizaciones_prospecto_rest_api_url") + 'reporte-venta-productores?';

                    url += 'fechaDesde=' + searchFilter.fecha_desde;
                    url += '&fechaFin=' + searchFilter.fecha_fin_vigencia;

                    if (searchFilter.Supervisor && searchFilter.Supervisor !== '') {
                        url += '&supervisor=' + searchFilter.Supervisor;
                    }
                    if (searchFilter.Asesor && searchFilter.Asesor !== '') {
                        url += '&asesor=' + searchFilter.Asesor;
                    }
                    if (searchFilter.Nro_tramite && searchFilter.Nro_tramite !== '') {
                        url += '&tramite=' + searchFilter.Nro_tramite;
                    }
                    if (searchFilter.nombre && searchFilter.nombre !== '') {
                        url += '&nombre=' + searchFilter.nombre;
                    }
                    if (searchFilter.apellido && searchFilter.apellido !== '') {
                        url += '&apellido=' + searchFilter.apellido;
                    }
                    if (searchFilter.productor && searchFilter.productor !== '') {
                        url += '&productor=' + searchFilter.productor;
                    }
                    if (searchFilter.codigoNp && searchFilter.codigoNp !== '') {
                        url += '&codigonp=' + searchFilter.codigoNp;
                    }

                    Util.debug("URL reporte", url);

                    //var url = '../form-cotizaciones-individuales/cotizacionesReporte.json?date=';
                    var c = {};
                    resultArray =c;
                    
                    $.ajax({
                        url: url,
                        type: 'GET',
                        encoding: "UTF-8",
                        async: false,
                        cache: false,
                        success: function (data) {
                            cotizaciones = eval(data);
                            Util.debug('Sample of error data cotizaciones:......', cotizaciones);
                            resultArray = cotizaciones;
                            Util.info(cotizaciones);
                        },
                        error: function (xhr, err) {
                            Util.debug('Sample of error data:', err);
                            Util.debug("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                        }
                    });

                    var compiledTemplate = Handlebars.compile(TablaReporte);
                    $("#resultsPanel").empty().append(compiledTemplate({
                        cotizaciones: cotizaciones
                    }));
                },


                validateRangoFechaCreacion: function () {
                    var fechas = this.readRangoFechaCreacion();
                    return this.validateDaysLimit(fechas[0], fechas[1]);
                },


                validateDaysLimit: function (dateStrFrom, dateStrTo) {
                    var parts = dateStrFrom.split('-');
                    var dateFrom = new Date(parts[0], parts[1] - 1, parts[2]);
                    parts = dateStrTo.split('-');
                    var dateTo = new Date(parts[0], parts[1] - 1, parts[2]);
                    if (Util.daysBetween(dateFrom, dateTo) > 365) {
                        return false;
                    }
                    return true;
                },


                readRangoFechaCreacion: function () {
                    return this.readRangoFecha('#id-date-range-picker-search');
                },


                readRangoFecha: function (pickerId) {
                    var res = ["", ""];
                    if ($(pickerId).val() !== '') {
                        res = $(pickerId).val().split(" hasta ");
                        res[0] = this.parseFechaToWS(res[0]);
                        res[1] = this.parseFechaToWS(res[1]);
                    }
                    return res;
                },


                parseFechaToWS: function (date) {
                    var parts = date.split('/');
                    date = parts[2] + "-" + parts[1] + "-" + parts[0];
                    return date;
                },
                
                genteAcargo: function (data) {
                	
                	LoginService.managerOf(data.uid, false, 
                			function(data) {
            				 	return data;
            				}, 
            				function(xhr, err) {
            					
            				}, 
            				function(data) {
            					
            				});
                },

                cargarAsesores: function () {
                    var coordinador = $('#cmbcoordinadores').val();
                    var cord = this.buscarEmpleadoBIDE(coordinador);
                    var list = this.buscarEmpleadoACargoBIDE(cord[0].legajo);
                    var compiledTemplate = Handlebars.compile(Combo);
                    $('#asesores').empty().append(compiledTemplate({list: list}));

                },
                
                esAsesor: function () {
                    
                	var retorno = true;
                    var self = this;
                    var user = Session.getLocal("userName");
                    
                    LoginService.userInformation(user, false, 
            			function(data) {
                    		retorno = self.esJefe(data);
            			},
            			function(xhr, err) {
            				
            			},
            			function(data) {
            				
            		});
                    
                    return retorno;
                },


                buscarEmpleado: function () {
                    var retorno;
                    var self = this;
                    var user = Session.getLocal("userName");
                    
                    LoginService.userInformation('MaCascallares', false, 
                			function(data) {
                    			retorno = data;
                			},
                			function(xhr, err) {
                				
                			},
                			function(data) {
                				
                		});
                    
                    return retorno;
                },


                buscarEmpleadoBIDE: function (user) {
                    var listUsers = [];
                     var url = SettingsModel.get("url_bide");

                    $.ajax({
                        url: url,
                        type: 'POST',
                        contentType: "application/xml;",
                        accept: "application/xml; charset=UTF-8",
                        dataType: 'xml',
                        headers: 'Content-Type:application/xml',
                        data: "<mensaje codigoCliente='SGI' fecha='2015-11-10T14:48:35'>"
                        + "<empleadoParams>"
                        + "<legajo></legajo>"
                        + "<usuarioAD>" + user + "</usuarioAD>"
                        + "<activo></activo>"
                        + "<fechaIngresoDesde></fechaIngresoDesde>"
                        + "<fechaIngresoHasta></fechaIngresoHasta>"
                        + "<nombre></nombre>"
                        + "<apellido> </apellido>"
                        + "<esContratado></esContratado>"
                        + "<edificioID></edificioID>"
                        + "<puestoID></puestoID>"
                        + "<gerenciaID></gerenciaID>"
                        + "<centroCosto></centroCosto>"
                        + "<sociedadID></sociedadID>"
                        + "<unidadNegocioID></unidadNegocioID>"
                        + "<unidadOrganigramaID></unidadOrganigramaID>"
                        + "<legajoSuperiorInmediato></legajoSuperiorInmediato>"
                        + "<mesNacimiento></mesNacimiento>"
                        + "<tipoDocumento></tipoDocumento>"
                        + "<nroDocumento></nroDocumento>"
                        + "</empleadoParams>"
                        + "</mensaje>",

                        encoding: "UTF-8",
                        async: false,
                        cache: false,
                        success: function (xml) {
                            $(xml).find('empleado').each(function () {
                                var edificio = $(this).find('edificio').text();

                                listUsers.push(
                                    {
                                        legajo: $(this).find('legajo').text(),
                                        username: $(this).find('usuarioAD').text(),
                                        puesto: $(this).find('puesto').text(),
                                        nombre: $(this).find('nombre').text(),
                                        apellido: $(this).find('apellido').text(),
                                    });
                            });

                        },
                    });

                    //Util.debug("puesto",listUsers[0].puesto);
                    return listUsers;
                },


                buscarEmpleadoACargoBIDE: function (legajo) {
                    var listUsers = [];
                    var user = Session.getLocal("userName");
                      var url = SettingsModel.get("url_bide");
                    $.ajax({
                        url: url,
                        type: 'POST',
                        contentType: "application/xml;",
                        accept: "application/xml; charset=UTF-8",
                        dataType: 'xml',
                        headers: 'Content-Type:application/xml',
                        data: "<mensaje codigoCliente='SGI' fecha='2015-11-10T14:48:35'>"
                        + "<empleadoParams>"
                        + "<legajo></legajo>"
                        + "<usuarioAD></usuarioAD>"
                        + "<activo></activo>"
                        + "<fechaIngresoDesde></fechaIngresoDesde>"
                        + "<fechaIngresoHasta></fechaIngresoHasta>"
                        + "<nombre></nombre>"
                        + "<apellido> </apellido>"
                        + "<esContratado></esContratado>"
                        + "<edificioID></edificioID>"
                        + "<puestoID></puestoID>"
                        + "<gerenciaID></gerenciaID>"
                        + "<centroCosto></centroCosto>"
                        + "<sociedadID></sociedadID>"
                        + "<unidadNegocioID></unidadNegocioID>"
                        + "<unidadOrganigramaID></unidadOrganigramaID>"
                        + "<legajoSuperiorInmediato>" + legajo + "</legajoSuperiorInmediato>"
                        + "<mesNacimiento></mesNacimiento>"
                        + "<tipoDocumento></tipoDocumento>"
                        + "<nroDocumento></nroDocumento>"
                        + "</empleadoParams>"
                        + "</mensaje>",

                        encoding: "UTF-8",
                        async: false,
                        cache: false,
                        success: function (xml) {
                            $(xml).find('empleado').each(function () {
                                var edificio = $(this).find('edificio').text();

                                listUsers.push(
                                    {
                                        legajo: $(this).find('legajo').text(),
                                        username: $(this).find('usuarioAD').text(),
                                        puesto: $(this).find('puesto').text(),
                                        nombre: $(this).find('nombre').text(),
                                        apellido: $(this).find('apellido').text(),
                                    });
                            });

                        },
                    });

                    return listUsers;
                },


                exportToExcel: function () {
                    var aseguradoras = [];
                    
                    $.ajax({
                        type: "GET" ,
                        url: "../form-cotizaciones-individuales/aseguradoras.json?date="+new Date().getTime(),
                        async: false,
                        success : function(data) {
                            aseguradoras = eval(data);
                        },
                        error : function(xhr, err) {
                            Util.error('Sample of error data:', err);
                            Util.error("readyState: " + xhr.readyState + "\nstatus: " + xhr.status + "\nresponseText: " + xhr.responseText);
                        }
                    });

                    Util.debug("ReporteCSV: ", "");

                    var cotizacionesCSV = [];

                    for (var i = 0; i < resultArray.length; i++) {
                        cotizacionesCSV.push(
                            {
                                fechaCreacion: moment(resultArray[i].fecha_creacion).format("DD/MM/YYYY"),
                                Tventa: resultArray[i].tipo_venta,
                                oportunidad: resultArray[i].tipo_oportunidad,
                                tipoDocumento:  resultArray[i].cuit == '' ? resultArray[i].tipo_documento  : 'CUIT',
                                dni: resultArray[i].nro_documento,
                                cuit: resultArray[i].cuit,
                                nombre: resultArray[i].nombre,
                                apellido: resultArray[i].apellido,
                                provincia: resultArray[i].provincia,
                                localidad: resultArray[i].localidad,
                                domicilio: resultArray[i].domicilio,
                                telefono: resultArray[i].telefonos,
                                nroTramite: resultArray[i].nro_tramite,
                                nombApeProd: resultArray[i].nombre_ape_productor,
                                codigoProd: resultArray[i].codigo_productor,
                                supervisor: resultArray[i].nombre_ape_supervisor,
                                asesor: resultArray[i].nombre_ape_asesor,
                                estadoReserva: resultArray[i].estado_reserva,
                                fechaReserva: resultArray[i].fecha_reserva == '' ? resultArray[i].fecha_reserva : moment(resultArray[i].fecha_reserva).format("DD/MM/YYYY"),
                                motivoRecReserva: resultArray[i].motivo_rechazo_reserva,
                                tareaTramite: resultArray[i].tarea_tramite,
                                estadoTramite: resultArray[i].estado_tramite,
                                capitasAmba: resultArray[i].capitas_amba,
                                capitasInt: resultArray[i].capitas_inte,
                                ciaAseguradora: this.getObtenerCia(resultArray[i], aseguradoras),
                                frentePoliza: this.getTieneFtePoliza(resultArray[i]),
                                prodVendido: resultArray[i].producto_vendido,
                                motivoCierre: resultArray[i].motivo_cierra,
                                razon: resultArray[i].razon_social,
                                poliza: resultArray[i].poliza_smg_seg,
                                fpolica: this.getFechaPoliza(resultArray[i].fecha_vig_no_smg),
                                capitas: resultArray[i].capitas_potenciales,
                                observaciones: resultArray[i].observaciones
                            });
                    }
                    var d = new Date();
                    var year = d.getFullYear();
                    var month = d.getMonth() + 1;
                    var date = d.getDate();
                    var dateString = "".concat(year, month < 10 ? "0" : "", month, date < 10 ? "0" : "", date);
                    var columnConf = [
                        {fechaCreacion: "Fecha creacion"},
                        {Tventa: "Tipo de Venta"},
                        {oportunidad: "Oportunidad"},
                        {tipoDocumento: "Tipo Documento"},
                        {dni: "DNI"},
                        {cuit: "CUIT"},
                        {nombre: "Nombre"},
                        {apellido: "Apellido"},
                        {razon: "Razon Social"},
                        {provincia: "Provincia"},
                        {localidad: "Localidad"},
                        {domicilio: "Domicilio"},
                        {telefono: "Telefono"},
                        {nombApeProd: "Nombre Productor"},
                        {codigoProd: "Cod. Productor"},
                        {supervisor: "supervisor"},
                        {asesor: "Asesor"},
                        {nroTramite: "Número Tramite"},
                        {ciaAseguradora: "Cia. Aseguradora"},
                        {frentePoliza: "Frente Poliza"},
                        {estadoReserva: "Estado Reserva"},
                        {fechaReserva: "Fecha Rerserva"},
                        {motivoRecReserva: "Motivo Rechazo Reserva"},
                        {tareaTramite: "Tarea del Tramite"},
                        {estadoTramite: "Estado Tramite"},
                        {capitasAmba: "Capitas AMBA"},
                        {capitasInt: "Capitas Interior"},
                        {prodVendido: "Producto Vendido"},
                        {motivoCierre: "Motivo de Cierre"},
                        {poliza: "Nro. Poliza SMG"},
                        {fpolica: "Fecha Poliza"},
                        {observaciones: "Observaciones"}
                    ];

                    this.JSONToCSVConvertor(cotizacionesCSV, "Cotizaciones-Vta-Productores-" + dateString, columnConf, function (row, index) {
                        if (row[index] == null) {
                            return "";
                        }
                        if (index === 'nroDoc') {
                            return row[index].replace(/-/g, "");
                        }
                        return row[index];
                    });

                },

                getObtenerCia: function(registro, aseguradoras) {
                    if (registro.poliza_smg_life != 0) {
                        return 'SMG Life'
                    } else if (registro.poliza_smg_seg != 0) {
                        return 'SMG Seguros'
                    } else {
                        if (registro.aseguradora_id != 0) {
                            for (var i=0; i< aseguradoras.length; i++) {
                                if (registro.aseguradora_id == parseInt(aseguradoras[i].id)){
                                    return aseguradoras[i].name;
                                }
                            }
                        } else {
                            return null
                        }
                    }
                },

                getTieneFtePoliza: function(registro) {
                    if (registro.tipo_oportunidad === "Individuo") {
                        if (registro.fecha_vig_no_smg === ''){
                            return 'NO';
                        } else {
                            return 'SI';
                        }
                    } else {
                        if (registro.beneficio === 0){
                            return 'NO';
                        } else {
                            return 'SI';
                        }
                    }
                },

                getFechaPoliza: function(fechaPoliza) {
                    if (fechaPoliza == '1900-01-01 00:00:00.000') {
                       return '';
                    } else {
                        return fechaPoliza == '' ? fechaPoliza : moment(fechaPoliza).format("DD/MM/YYYY");
                    }
                },

                JSONToCSVConvertor: function (JSONData, ReportTitle, columnConf, filterFunction) {
                    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
                    var arrData = typeof JSONData !== 'object' ? JSON.parse(JSONData) : JSONData;

                    if (typeof filterFunction === 'undefined') {
                        filterFunction = function (row, index) {
                            return row[index];
                        };
                    }

                    var CSV = '';
                    //Set Report title in first row or line

                    var row = '"sep=,"' + '\r\n';
                    for (var i = 0; i < columnConf.length; i++) {
                        for (var name in columnConf[i]) {
                            row += '"' + columnConf[i][name] + '",';
                        }
                    }

                    row = row.slice(0, -1);
                    //append Label row with line break
                    CSV += row + '\r\n';

                    //1st loop is to extract each row
                    for (var i = 0; i < arrData.length; i++) {
                        row = "";
                        //2nd loop will extract each column and convert it in string comma-seprated

                        for (var j = 0; j < columnConf.length; j++) {
                            for (var name in columnConf[j]) {
                                row += '"' + filterFunction(arrData[i], name) + '",';
                            }
                        }

                        row.slice(0, row.length - 1);

                        //add a line break after each row
                        CSV += row + '\r\n';
                    }

                    if (CSV === '') {
                        alert("Invalid data");
                        return;
                    }

                    //Generate a file name
                    var fileName = "";
                    //this will remove the blank-spaces from the title and replace it with an underscore
                    fileName += ReportTitle.replace(/ /g, "_");

                    //Initialize file format you want csv or xls

                    var csvData = 'data:text/csv;charset=utf-8,' + escape(CSV);
                    Util.debug("navigator", navigator);
                    //Others
                    var link = document.createElement("a");
                    link.href = csvData;

                    //set the visibility hidden so it will not effect on your web-layout
                    link.style = "visibility:hidden";
                    link.download = fileName + ".csv";

                    //this part will append the anchor tag and remove it after automatic click
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                },


                // Render method.
                list: function (target) {
                    var self = this;
                    target.append(self.render(target).el);
                },

                // Render method.
                render: function (target) {
                    var self = this, data = null, zonas;
                    ProspectoService.getZonas("0", false,
						function (data) {
							zonas = eval(data);
						}, function (xhr, err, urlRest, typeCall) {
						}, function (data) {
			
						}
					);
                    var jefe;
                    var coordinadores;
                    var productor;
                    var asesores = [];
                    var user = Session.getLocal("userName");
                    //user="MaCascallares";

                    var colaborador = [];
                    var empleado = this.buscarEmpleadoBIDE(user);
                    if (empleado[0] != null && empleado[0].puesto.search("Jefe") !== -1) {
                        Util.debug("jefe");
                        jefe = empleado;
                        coordinadores = this.buscarEmpleadoACargoBIDE(empleado[0].legajo);
                        Util.debug("coordinadores", coordinadores);
                        /*
                         for (var i =0; i < coordinadores.length; i++) {
                         colaborador=self.buscarEmpleadoACargoBIDE(coordinadores[i].legajo);
                         Util.debug("iterar",colaborador.length);
                         for(var j =0; j < colaborador.length; j++){
                         asesores.push(colaborador[j]);
                         Util.debug("En for",colaborador[j]);
                         }
                         colaborador = new Array();
                         }
                         */

                    } else if (empleado[0] != null && empleado[0].puesto.search("Coord") !== -1) {
                        Util.debug("coordinador");
                        coordinadores = empleado;
                        asesores = this.buscarEmpleadoACargoBIDE(empleado[0].legajo);
                    } else  if (Util.hasRole("SGI_PAS")) {
                        productor = empleado;
                    } else {
                            Util.debug("Asesor");
                            asesores = empleado;
                    }

                    Util.debug("jefe", jefe);
                    Util.debug("coord", coordinadores);
                    Util.debug("asesores", asesores);

                    var compiledTemplate = Handlebars.compile(ReporteCotizacion);
                    self.$el.html(compiledTemplate({
                        zonas: zonas,
                        jefe: jefe,
                        coordinadores: coordinadores,
                        asesores: asesores,
                        productor: productor
                    }));
                    return this;
                }
            });


        return reporteCotizacionView;
    });