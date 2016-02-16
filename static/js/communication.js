/*
'communication.js' handles all the communication details with
the driver via crossbar.io with WAMP along with 'socketHandler.js'

aubahn.min.js required...
<script type="text/javascript" src="./js/autobahn.min.js"></script>

/*




/* GLOBAL VARIABLES */

var globalConnection1;
//var globalDriverConnection;
//var globalLabwareConnection;
//var globalBootloaderConnection;
var id;
var driver_id;

/* Initialize communication */

window.addEventListener ('load', function() {

	// Initialize the server/router url based off where the file came from
	var wsuri;
 	if (document.location.origin == "file://") {
		wsuri = "ws://127.0.0.1:8080/ws";
	} else {
    	//wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//0.0.0.0:8080/ws";
    	wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//10.10.1.2:8080/ws";
    	console.log("IT WORKED: " + wsuri);
    	//document.location.host + "/ws";
	}

	// Initialize the WAMP connection to the Router
	var connection1 = new autobahn.Connection({
		url: wsuri,
		realm: "ot_realm"
	});

	// Make connection accessible across the entire document
	globalConnection1 = connection1;

	connection1.onclose = function () {
		//TODO: whatever happens onclose
	};

	// When we open the connection, subscribe and register any protocols
	connection1.onopen = function(session) {
		
		// TODO: things that happens onopen
		// Subscribe and register all function end points we offer from the 
		// javascript to the other clients (ie python)

		connection1.session.subscribe('com.opentrons.driver_client_ready', function(status){
			console.log('driver_client_ready called');
		});

		//connection1.session.publish('com.opentrons.driver_handshake', [true]);
		sendMessage('com.opentrons.driver_handshake','','handshake','driver','extend','');
		
		connection1.session.subscribe('com.opentrons.frontend', function(str) {
			try{
				console.log('message on com.opentrons.frontend:\n'+str);
				var msg = JSON.parse(str);
				// TODO: add socketHandler here
				/* add socketHandler here */

				var msg = JSON.parse(str);
        		//if(msg.type && socketHandler[msg.type]) socketHandler[msg.type](msg.data);
        		//
        		// socketHandler format is no longer {'type': ... , 'data': ... }
        		// now it's {'name' , '' } ... TODO: run a test to confirm format and then finish this

				if (msg.type){
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

	};
	connection1.open();
});


/* Send messages function */

function sendMessage (topic,to,type,name,mess,param) {
	try{
		var msg = {
			'to':to,
			'from':id,
			'type':type,
			'data':{'name':name,'message':{}}
		};
		msg.data.message[message] = param;
		console.log('sending a message on ',topic,':\n'+JSON.stringify(msg));
		globalConnection1.session.publish(topic, [JSON.stringify(msg)]);
	} catch(e) {
		console.log('error sending message');
		console.log(e.message);
	}
}