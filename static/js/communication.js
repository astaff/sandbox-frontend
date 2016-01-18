/*
'communication.js' handles all the communication details with
the driver via crossbar.io with WAMP along with 'socketHandler.js'

aubahn.min.js required...
<script type="text/javascript" src="./js/autobahn.min.js"></script>

/*




/* GLOBAL VARIABLES */

var globalConnection


/* Initialize communication */

window.add EventListener ('load', function() {

	// Initialize the server/router url based off where the file came from
	var wsuri;
 	if (document.location.origin == "file://") {
		wsuri = "ws://127.0.0.1:8080/ws";
	} else {
    	wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//" + document.location.host + "/ws";
	}

	// Initialize the WAMP connection to the Router
	var connection = new autobahn.Connection({
		url: wsuri,
		realm: "ot_realm"
	});

	// Make connection accessible across the entire document
	globalConnection = connection;

	connection.onclose = function () {
		//TODO: whatever happens onclose
	};

	// When we open the connection, subscribe and register any protocols
	connection.onopen = function(session) {
		
		// TODO: stuff that happens onopen
		// Subscribe and register all function end points we offer from the 
		// javascript to the other clients (ie python)

		connection.session.subscribe('com.opentrons.driver_client_ready', function(status){
			console.log('driver_client_ready called');
		}

		connection.session.publish('com.opentrons.frontend_client_ready', [true]);
		
		connectoin.session.subscribe('com.opentrons.driver_to_frontend', function(str) {
			try{
				console.log('message on com.opentrons.driver_to_frontend: '+str);
				var msg = JSON.parse(str);
				// TODO: add socketHandler here
				/* add socketHandler here */

				var msg = JSON.parse(str);
        		if(msg.type && socketHandler[msg.type]) socketHandler[msg.type](msg.data);

/*


    connection.session.subscribe('com.opentrons.robot_to_browser', function(str) {
      try{
        if(debug===true){
          if(verbose===true || str[0]!==str_last){
            console.log('message on com.opentrons.robot_to_browser: '+str[0])
          }
        }
        str_last = str[0];
        var msg = JSON.parse(str);
        if(msg.type && socketHandler[msg.type]) socketHandler[msg.type](msg.data);
        else console.log('error handling message (1): '+str);
        
      } catch(error) {
        console.log('error handling message (2)');
        console.log(error.message);
      }
    });


*/






				if (msg.type){
					console.log('socketHandler will be called here');
				} else {
					console.log('error, msg missing type');
				}
			} catch(e) {
				console.log('error handling message');
				console.log(e.message);
			}
		});
	};
	connection.open();
});


/* Send messages function */

function sendMessage (msg) {
	try{
		console.log('sending a message: '+JSON.stringify(msg));
		globalConnection.session.publish('com.opentrons.frontend_to_driver', [JSON.stringify(msg)]);
	} catch(e) {
		console.log('error sending message');
		console.log(e.message);
	}
}