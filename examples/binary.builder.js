/*
	Simple module for adding binary data to a buffer.
	
*/
require ('../lib/oo')
Buffer = require('buffer').Buffer

exports.BinaryBuilder = Class({

	buffer: null,
	index: 0,
	
	init: function(maxLen){
		this.buffer = new Buffer(maxLen); 
	},
	
	//fill the entire buffer with val
	fill: function(val){
		
		for (var k = 0; k < this.buffer.length; k++)
			this.buffer[k] = val;
		
	},
	
	addChar: function(val){
	
		this.buffer[this.index++] = val & 0xff;
		return this;
	},

	// The following functions build big endian representations.
	
	addShort: function(val){
	
		this.buffer[this.index++] = (val >> 8) & 0xff;
		this.buffer[this.index++] = val & 0xff;
		return this;
	},
	
	addDword: function(val){

		this.buffer[this.index++] = (val >> 24) & 0xff;		
		this.buffer[this.index++] = (val >> 16) & 0xff;
		this.buffer[this.index++] = (val >> 8) & 0xff;
		this.buffer[this.index++] = val & 0xff;
		return this;
	},
	
	addString: function(str){
	
		this.buffer.write(str, this.index, 'ascii');
		this.index+=str.length;
		return this;
	},
	
	//adds a dword with the value str.length, then prepends the string str.
	addSizeString: function(str){
		this.addDword(str.length);
		this.addString(str);
		return this;
	},

	appendBuffer: function(buf){
		buf.copy(this.buffer, this.index);
		this.index += buf.length;
	},
	
	getBuffer: function(){
		
		var buf = new Buffer(this.index);
		this.buffer.copy(buf, 0, 0, this.index); 
		this.index = 0; 
		
		return buf; 
	}
});

















