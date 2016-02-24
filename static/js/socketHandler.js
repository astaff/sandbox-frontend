/*
'socketHandler.js' handles messages coming from the driver. It consists of
a single variable that is an object whose methods are programmatically added
to for each "configuration tab". The methods here are the "core" methods.
*/

var socketHandler = {
	'handshake' : (function(){
		return function(data) {
			if (data.data.message.hasOwnProperty('result')) {
				if (data.data.message.result == 'success') {
					console.log('data.to: ',data.to);
					console.log('data.from: ',data.from);
					console.log('data.type: ',data.type);
					console.log('data.data: ',data.data);
					id = data.to;
					driver_id = data.from;
					setCookie('otone-client-id',id,21);
					setCookie('otone-driver-id',driver_id,21);
					id_url_topic = 'com.opentrons.'+id;
					console.log('Seeting up subscribe for url topic ',id_url_topic);
					globalConnection1.session.subscribe(id_url_topic, function(str) {
						try{
							console.log('message on '+id_url_topic+': '+str);
							var msg = JSON.parse(str);
							// TODO: add socketHandler here
							/* add socketHandler here */

							var msg = JSON.parse(str);
			        		//if(msg.type && socketHandler[msg.type]) socketHandler[msg.type](msg.data);
			        		//
			        		// socketHandler format is no longer {'type': ... , 'data': ... }
			        		// now it's {'name' , '' } ... TODO: run a test to confirm format and then finish this

							if (msg.type) {
								console.log('socketHandler will be called here');
								if (socketHandler[msg.type]) socketHandler[msg.type](msg);
							} else {
								console.log('error, msg missing type');
							}
						} catch(e) {
							console.log('error handling message');
							console.log(e.message);
						}
					});
					sendMessage('com.opentrons.driver_handshake',driver_id,id,'handshake','driver','shake','');
				}
			}
		}
	})(),
	'test' : (function(){
		return function(data) {
			console.log(data);
		}
	})()
};