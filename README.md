BinaryParser
============

BinaryParser is a node.js module which facilitates parsing of binary data received from the network or from a local file.
BinaryParser lets you define the data format using javascript object notation and allows for parsing of complex binary streams.
Callbacks are called whenever a binary field has been received and the data format can be changed on-the-fly. 

Include the binary parser

	const bp = require ('binaryparser').BinaryParser;

Create an instance of the parser:
	
	var parser = new bp.BinaryParser();


Feed the buffers from the network to the binary parser
	
	socket.on("data", function(data){
		parser.addBuffer(data);
	});	


Define a data format and process the parsed data:

	parser.setFormat({
		fileSize: bp.dword(function(size){
			util.puts("File size is " + size);
		}),
	
		fileData: bp.bits('fileSize', function(data){
			util.puts("File data received: " + data.length + " bytes");
		})
	});


Documentation
=============

Data types
----------

The following data types are supported:


	char8: 8 bits unsigned
	ushort: 16 bits unsigned
	dword: 32 bits unsigned
	bits(size): a buffer of size bytes.

Data types are functions inside the BinaryParser namespace and take a callback as parameter:

	myField: bp.dword([callback])

Where callback is the function called when the field has been parsed.

The bp.bits type is defined as:

	myBits: bp.bits(size, callback)

The size parameter can be a number or a string which references a previous field in current format:

	file = {
		dataSize: bp.dword(),
		data: bp.bits('dataSize', function(bits){});
	}

	parser.setFormat(file);



Processing order
----------------

Fields are parsed in the order they are defined in the format. If nested formats are present, parsing is resumed at the next field after the nested format has been consumed.
onFinished callback is called for the current format.

Context
-------

Every field callback has the context (this) set to the current format, so fields in current format can be accessed with this.fieldName.

	parser.setFormat({
		chunkType: bp.dword(function(value){
			util.puts(value);
			//same as
			util.puts(this.chunkType);
		})
	});

Nested formats
--------------

You can nest multiple formats and you can call setFormat inside a field callback. After the new format was processed, the next field from the parent 
format will be the active field.

	parser.setFormat({
	
		header: bp.dword(),

		packet: {
			__repeat: 'forever',
			type: bp.char8(function(type){
				if (type === 0){
					parser.setFormat({
						checksum: bp.dword(function(checksum){
							util.puts('checksum is ' + this.checksum);
						})
					});
				}
			}),
			size: bp.ushort(),
			data: bp.bits('size'),
			onFinished: function(){
				//this refers to current format
				util.puts('packet type is ' + this.type);
				util.puts('packet size is ' + this.size);
				util.puts('packet data is ' + this.data.toString());
			}
		}
	});

Special fields
--------------

Some field names are reserved and have a special meaning. These are:

formatName: string

Optional name for the format. Useful for debugging.

__repeat: 'forever' or number or reference.
if __repeat is a number, the format will be parsed the specified number of times.
if __repeat is 'forever', the parser will always repeat this format.
if a different string is passed, it specifies a field name which is evaluated when the data is received.

Examples:

	//read 4 bytes from the stream and print the values
	parser.setFormat({
		__repeat: 4,
		value: char8(function(val){
			util.puts('The byte value is ' + val);
		});
	});

	//receive files clustered in groups: 
	//group1: [nFiles][ file1, file2, file_nFiles], group2: [nFiles][file1, file2, file...], ..., groupn: [nFiles][....],....

	parser.setFormat({
		__repeat: 'forever',
		nFiles: bp.char8(),
		files: {
			__repeat: 'nFiles',	//determined automatically 
			size: bp.dword(),
			data: bp.bits('size'),
			onFinished: function(){
				util.puts('File received. ' + this.size + ' bytes');
			}
		}
	})


onFinished: callback
This callback is called whenever the current format has been processed.



Methods

parser.setByteOrder(order) 

order: "le" or "be"
Meaning the data has 'little endian' or 'big endian' byte order. Default is 'le'.


parser.addBuffer(buffer)

Feed a data buffer to the parser. The parser will process the data, call the callbacks on the formats specified and stop when it runs out of data or the format is finished.
Usually used in a data io callback:
socket.on("data"), function(data){
	parser.addBuffer(data);
});


parser.endStream()

Tells the parser that no more buffers will arrive. Parser will process remaining bytes and when it runs out of data, processing is stopped and onFinished() callback is called 
on current format.


Debugging
---------

	const bp = require('binaryparser');
	bp.setDebug(true)

Enables logging of the parser's state. Useful when debugging the data stream.


xxx. Acknowledgements

BinaryParser uses Bufferlist module Copyright 2010 James Halliday (mail@substack.net).
Partly inspired by http://substack.net/posts/cb328d
Uses  OO - Class - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed) whish is based on http://ejohn.org/blog/simple-javascript-inheritance/



