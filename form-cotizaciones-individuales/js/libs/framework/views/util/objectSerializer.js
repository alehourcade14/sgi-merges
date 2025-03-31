define ([
         'jquery',
	     'underscore',
	     'backbone',
	     '../../../../../../static/js/libs/thirds/jquery/moment.js'
], function ($, _, Backbone, moment) {

	var ObjectSerializer = Backbone.Model.extend ({
		
		serializeObject: function(element) {
			var self = this;
			var object = {};
			
			$(element).find("[name]").each(function( index ) {
				self.serializeElement(object, this);
			});
			
			return object;
		},
		
		serializeElement: function(object, element) {
			var self = this;
			if( self.isSerializable(element) ) {
				var name = $(element).attr('name');
				var serializableValue = self.findSerializableValue(element);
				
				var properties = [];
				var propertiesRegexp = /\[?([a-zA-Z0-9_]+|\[\]+)\]?/g;
				var propertiesMatches = null;
				while(propertiesMatches = propertiesRegexp.exec(name)) {
					properties.push(propertiesMatches[1]);
				}
				
				self.serializeValue(object, properties, 0, serializableValue);
			}
		},
		
		serializeValue: function(parent, properties, index, value) {
			var self = this;
			var isNumberRegexp = /^[0-9]+$/;
			var isArrayRegexp = /^[0-9]+$|^\[\]+$/;
			var isDynamicArrayIndexRegexp = /^\[\]+$/;
			
			if( properties != null ) {
				var nextIndex = (index + 1);
				var length = properties.length;
				if( length > index ) {
					
					if( length > nextIndex ) {
						if( isDynamicArrayIndexRegexp.test(properties[index]) ) {
							if( value != null && value !== undefined && Array.isArray(value) ) {
								for(var i = 0 ; i < value.length ; i ++) {
									var child = (parent.length > i ? parent[i] : null);
									if( child == null ) {
										child = {};
										parent[i] = child;
									}
									self.serializeValue(child, properties, nextIndex, value[i]);
								}
							} else {
								var nextArrayIndex = self.findNextArrayIndex(parent, properties, index);
								var child = (parent.length > nextArrayIndex ? parent[nextArrayIndex] : null);
								if( child == null ) {
									child = {};
									parent[nextArrayIndex] = child;
								}
								self.serializeValue(child, properties, nextIndex, value);
							}
						} else {
							var child = parent[properties[index]];
							if( child == null ) {
								if( isArrayRegexp.test(properties[nextIndex]) ) {
									child = [];
								} else {
									child = {};
								}
								parent[properties[index]] = child;
							}
							self.serializeValue(child, properties, nextIndex, value);
						}
					} else {
						if( isDynamicArrayIndexRegexp.test(properties[index]) ) {
							if( value != null && value !== undefined && Array.isArray(value) ) {
								for(var i = 0 ; i < value.length ; i ++) {
									parent[i] = value[i];
								}
							} else {
								parent[ self.findNextArrayIndex(parent, properties, index) ] = value;
							}
						} else {
							parent[properties[index]] = value;
						}
					}
				}
			}
		},
		
		findNextArrayIndex: function(parent, properties, index) {
			var self = this;
			if( Array.isArray(parent) ) {
				var nextIndex = (index + 1);
				var length = properties.length;
				if( length > index ) {
					for(var i = 0 ; i < parent.length ; i ++) {
						var aux = parent[i];
						for(var n = nextIndex ; n < length ; n ++) {
							if(!self.hasProperty(aux, properties[n])) {
								return i;
							}
							aux = aux[properties[n]];
						}
					}
				}
				return parent.length;
			}
		},
		
		hasProperty: function(object, property) {
			for (var key in object) {
    			if( key === property ) {
    				return true;
    			}
			}
			return false;
		},
		
		isSerializable: function(element) {
			var serializable = $(element).data('serializable');
			if( serializable != null && serializable !== undefined ) {
				return (true.toString() === serializable.toString());
			}
			return true;
		},
		
		findSerializableValue: function(element) {
			var self = this;
			var type = $(element).data('type');
			var value = $(element).val();
			if( $(element).is(':checkbox') && !$(element).prop('checked') ) {
				value = null;
			}
			if( $(element).is(':radio') ) {
				var checkedValue = $(element).closest('form').find("[name='" + $(element).attr('name') + "']:checked").val();
				
				value = ( checkedValue !== undefined ? checkedValue : null );
			}
			
			if( type == null ) {
				return value;
			}
			
			if( self.dataTypeConverters[type] != null && self.dataTypeConverters[type] !== undefined ) {
				if( value != null && value !== undefined && Array.isArray(value) ) {
					var values = [];
					for(var i = 0 ; i < value.length ; i ++) {
						values.push(self.dataTypeConverters[type](value[i], element));
					}
					return values;
				}
				return self.dataTypeConverters[type](value, element);
			}
			
			return null;
		},
		
		dataTypeConverters: {
			'integer': function(value, element) {
				if( value != null ) {
					var parsedValue = parseInt($.trim(value),10);
					if(!isNaN( parsedValue )) {
						return parsedValue;
					}
				}
				return null;
			},
			
			'float': function(value, element) {
				if( value != null ) {
					var parsedValue = parseFloat($.trim(value));
					if(!isNaN( parsedValue )) {
						return parsedValue;
					}
				}
				return null;
			},
			
			'boolean': function(value, element) {
				if( value != null ) {
					var trimmedValue = $.trim(value);
					var trueValues = ['1','true','on','yes'];
					for(var i = 0 ; i < trueValues.length ; i ++) {
						if( trimmedValue === trueValues[i]) {
							return true;
						}
					}
				}
				return false;
			},
			
			'date': function(value, element) {
				if( value != null ) {
					var datetime = $.trim(value);
					if( datetime.length > 0 ) {
						var format = $(element).data('format');
						if( format == null || format === undefined ) {
							format = "DD/MM/YYYY";
						}
						
						var momentDate = moment(datetime, format);
						if( momentDate != null && momentDate !== undefined ) {
							var targetFormat = $(element).data('targetFormat');
							if( targetFormat == null || targetFormat === undefined ) {
								targetFormat = "YYYY-MM-DDTHH:mm:ss";
							}
							return momentDate.valueOf();
						}
					}
				}
				return null;
			},

			'timestamp': function(value, element) {
				if( value != null ) {
					var datetime = $.trim(value);
					if( datetime.length > 0 ) {
						var format = $(element).data('format');
						if( format == null || format === undefined ) {
							format = "DD/MM/YYYY";
						}

						var momentDate = moment(datetime, format);
						if( momentDate != null && momentDate !== undefined ) {
							return momentDate.toDate().getTime();
						}
					}
				}
				return null;
			},
			
			'notEmptyString': function(value, element) {
				if( value != null ) {
					var parsedValue = $.trim(value);
					if( parsedValue.length > 0 ) {
						return parsedValue;
					}
				}
				return null;
			},
			
			'textparts': function(value, element) {
       			var textParts = {};
       			var partSize = $(element).data('partSize');
       			var partCount = $(element).data('partCount');
       			
				var remainingText = value;
	       		for(var i = 0; i < partCount; i ++) {
	       			var partText = remainingText;
	       			if( partText != null && partText.length > partSize ) {
	       				remainingText = partText.substring(partSize, partText.length);
	       				partText = partText.substring(0, partSize);
	       			} else {
	       				remainingText = null;
	       			}
	       			textParts['part' + (i + 1)] = partText;
	       		}
				return textParts;
			}
		},
	}); // Finaliza el extend

	return new ObjectSerializer();	
});
//# sourceURL=/form-venta-ecco-ap/js/libs/framework/views/util/objectSerializer.js