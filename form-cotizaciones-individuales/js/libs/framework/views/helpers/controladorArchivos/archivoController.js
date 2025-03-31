define ([
         'jquery',
         'underscore',
         'backbone',
         'handlebars',
         'bootstrap',
         'ace',
		 'encoding',
		 'util',
		 'libs/settings',
	     'text!/form-cotizaciones-individuales/js/libs/framework/views/helpers/controladorArchivos/archivoTemplate.html',
	     'text!/form-cotizaciones-individuales/js/libs/framework/views/helpers/controladorArchivos/archivoModal.html',
	     'text!/form-cotizaciones-individuales/js/libs/framework/views/helpers/controladorArchivos/archivoModalViewAndEdit.html',
	     'text!/form-cotizaciones-individuales/js/libs/framework/views/helpers/controladorArchivos/archivoModalViewAndEditV2.html',
		 'text!/form-cotizaciones-individuales/js/libs/framework/views/helpers/controladorArchivos/archivoModalViewAndEditV3.html',
		 '/form-smg-commons/js/libs/services/rudiService.js',
], function ($, 
	_, 
	Backbone, 
	Handlebars, 
	bootstrap, 
	ace, 
	Encoding, 
	Util,
	SettingsModel,
	archivoTemplate,
	archivoModal,
	archivoModalViewAndEdit,
	archivoModalViewAndEditV2,
	archivoModalViewAndEditV3,
	RudiService
){
	
    var archivoController = Backbone.View.extend ({
		/* Para los campos descriptos debajo se tomaran por default por si no son provistos por el programador*/
    	archivosParaCargar: [],
    	
    	archivosVistaPrevia: null,
		/*prefijo para los campos del html*/
		id: null,
		/*nivel de controlador['auto, manual]auto=el controlador maneja los eventos, manual=el que convoca el controlador maneja los eventos*/
//		modo:'auto',
		buttonId:null,
		/*div que contendra el template html*/
		container: null,
		/*limite de carga de archivos*/
		limiteArchivos:5,
		/*tamaño maximo por archivo en mb*/
		maxSizeArchivo:3,
		/*formatos permitidos*/
		archivosValidos:["image/jpeg","image/png","image/jpg","application/pdf","image/bmp","image/tiff"],
		/*estilo de imagenes['previewImagen','previewImagenZoom']*/
		archivoStyle:'previewImagenZoom',
		/*permitir subir y borrar archivos*/
		seEdita:true,
		
		seCargoLasImagenes:false,
		
		archivosCargados:[],
		
		archivosCargadosTemp:[],
		
		caracteresInvalidos: ['~','`','!','@','#','$','%','^','&','*','(',')','+','=','<','>','?',':','\"','{','}','|',',','/',';','\'','[',']','\\','—'], 
		
		cargaIlimitada:false,
		
		titulo:'Adjuntar archivos',
		
		subtituloUno:'Archivos subidos:',
		
		subtituloDos:'Archivos para subir:',
		
		cargandoDiv:'',
		
		notaAlPie:"",
		
		setArchivosCallBack:null,
		
		agregarArchivosCallBack:null,
		
		currentType:'',//para saber si se esta usando el template o modal
		
		width:100,
		
		heigth:100,
		
		businessKey:null,
		
		imgSuffix:1,
		
		modalVerArchivosTarget:null,
    
	    events: function() {
	    	var self = this;
	    	self.id = self.options.id;
	    	self.cargandoDiv=self.options.id+'CargandoDiv';
	    	var _events = {};
	    	
	    	if(self.options.modo!==undefined && self.options.modo==='manual'){
	    		return _events;
	    	}
	    	else{
	    		_events['click  #btnClickCargarArchivos'+self.id ] = 'openFileSelector';
				_events['change #btnAgregarArchivos'+self.id     ] = 'agregarArchivos';
				_events['click  .'+self.archivoStyle         ] = 'selectArchivo';
				_events['click  #btnBorrarSeleccionadas'+self.id ] = 'borrarSeleccionados';
				_events['click  #btnDescargarSeleccionadas'+self.id ] = 'descargarSeleccionados';
				_events['click  #btnArchivosAceptar'+self.id ] = 'setArchivosModal';
				_events['click  .borrarArchivo' ] = 'borrarArchivo';
				_events['click  .descargarArchivo' ] = 'descargarArchivo';
				_events['click  .verArchivo' ] = 'verArchivo';
	    	}

						
	        return _events;

	    },
	    
	    start:function(){
	    	var self=this;
	    	$(".widget-box").addClass('cargandoBody');
			$(".modal-dialog").addClass('cargandoBody');
			$('#'+self.cargandoDiv).css('top',($(".widget-box").height())/2);
			$('#'+self.cargandoDiv).css('left',($(".widget-box").width())/2);
			$('#'+self.cargandoDiv).css('z-index',9999);
//			$('#'+self.id+'CargandoDiv').css('display','block');
			$('#'+self.cargandoDiv).show();
	    },
	    
	    finish:function(){
	    	var self=this;
	    	$(".widget-box").removeClass('cargandoBody');
			$(".modal-dialog").removeClass('cargandoBody');
			$('#'+self.cargandoDiv).css('z-index',-10);
//			$('#'+self.id+'CargandoDiv').css('display','none');
			$('#'+self.cargandoDiv).hide();
	    },
		
		initTemplate: function (){
			var self = this;
			self.currentType='template';
			self.reRender(archivoTemplate);
       	},
       	
       	initModal: function (){
			var self = this;
			self.currentType='modal';
			self.reRender(archivoModal);
       	},
       
       	initModalViewAndEdit: function (){
			var self = this;
			self.currentType='modalViewAndEdit';
			self.reRender(archivoModalViewAndEdit);
       	},

       	initModalViewAndEditV2: function (){
       		var self = this;
       		self.currentType='modalViewAndEditV2';
       		self.reRender(archivoModalViewAndEditV2);
       		self.agregarArchivos=self.agregarArchivosV2;
       		self.selectArchivo=null;
       		self.setArchivosModal=self.setArchivosModalV2;
       		self.recargarEventos();
       	},

		initModalViewAndEditV3: function (){

			var self = this;
			self.currentType='modalViewAndEditV3';
			self.reRender(archivoModalViewAndEditV3);
			self.agregarArchivos=self.agregarArchivosV3;
			self.selectArchivo=null;
			self.setArchivosModal=self.setArchivosModalV3;
			self.recargarEventos();
		},
       	
       	render: function (component){
        	var self = this;
	      	var compiledTemplate = Handlebars.compile(component);
	      	
	      	self.$el.html(compiledTemplate({id:self.id,seEdita:self.seEdita, titulo:self.titulo, subtituloUno: self.subtituloUno, subtituloDos: self.subtituloDos, notaAlPie:self.notaAlPie}));
			return self;
			
       	},
       	
       	reRender: function(component) {
       		var self = this;
       		$("#"+self.container).empty().append(self.render(component).el);
       	},
       	
       	openFileSelector:function(){
			var self=this;
       		$("#btnAgregarArchivos"+self.id).click();
       	},
       	
       	openModal:function(){
       		var self = this;
       		$("#imagenesGallery"+self.id+"ParaSubir").empty().html(self.archivosVistaPrevia);
       		$("#"+self.id+"Modal").modal('show');
       	},
		
		openModalView:function(BusinessKey){
       		var self = this;
       		$("#imagenesGallery"+self.id).empty();
       		$("#"+self.id+"Modal").modal('show');
       		if(this.businessKey == null) {
       			this.businessKey = BusinessKey;
       			self.cargarArchivosPorBusinessKey(BusinessKey);
       		}
       	},
       	
       	openModalViewAndEdit:function(BusinessKey){
       		var self = this;
       		$("#imagenesGallery"+self.id+"ParaSubir").empty().html(self.archivosVistaPrevia);
       		$("#"+self.id+"Modal").modal('show');
       		if(this.businessKey == null) {
       			this.businessKey = BusinessKey;
       			self.cargarArchivosPorBusinessKey(BusinessKey);
       		}
       	},

       	openModalViewAndEditV2:function(BusinessKey){
       		var self = this;
       		var $imagenesSubidas=$("#imagenesGallery"+self.id).find('.archivoLiSubido');
       		
       		$("#imagenesGallery"+self.id).empty();
       		$imagenesSubidas.each(function(){
       		 var $this = $(this);
       			$("#imagenesGallery"+self.id).append($this);
       		});
       		if(self.archivosVistaPrevia!=null){
       			var $imagenesParaSubir=self.archivosVistaPrevia;
           		$imagenesParaSubir.each(function(){
          		 var $this = $(this);
          			$("#imagenesGallery"+self.id).append($this);
          		});
       		}
       		
       		
       		$("#"+self.id+"Modal").modal('show');
       		if(this.businessKey == null) {
       			this.businessKey = BusinessKey;
       			self.cargarArchivosPorBusinessKey(BusinessKey);
       		}
       	},
       	
       	
       	changeCargandoDiv:function(id){
       		var self=this;
       		self.cargandoDiv=id;
       	},
       	
       	getArchivosName:function(){
		var self=this;
       		var nombresTemp= [];
       		if(self.currentType==="modalViewAndEditV2" || self.currentType=== "modalViewAndEditV3"){
       			$("#imagenesGallery"+self.id).find('.nombreArchivo').each(function(){
           			nombresTemp.push($(this).val());
           		});
       		}
       		else if(self.currentType==="modalViewAndEdit" || self.currentType==="modal" || self.currentType==="template"){
       			$("#imagenesGallery"+self.id+"ParaSubir").find('.nombreArchivo').each(function(){
           			nombresTemp.push($(this).val());
           		});
       		}
       		return nombresTemp;
       	},
		
       	agregarArchivos:function(event){
       		var self=this;
       		self.start();
       		var nombresArchivos=self.getArchivosName();
			var imagenesCargadasLength=$('.previewImagenZoom').length;
			var imagen=$(event.target).val();
	 		var errorMensaje="Los siguientes archivos no han sido subidos: ";
	 		var invalidFiles=false;
	 		var imagenesLength=event.target.files.length;
	 		var pdf=new RegExp("application/pdf");
			var word=new RegExp("officedocument.wordprocessingml.document");
			var excel= new RegExp("officedocument.spreadsheetml.sheet");
			var tiff= new RegExp("image/tiff");
			var llegoAlLimite=false;
			//iteracion para validar//luego iteracion para apendear
			var archivosValidadosIndex=[];
			
			for (var i=0; i<imagenesLength;i++){
				Util.debug("NOMBRE ARCHIVO", event.target.files[i].name);
				Util.debug("REPETIDO EN ARCHIVOSCARGADOS?", self.checkIsRepetido(event.target.files[i].name,self.archivosCargados));
				Util.debug("REPETIDO EN NOMBRESARCHIVOS?", self.checkIsRepetido(event.target.files[i].name,nombresArchivos));
				
				var caracterInvalido = self.checkValidFilename(event.target.files[i].name);
	    		if(imagenesCargadasLength>=self.limiteArchivos && self.cargaIlimitada===false){
					llegoAlLimite=true;
				}else if(event.target.files[i].size>self.formatMbToBytes(self.maxSizeArchivo)){
					invalidFiles=true;
					errorMensaje+=event.target.files[i].name+" (el tamaño es mayor a "+self.maxSizeArchivo+"mb). \n";
				}else if(self.archivosValidos.indexOf(event.target.files[i].type)===-1 ){
					invalidFiles=true;
					errorMensaje+=event.target.files[i].name+" (formato de archivo inv\u00E1lido). ";
				}else if(self.checkIsRepetido(event.target.files[i].name,self.archivosCargados) || self.checkIsRepetido(event.target.files[i].name,nombresArchivos)){
					invalidFiles=true;
					errorMensaje+=event.target.files[i].name+" (el archivo ya se encuentra adjunto). ";
				}else if(caracterInvalido != null){
					invalidFiles=true;
					errorMensaje+=event.target.files[i].name+" (el nombre del archivo contiene un caracter inv\u00E1lido: " + caracterInvalido + " ). ";
				}else{
					archivosValidadosIndex.push(i);
					imagenesCargadasLength+=1;
					nombresArchivos.push(event.target.files[i].name);
				}
    		}
			if(archivosValidadosIndex.length===0){
    			self.finish();
    		}
    		archivosValidadosIndex.forEach(function (i){//de esta manera i tiene el valor de cada valor dentro del array
    			var reader = new FileReader();
 				reader.imagenesLength=archivosValidadosIndex.length;
 				reader.file=event.target.files[i];
 				reader.index=i+1;
	 			reader.onload = function (e) {
	 				var src;
	 				if(pdf.test(this.file.type)){
	 					src="img/pdf-thumbnail.png";
	 				}else if(word.test(this.file.type)){
	 					src="img/word-thumbnail.png";
	 				}else if(excel.test(this.file.type)){
	 					src="img/excel-thumbnail.png";
		 			}else if(tiff.test(this.file.type)){
	 					src="img/tiff-thumbnail.png";
	 				}else{
	 					src=e.target.result;
	 				}
	 				var $img=$("<img>",{src:src,name:e.target.file.name,style:'width:'+self.width+'px;height:'+self.height+'px;'});
	 				var $conTilde=$("<i class='icon-check red'></i>");
//	 				var $sinTilde=$("<i class='icon-check-empty '></i>");
	 				var $checked=$("<div>",{class:"check"});
	 				$checked.append($conTilde);
//	 				$checked.append($sinTilde);
	 				var $archivo=$("<input type='hidden' class='archivo'>").val(e.target.result);
	 				var $archivoEncoding=$("<input type='hidden' class='archivoEncoding'>").val(e.target.result.split(/,(.+)?/)[1]);
	 				var $nombreArchivo=$("<input type='hidden' class='nombreArchivo'>").val(this.file.name);
	 				var $sizeArchivo=$("<input type='hidden' class='sizeArchivo'>").val(this.file.size);
	 				
	 				var $imgContainer=$("<div>",{class:"imagenContainer "+self.archivoStyle, style:'width:'+self.width+'px;height:'+self.height+'px;'}).append($img);
	 				
	 				$imgContainer.append($checked);
	 				$imgContainer.append($archivo);
	 				$imgContainer.append($archivoEncoding);
	 				$imgContainer.append($nombreArchivo);
	 				$imgContainer.append($sizeArchivo);
	 				var $li= $('<li class="archivoLiParaSubir" data-rel="tooltip" title="'+this.file.name+'" data-toggle="dropdown" data-placement="bottom" data-container="body">',{}).append($imgContainer);
	 				
	 				
	 				
	 		 		$("#imagenesGallery"+self.id+"ParaSubir").append($li);
	 		 		if(this.index>=this.imagenesLength){
	 		 			if(self.agregarArchivosCallBack!=null){
	 						self.agregarArchivosCallBack();
	 					}
	 		 			self.finish();
	 		 		}
	 	        };
	 			reader.readAsDataURL(event.target.files[i]);
    		});
	 		
	 		
	 		if(llegoAlLimite){
	 			$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
					text:"Solo se puede adjuntar hasta "+self.limiteArchivos+" archivos.",
					class_name: 'gritter-warning'
				});
	 		}
	 		if(invalidFiles){
	 			$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
					text:errorMensaje,
					class_name: 'gritter-warning'
				});
	 			self.finish();
	 		}
	 		$("#btnAgregarArchivos"+self.id).val("");
		},
		
		agregarFoto:function(img, size, imgSuffix, esTarea){
			var self=this;
       		self.start();
       		var fileName = "imagen" + this.imgSuffix + ".jpg";
       		var nombresArchivos=self.getArchivosName();
			var imagenesCargadasLength=$('.previewImagenZoom').length;
			var imagen=$(event.target).val();
	 		var errorMensaje="Los siguientes archivos no han sido adjuntos: ";
			var llegoAlLimite=false;

	    		if(imagenesCargadasLength>=self.limiteArchivos && self.cargaIlimitada===false){
					llegoAlLimite=true;
				}
	    		else{
	    			while(self.checkIsRepetido(fileName,self.archivosCargados) || self.checkIsRepetido(fileName,nombresArchivos)){
	    				Util.debug("FILENAME YA EXISTE", fileName);
	    				this.imgSuffix++;
		    			fileName = "imagen" + this.imgSuffix + ".jpg";
		    			Util.debug("FILENAME NUEVO", fileName);
		    		}
	    			Util.debug("FILENAME FINAL", fileName);
					imagenesCargadasLength+=1;
					nombresArchivos.push(fileName);
				}
	    		
	    		if(!llegoAlLimite) {
	    			if(esTarea) {
	    				var $img=$("<img>",{src:img,style:'width:100px;height:100px;'});
		 				var $nuevo=$('<div class="ribbon-tipo">NUEVO</div>');
		 				var $conTilde=$("<i class='icon-check red'></i>");
//		 				var $sinTilde=$("<i class='icon-check-empty '></i>");
		 				var $checked=$("<div>",{class:"check"});
		 				$checked.append($conTilde);
//		 				$checked.append($sinTilde);
		 				var $archivo=$("<input type='hidden' class='archivo'>").val(fileName);
		 				var $archivoEncoding=$("<input type='hidden' class='archivoEncoding'>").val(img.split(/,(.+)?/)[1]);
		 				var $nombreArchivo=$("<input type='hidden' class='nombreArchivo'>").val(fileName);
		 				var $sizeArchivo=$("<input type='hidden' class='sizeArchivo'>").val(size);
		 				
		 				var $imgContainer=$("<div>",{class:"imagenContainer "+self.archivoStyle, style:'width:100%;height:100%;'}).append($img);
		 				
		 				$imgContainer.append($nuevo);
		 				$imgContainer.append($checked);
		 				$imgContainer.append($archivo);
		 				$imgContainer.append($archivoEncoding);
		 				$imgContainer.append($nombreArchivo);
		 				$imgContainer.append($sizeArchivo);
		 				var $li= $('<li class="archivoLiParaSubir" data-rel="tooltip" title="'+fileName+'" data-toggle="dropdown" data-placement="bottom" data-container="body">',{}).append($imgContainer);
//		 				var $opcionUno=$('<a href="#"><i class="icon-pencil"></i></a>');
		 				var $opcionDos=$('<a href="#"><i class="icon-trash btn-small borrarArchivo" data-rel="tooltip" title="Borrar" data-toggle="dropdown" data-placement="bottom" data-container="body"></i></a>');
		 				var $menu=$('<div class="tools tools-bottom">');
//		 				$menu.append($opcionUno);
		 				$menu.append($opcionDos);
		 				
		 				$li.append($menu);
		 				
		 		 		$("#imagenesGallery"+self.id).append($li);
	 		 			if(self.agregarArchivosCallBack!=null){
	 						self.agregarArchivosCallBack();
	 					}
	    			}
	    			else {
	    				var $img=$("<img>",{src:img,name:fileName,style:'width:100px; height:100px;'});
		 				var $conTilde=$("<i class='icon-check red'></i>");
//		 				var $sinTilde=$("<i class='icon-check-empty '></i>");
		 				var $checked=$("<div>",{class:"check"});
		 				$checked.append($conTilde);
//		 				$checked.append($sinTilde);
		 				var $archivo=$("<input type='hidden' class='archivo'>").val(fileName);
		 				var $archivoEncoding=$("<input type='hidden' class='archivoEncoding'>").val(img.split(/,(.+)?/)[1]);
		 				Util.debug("IMAGEN SPLITEADA", img.split(/,(.+)?/)[1]);
		 				var $nombreArchivo=$("<input type='hidden' class='nombreArchivo'>").val(fileName);
		 				var $sizeArchivo=$("<input type='hidden' class='sizeArchivo'>").val(size);
		 				
		 				var $imgContainer=$("<div>",{class:"imagenContainer "+self.archivoStyle, style:'width:100%;height:100%;'}).append($img);
		 				
		 				if(esTarea) {
		 					var $ribbon = '<div class="ribbon-tipo">NUEVO</div>';
		 					$imgContainer.append($ribbon);
		 				}
		 				
		 				$imgContainer.append($checked);
		 				$imgContainer.append($archivo);
		 				$imgContainer.append($archivoEncoding);
		 				$imgContainer.append($nombreArchivo);
		 				$imgContainer.append($sizeArchivo);
		 				Util.debug("IMGCONTAINER", $imgContainer);
		 				
		 				var $li= $('<li class="archivoLiParaSubir" data-rel="tooltip" title="'+ fileName +'" data-toggle="dropdown" data-placement="bottom" data-container="body">',{}).append($imgContainer);
		 				var $opcionDos=$('<a href="#"><i class="icon-trash btn-small borrarArchivo" data-rel="tooltip" title="Borrar" data-toggle="dropdown" data-placement="bottom" data-container="body"></i></a>');
		 				var $menu=$('<div class="tools tools-bottom">');
		 				$menu.append($opcionDos);
		 				$li.append($menu);
		 				
		 				$("#imagenesGallery"+self.id+"ParaSubir").append($li);
		 				
		 				if(self.agregarArchivosCallBack!=null){
	 						self.agregarArchivosCallBack();
	 					}
	    			}
	 		 		
 		 			self.finish();
    		}
	    	else {
	 			$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
					text:"Solo se puede adjuntar hasta "+self.limiteArchivos+" archivos.",
					class_name: 'gritter-warning'
				});
	 			self.finish();
	 		}
	 		$("#btnAgregarArchivos"+self.id).val("");
		},

		agregarArchivosV3:function(event){
			this.agregarArchivosV2(event);


			// En el caso que haya al menos un archivo a subir se cambia el texto del boton
			//if($(".archivoLiParaSubir").length > 1){
			$("#btnArchivosAceptar"+this.id).text("Cargar");
			//}else{
			//	$("#btnArchivosAceptar"+self.id).text("Aceptar");
			//}
		},

		agregarArchivosV2:function(event){
       		var self=this;
       		self.start();
       		var nombresArchivos=self.getArchivosName();
			var imagenesCargadasLength=$('.previewImagenZoom').length;
			var imagen=$(event.target).val();
	 		var errorMensaje="Los siguientes archivos no han sido subidos: ";
	 		var invalidFiles=false;
	 		var imagenesLength=event.target.files.length;
	 		var pdf=new RegExp("application/pdf");
			var word=new RegExp("officedocument.wordprocessingml.document");
			var excel= new RegExp("officedocument.spreadsheetml.sheet");
			var tiff= new RegExp("image/tiff");
			var llegoAlLimite=false;
			//iteracion para validar//luego iteracion para apendear
			var archivosValidadosIndex=[];

			for (var i=0; i < imagenesLength; i++) {
				var caracterInvalido = self.checkValidFilename(event.target.files[i].name);
	    		if(imagenesCargadasLength>=self.limiteArchivos && self.cargaIlimitada===false){
					llegoAlLimite=true;
				}else if(event.target.files[i].size>self.formatMbToBytes(self.maxSizeArchivo)){
					invalidFiles=true;
					errorMensaje+=event.target.files[i].name+" (el tamaño es mayor a "+self.maxSizeArchivo+"mb). \n";
				}else if(self.archivosValidos.indexOf(event.target.files[i].type)===-1 ){
					invalidFiles=true;
					errorMensaje+=event.target.files[i].name+" (formato de archivo inv\u00E1lido). ";
				}else if(self.checkIsRepetido(event.target.files[i].name,nombresArchivos) || self.checkIsRepetido(event.target.files[i].name,self.archivosCargados)){
					invalidFiles=true;
					errorMensaje+=event.target.files[i].name+" (el archivo ya se encuentra adjunto). ";
				}
				else if(caracterInvalido != null){
					invalidFiles=true;
					errorMensaje+=event.target.files[i].name+" (el nombre del archivo contiene un caracter inv\u00E1lido: " + caracterInvalido + " ). ";
				}else{
					archivosValidadosIndex.push(i);
					imagenesCargadasLength+=1;
					nombresArchivos.push(event.target.files[i].name);
				}
    		}
    		if(archivosValidadosIndex.length===0){
    			self.finish();
    		}
    		archivosValidadosIndex.forEach(function (i){//de esta manera i tiene el valor de cada valor dentro del array
    			var reader = new FileReader();
 				reader.imagenesLength=archivosValidadosIndex.length;
 				reader.file=event.target.files[i];
 				reader.index=i+1;
	 			reader.onload = function (e) {
	 				var src;
	 				if(pdf.test(this.file.type)){
	 					src="img/pdf-thumbnail.png";
	 				}else if(word.test(this.file.type)){
	 					src="img/word-thumbnail.png";
	 				}else if(excel.test(this.file.type)){
	 					src="img/excel-thumbnail.png";
		 			}else if(tiff.test(this.file.type)){
	 					src="img/tiff-thumbnail.png";
	 				}else{
	 					src=e.target.result;
	 				}
	 				var $img=$("<img>",{src:src,name:e.target.file.name,style:'width:'+self.width+'px;height:'+self.height+'px;'});
	 				var $nuevo=$('<div class="ribbon-tipo">NUEVO</div>');
	 				var $conTilde=$("<i class='icon-check red'></i>");
//	 				var $sinTilde=$("<i class='icon-check-empty '></i>");
	 				var $checked=$("<div>",{class:"check"});
	 				$checked.append($conTilde);
//	 				$checked.append($sinTilde);
	 				var $archivo=$("<input type='hidden' class='archivo'>").val(e.target.result);
	 				var $archivoEncoding=$("<input type='hidden' class='archivoEncoding'>").val(e.target.result.split(/,(.+)?/)[1]);
	 				var $nombreArchivo=$("<input type='hidden' class='nombreArchivo'>").val(this.file.name);
	 				var $sizeArchivo=$("<input type='hidden' class='sizeArchivo'>").val(this.file.size);
	 				
	 				var $imgContainer=$("<div>",{class:"imagenContainer "+self.archivoStyle, style:'width:'+self.width+'px;height:'+self.height+'px;'}).append($img);
	 				
	 				$imgContainer.append($nuevo);
	 				$imgContainer.append($checked);
	 				$imgContainer.append($archivo);
	 				$imgContainer.append($archivoEncoding);
	 				$imgContainer.append($nombreArchivo);
	 				$imgContainer.append($sizeArchivo);
	 				var $li= $('<li class="archivoLiParaSubir" data-rel="tooltip" title="'+this.file.name+'" data-toggle="dropdown" data-placement="bottom" data-container="body">',{}).append($imgContainer);
//	 				var $opcionUno=$('<a href="#"><i class="icon-pencil"></i></a>');
	 				var $opcionDos=$('<a href="#"><i class="icon-trash btn-small borrarArchivo" data-rel="tooltip" title="Borrar" data-toggle="dropdown" data-placement="bottom" data-container="body"></i></a>');
	 				var $menu=$('<div class="tools tools-bottom">');
//	 				$menu.append($opcionUno);
	 				$menu.append($opcionDos);
	 				
	 				$li.append($menu);
	 				
	 		 		$("#imagenesGallery"+self.id).append($li);
	 		 		if(this.index>=this.imagenesLength){
	 		 			if(self.agregarArchivosCallBack!=null){
	 						self.agregarArchivosCallBack();
	 					}
	 		 			self.finish();
	 		 		}
	 	        };
	 			reader.readAsDataURL(event.target.files[i]);
    		});
	 		
	 		
	 		if(llegoAlLimite){
	 			$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
					text:"Solo se puede adjuntar hasta "+self.limiteArchivos+" archivos.",
					class_name: 'gritter-warning'
				});
	 		}
	 		if(invalidFiles){
	 			$.gritter.add({
					title: '<i class="icon-exclamation-sign bigger-120"></i>&nbsp;Atenci\u00F3n',
					text:errorMensaje,
					class_name: 'gritter-warning'
				});
	 			self.finish();
	 		}
		},
		
		selectArchivo:function(){
			$(event.target).parent().parent().toggleClass("imagenSeleccionada");
		},
		
		checkValidFilename:function(name){
			var self = this;
			for(var i = 0; i < name.length; i++){
				for(var j = 0; j < self.caracteresInvalidos.length; j++) {
					if(name[i] === self.caracteresInvalidos[j]){
						return self.caracteresInvalidos[j];
					}
				}
			}
		},
		
		checkIsRepetido:function(name,archivosCargados){
			for(var i=0;i<archivosCargados.length;i++){
				if(name===archivosCargados[i]){
					return true;
				}
			}
			return false;
		},
		
		borrarSeleccionados:function(){
			var self=this;
			$("#imagenesGallery"+self.id+"ParaSubir .imagenSeleccionada").remove();
		},
		
		borrarArchivo:function(){
			var self=this;
			$(event.target).closest('li').remove();

			// En el caso que haya al menos un archivo a subir se cambia el texto del boton
			if($(".archivoLiParaSubir").length > 0){
				$("#btnArchivosAceptar"+self.id).text("Cargar");
			}else{
				$("#btnArchivosAceptar"+self.id).text("Aceptar");
			}
		},
       	
		descargarSeleccionados:function(){
			var self=this;
			$("#imagenesGallery"+self.id+"YaCargadas .imagenSeleccionada").each(function(){
				  var $this = $(this);
				  var a = $("<a>").attr("href", $this.find('.archivo').val()).attr("download", $this.find('.nombreArchivo').val()).appendTo("#testDescarga");//testDescarga
				  a[0].click();
				  a.remove();
				});
		},
		
		descargarArchivo:function(){
			var self=this;
			var $this = $(event.target).closest('li');
			var a = $("<a>").attr("href", $this.find('.archivo').val()).attr("download", $this.find('.nombreArchivo').val()).appendTo("#testDescarga");//testDescarga
			a[0].click();
			a.remove();
		},
		
		verArchivo:function(){
			var self=this;
			var url = $(event.target).closest('a').attr('href');
			window.open(url);
			/*Util.debug("PASO POR ACA");
			Util.debug(this.modalVerArchivosTarget);
			Util.debug(url);
			Util.debug($('#' + this.modalVerArchivosTarget + 'iframe'));
			$('#' + this.modalVerArchivosTarget).modal("show");
            $('#' + this.modalVerArchivosTarget + ' iframe').attr('src', url);

            var elemToChange =  $('#' + this.modalVerArchivosTarget + ' iframe');
            elemToChange.height($(window).height() - 200 + "px");*/
		},
		
		cargarArchivoFromUrlPublicacion:function(urlPublicacion,fileName,fileSize){
			var self = this;
			var urlToReplace = SettingsModel.get("rudi_url_pattern_to_replace");
			var urlToPut = SettingsModel.get("rudi_url_pattern_to_put");
			var pdf = new RegExp("pdf");
			var word = new RegExp("doc");
			var excel = new RegExp("xls");
			var tiff = new RegExp("tif");
			var tiff2 = new RegExp("tiff");
			var esPDF = false;
			var src;
			var nombreArchivo=fileName.split('.');
			var extensionArchivo=nombreArchivo[nombreArchivo.length-1].toLowerCase();
			var urlImagen = urlPublicacion.replace(urlToReplace, urlToPut);
			//var urlImagen = urlPublicacion;

			if(pdf.test(extensionArchivo)) {
				src = "img/pdf-thumbnail.png";
				esPDF = true;
			}else if(word.test(extensionArchivo)) {
				src = "img/word-thumbnail.png";
			}else if(excel.test(extensionArchivo)) {
				src = "img/excel-thumbnail.png";
 			}else if(tiff.test(extensionArchivo) || tiff2.test(extensionArchivo)) {
				src = "img/tiff-thumbnail.png";
			}else{
				src = urlImagen;
			}
			
			var $img = $("<img>",{src:src, style:'width:'+self.width+'px;height:'+self.height+'px;'});
			var $conTilde = $("<i class='icon-check red'></i>");
//				var $sinTilde=$("<i class='icon-check-empty '></i>");
			var $checked = $("<div>",{class:"check"});
			$checked.append($conTilde);
//				$checked.append($sinTilde);
			var $archivo = $("<input type='hidden' class='archivo'>").val(urlImagen);
			var $nombreArchivo = $("<input type='hidden' class='nombreArchivo'>").val(fileName);
			var $sizeArchivo = $("<input type='hidden' class='sizeArchivo'>").val(fileSize);
			
			var $imgContainer = $("<div>",{class:"imagenContainer "+self.archivoStyle, style:'width:'+self.width+'px;height:'+self.height+'px;'}).append($img);
			
			$imgContainer.append($checked);
			$imgContainer.append($archivo);
			$imgContainer.append($nombreArchivo);
			$imgContainer.append($sizeArchivo);
			var $li = $('<li class="archivoLiSubido" data-rel="tooltip" title="'+fileName+'" data-toggle="dropdown" data-placement="bottom" data-container="body">',{}).append($imgContainer);
		    
			var url = encodeURIComponent(urlImagen);
			var $opcionVer;
			if(!esPDF) {
				$opcionVer = $('<a href="../form-visualizador-tiff/#tiffView?id=1&url=' + url +'"><i class="icon-eye-open verArchivo" data-rel="tooltip" title="Ver archivo" data-toggle="dropdown" data-placement="bottom"></i></a>');
			}
			else {
				$opcionVer = $('<a href="' + urlImagen +'"><i class="icon-eye-open verArchivo" data-rel="tooltip" title="Ver" data-toggle="dropdown" data-placement="bottom"></i></a>');
			}
			
			var $opcionDescargar = $('<a href="#"><i class="icon-cloud-download btn-small descargarArchivo" data-rel="tooltip" title="Descargar" data-toggle="dropdown" data-placement="bottom" data-container="body"></i></a>');
// 				var $opcionDos=$('<a href="#"><i class="icon-remove red"></i></a>');
			var $menu = $('<div class="tools tools-bottom">');
			$menu.append($opcionVer);
 			$menu.append($opcionDescargar);
			
			$li.append($menu);
			
	 		$("#imagenesGallery"+self.id+"YaCargadas").append($li);
		},
		
		cargarArchivoFromUrlPublicacionV2:function(urlPublicacion,fileName,fileSize){
			var urlToReplace = SettingsModel.get("rudi_url_pattern_to_replace");
			var urlToPut = SettingsModel.get("rudi_url_pattern_to_put");
			
			var self = this;
			var esPDF = false;
			var pdf = new RegExp("pdf");
			var word = new RegExp("doc");
			var excel = new RegExp("xls");
			var tiff = new RegExp("tif");
			var tiff2 = new RegExp("tiff");
			var urlImagen = urlPublicacion.replace(urlToReplace, urlToPut);
			//var urlImagen = urlPublicacion;
			
			var src;
			var nombreArchivo = fileName.split('.');
			var extensionArchivo = nombreArchivo[nombreArchivo.length-1].toLowerCase();
			
			if(pdf.test(extensionArchivo)){
				src = "img/pdf-thumbnail.png";
				esPDF = true;
			}else if(word.test(extensionArchivo)){
				src = "img/word-thumbnail.png";
			}else if(excel.test(extensionArchivo)){
				src = "img/excel-thumbnail.png";
			}else if(tiff.test(extensionArchivo) || tiff2.test(extensionArchivo)){
				src = "img/tiff-thumbnail.png";
			}else{
				src = urlImagen;
			}
			
			var $img = $("<img>",{src:src, style:'width:'+self.width+'px;height:'+self.height+'px;'});
			var $conTilde = $("<i class='icon-check red'></i>");
//				var $sinTilde=$("<i class='icon-check-empty '></i>");
			var $checked = $("<div>",{class:"check"});
			$checked.append($conTilde);
//				$checked.append($sinTilde);
			var $archivo = $("<input type='hidden' class='archivo'>").val(urlImagen);
			var $nombreArchivo = $("<input type='hidden' class='nombreArchivo'>").val(fileName);
			var $sizeArchivo = $("<input type='hidden' class='sizeArchivo'>").val(fileSize);
			
			var $imgContainer = $("<div>",{class:"imagenContainer "+self.archivoStyle, style:'width:'+self.width+'px;height:'+self.height+'px;'}).append($img);
			
			$imgContainer.append($checked);
			$imgContainer.append($archivo);
			$imgContainer.append($nombreArchivo);
			$imgContainer.append($sizeArchivo);
			var $li = $('<li class="archivoLiSubido" data-rel="tooltip" title="'+fileName+'" data-toggle="dropdown" data-placement="bottom" data-container="body">',{}).append($imgContainer);
//			
			var url = encodeURIComponent(urlImagen);
			var $opcionVer;
			if(!esPDF) {
				$opcionVer = $('<a href="../form-visualizador-tiff/#tiffView?id=1&url=' + url +'"><i class="icon-eye-open verArchivo" data-rel="tooltip" title="Ver archivo" data-toggle="dropdown" data-placement="bottom"></i></a>');
			}
			else {
				$opcionVer = $('<a href="' + urlImagen +'"><i class="icon-eye-open verArchivo" data-rel="tooltip" title="Ver" data-toggle="dropdown" data-placement="bottom"></i></a>');
			}
			
			var $opcionDescargar = $('<a href="#"><i class="icon-cloud-download btn-small descargarArchivo" data-rel="tooltip" title="Descargar" data-toggle="dropdown" data-placement="bottom" data-container="body"></i></a>');
// 				var $opcionDos=$('<a href="#"><i class="icon-remove red"></i></a>');
			var $menu = $('<div class="tools tools-bottom">');
			$menu.append($opcionVer);
 			$menu.append($opcionDescargar);
			
			$li.append($menu);
			
			$("#imagenesGallery"+self.id).append($li);
		},

		cargarArchivosPorBusinessKey: function(businessKey){
			var self = this;
			if(!self.seCargoLasImagenes){
				$("#imagenesGallery"+self.id+"YaCargadas").empty();
				var nroTramite;
				self.start();
				RudiService.getFilesByBusinessKey("VPI", businessKey, false,
					function (data) {
						var result = data;
						nroTramite = result.imagenesArchivo.items[0].tramitePk.nroTramite;
						for(var i = 0; i < result['imagenesArchivo']['items'].length; i++) {
							var dataImagen=result['imagenesArchivo']['items'][i];
							if(self.currentType === "modalViewAndEditV2" || self.currentType === "modalViewAndEditV3"){
								self.cargarArchivoFromUrlPublicacionV2(dataImagen.urlPublicacion,dataImagen.fileName,dataImagen.sizeInBytes);
							}
							else{
								self.cargarArchivoFromUrlPublicacion(dataImagen.urlPublicacion,dataImagen.fileName,dataImagen.sizeInBytes);
							}
						}
						self.seCargoLasImagenes = true;
						self.finish();
						return nroTramite;
					},
					function (xhr, err) {
						self.finish();
						Util.error('Error data: ', err);
						Util.error("readyState:"+xhr.readyState+"\nstatus:"+xhr.status+"\nresponseText: "+xhr.responseText);
					},
					function (data) {}
				);
			}
		},
		
		setimagenesContainerHeight: function(height){
			var self=this;
			$("#imagenesContainer"+self.id).height(height);
		},
		setCustomImagenPreviewSize: function(width,height){
			var self = this;
			self.width=width;
			self.height=height;
		},
		getArchivosSubidosLength: function(){
			var self = this;
			var cantidadArchivosSubidos;
			if(self.currentType === "modalViewAndEditV2" || self.currentType === "modalViewAndEditV3"){
				cantidadArchivosSubidos = $("#imagenesGallery"+self.id).find(".archivoLiParaSubir").length;
			}
			else if(self.currentType === "modalViewAndEdit" || self.currentType === "modal" || self.currentType === "template"){
				cantidadArchivosSubidos = $("#imagenesGallery"+self.id+"ParaSubir").find(".archivoLiParaSubir").length;
			}
				
			return cantidadArchivosSubidos;
		},
		
		seSeleccionoArchivos:function(){
			var self = this;
			var hayArchivosParaSubir = false;
			var cantidadArchivosSubidos;
			if(self.currentType === "modalViewAndEditV2" || self.currentType === "modalViewAndEditV3"){
				cantidadArchivosSubidos = $("#imagenesGallery"+self.id).find(".archivoLiParaSubir").length;
			}
			else if(self.currentType === "modalViewAndEdit" || self.currentType === "modal" || self.currentType === "template"){
				cantidadArchivosSubidos = $("#imagenesGallery"+self.id+"ParaSubir").find(".archivoLiParaSubir").length;
			}
			if(cantidadArchivosSubidos > 0) {
				hayArchivosParaSubir = true;
			}
			return hayArchivosParaSubir;
		},
		
		setArchivosModal: function(){
			var self = this;
			var result = $("#imagenesGallery"+self.id+"ParaSubir .imagenContainer");

			self.archivosParaCargar = [];
			for(var i = 0; i < result.length; i++){
				
				var fileEncoding = $(result[i]).find(".archivoEncoding").val();
				var fileName = $(result[i]).find(".nombreArchivo").val();
				var fileSize = $(result[i]).find(".sizeArchivo").val();
				self.archivosParaCargar.push({"fileName":fileName, "base64Content":fileEncoding,"sizeInBytes":fileSize});
				
			}
			self.archivosVistaPrevia = $("#imagenesGallery"+self.id+"ParaSubir").html();
			
			if(self.setArchivosCallBack != null){
				
				self.setArchivosCallBack();
			}
			$("#"+self.id+"Modal").modal('hide');
		},



		saveAndEnd: function(){
			var tipoTramite = "VPI",
				nroTramite = this.getNroTramite(this.businessKey),
				self = this,
				result = $("#imagenesGallery"+self.id+" .archivoLiParaSubir");

			self.archivosParaCargar = [];
			for(var i = 0; i < result.length; i++){
				var fileEncoding = $(result[i]).find(".archivoEncoding").val(),
					fileName = $(result[i]).find(".nombreArchivo").val(),
					fileSize = $(result[i]).find(".sizeArchivo").val(),
					newobj = {"fileName":fileName, "base64Content":fileEncoding,"sizeInBytes":fileSize};
				self.archivosParaCargar.push(newobj);

				RudiService.agregarFileRudi(
					tipoTramite,
					nroTramite,
					newobj,
					false,
					function (data) {
						$("#btnCancelarBusqueda"+self.id).click();
						$("#imagenesGallery"+self.id).empty();
						$("#btnArchivosAceptar"+self.id).text("Aceptar");
					},
					function (xhr,err) {
						Util.error('Error data: ', err);
						Util.error("readyState:"+xhr.readyState+"\nstatus:"+xhr.status+"\nresponseText: "+xhr.responseText);
					},
					function(){}
				);
			}
		},

		setArchivosModalV3: function(){
			var self = this;
			if($("#btnArchivosAceptar"+this.id).text() === "Cargar"){
				bootbox.dialog("\u00BFEst\u00E1 seguro que desea cargar las imagenes?", [
					{
						"label" : "Cancelar",
						"class" : "btn-small btn-default",
						"callback": function () {
							//Se cancela la finalizaci\u00F3n
						}
					},
					{
						"label" : "OK",
						"class" : "btn-small btn-danger",
						"callback": function () {
							self.saveAndEnd();
							self.getNroTramite(self.businessKey);
						}
					}
				]);
			}else{
				$("#btnCancelarBusqueda"+this.id).click();
			}
		},

		setArchivosModalV2: function(){
			var self = this;
			var result = $("#imagenesGallery"+self.id+" .archivoLiParaSubir");
			
			self.archivosParaCargar = [];
			for(var i = 0; i < result.length; i++){
				var fileEncoding = $(result[i]).find(".archivoEncoding").val();
				var fileName = $(result[i]).find(".nombreArchivo").val();
				var fileSize = $(result[i]).find(".sizeArchivo").val();
				self.archivosParaCargar.push({"fileName":fileName, "base64content":fileEncoding,"fileSize":fileSize});
			}
			
			self.archivosVistaPrevia = $("#imagenesGallery"+self.id).find(".archivoLiParaSubir");
			
			if(self.setArchivosCallBack != null){
				self.setArchivosCallBack();
			}
			$("#"+self.id+"Modal").modal('hide');
		},
		
		setArchivosTemplate: function(){
			var self = this;
			var result = $("#imagenesGallery"+self.id+"ParaSubir .imagenContainer");
			self.archivosParaCargar = [];
			for(var i = 0; i < result.length; i++){
				var fileEncoding = $(result[i]).find(".archivoEncoding").val();
				var fileName = $(result[i]).find(".nombreArchivo").val();
				var fileSize = $(result[i]).find(".sizeArchivo").val();
				self.archivosParaCargar.push({"fileName":fileName, "base64content":fileEncoding,"fileSize":fileSize});
				
			}

			self.archivosVistaPrevia = $("#imagenesGallery"+self.id+"ParaSubir").html();
			if(self.setArchivosCallBack != null){
				self.setArchivosCallBack();
			}

		},
		
		getArchivos: function(){
			var self = this;
			if(self.currentType === 'template'){
				self.setArchivosTemplate();
			}
			
			return self.archivosParaCargar;
		},
		
		recargarEventos:function(){
			var self = this;
			self.delegateEvents();
		},
		
		formatBytesToMb:function (bytes,decimals) {
			var kilobyte = 1024;
			var megabyte = kilobyte * 1024;
			return (bytes / megabyte).toFixed(decimals);
		},
		
		formatMbToBytes:function (mb) {
			var byte = 1048576;
			return (mb * byte);
		},
		
		getNroTramite: function(businessKey) {
			var self = this;
			var urlRUDI = SettingsModel.get("rudi_proxy_url") + "VPI?businessKey=" + businessKey;
			var nroTramite;
			
			RudiService.getFilesByBusinessKey(
				"VPI",
				businessKey,
				false,
				function (data) {
					var archivosCargadosTemp=data.imagenesArchivo.items;
					for(var i=0;i<archivosCargadosTemp.length;i++){
						self.archivosCargados.push(archivosCargadosTemp[i].fileName);
					}
					var result = data;
//					Util.debug("NROTRAMITE", result.imagenesArchivo.items[0].tramitePk.nroTramite);
					nroTramite = result.imagenesArchivo.items[0].tramitePk.nroTramite;
				},
				function (xhr,err) {
					Util.error('Error data: ', err);
				    Util.error("readyState:"+xhr.readyState+"\nstatus:"+xhr.status+"\nresponseText: "+xhr.responseText);
			   },
			   function () {}
			);
			
			return nroTramite;
			
		}
    });
    
    return archivoController;
});