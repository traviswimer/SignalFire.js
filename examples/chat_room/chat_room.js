(function(){

// stores an array of peer connections
var connectedPeers = [];



//////////////////////
// DOM interactions //
/*********************************************************************************/

	// handles "send" button click
	document.getElementById('chat_submit').onclick = sendMessge;
	function sendMessge(){
		var newMsg = document.getElementById('chat_input').value;

		// loops through each peer and sends them the message
		for(var i=0; i<connectedPeers.length; i++){
			if(connectedPeers[i].dataChannel.readyState === "open"){
				connectedPeers[i].dataChannel.send(newMsg);
			}else{
				console.log("Connection not open");
			}
		}
		addToBox(newMsg);
	}

	// Adds a chat message to the chat box
	var addToBox = function(msg){
		var msgHTML=document.createElement("div");
		msgHTML.innerHTML=msg;
		document.getElementById('chat_box').appendChild(msgHTML);
		document.getElementById('chat_input').value = "";
	};

/*_______________________________________________________________________________*/






/////////////////////////
// Connector Functions //
/*********************************************************************************/


	///////////////////////////
	// Main SignalFire setup //
	///////////////////////////
	var options = {
		server: "http://localhost:3333",
		connector: makeConnector,
		onSignalingComplete: signalingComplete
	};
	var conn = signalfire.connect(options,function(){
		conn.emit('addToRoom',{
			roomName:"test"
		});
	});
	///////////////////////////



	///////////////////////////////////////////////
	// Sets up a connection depending on browser //
	///////////////////////////////////////////////

	function makeConnector(){
		if(webrtcDetectedBrowser && webrtcDetectedBrowser === "firefox"){
			makeFirefoxConnection.apply(this, arguments);
		}else{
			makeChromeConnection.apply(this, arguments);
		}
	}

	///////////////////////////////////////////////





	//////////////////////////////////
	// Sets up a firefox connection //
	//////////////////////////////////

	function makeFirefoxConnection(setConnection, isAnswer){
		try{

			var connOpts = {
				'optional': [
				{'DtlsSrtpKeyAgreement': true},
				{'RtpDataChannels': true }
				]
			};
			var newConnection = new RTCPeerConnection(
				{
					"iceServers": [{ "url": "stun:173.194.73.127:19302" }]
				},
				connOpts
			);


			// Fires if a datachannel is created by a peer
			// (Only used by answerer)
			newConnection.ondatachannel = function(event){
				console.log("Datachannel request recieved from peer");
				console.dir(event);

				newConnection.dataChannel = event.channel;
				connectedPeers.push(newConnection);

				setConnection(newConnection);
				event.channel.onmessage = function(event){
					console.log("Recieved a message:");
					console.log(event.data);
					addToBox(event.data);
				};
			};



			// Use fake audio stream to make webRTC work in firefox
			getUserMedia(
				{
					audio: true,
					fake: true
				},
				function(stream) {
					newConnection.addStream(stream);

					if(!isAnswer){
						var channelOptions = {reliable: true};
						createDataChannel(newConnection, channelOptions);
						connectedPeers.push(newConnection);
					}

					setConnection(newConnection);

				},
				function(err){
					console.log("Fake getUserMedia audio failure:");
					console.log(err);
				}
			);


		}catch(e){
			console.dir(e);
		}
	}

	//////////////////////////////////





	/////////////////////////////////
	// Sets up a Chrome connection //
	/////////////////////////////////

	function makeChromeConnection(setConnection, isAnswer){
		try{

			var connOpts = {
				'optional': [
				{'DtlsSrtpKeyAgreement': true},
				{'RtpDataChannels': true }
				]
			};
			var newConnection = new RTCPeerConnection(
				{
					"iceServers": [{ "url": "stun:173.194.73.127:19302" }]
				},
				connOpts
			);




			// Fires if a datachannel is created by a peer
			newConnection.ondatachannel = function(event){
				console.log("Datachannel request recieved from peer");
				console.dir(event);
				//connectedPeers.push({dataChannel: event.channel});

				newConnection.dataChannel = event.channel;
				connectedPeers.push(newConnection);

				setConnection(newConnection);
				event.channel.onmessage = function(event){
					console.log("Recieved a message:");
					console.log(event.data);
					addToBox(event.data);
				};
			};



			if(!isAnswer){
				var channelOptions = {reliable: false};
				createDataChannel(newConnection, channelOptions);
				connectedPeers.push(newConnection);
			}


			// Callback
			setConnection(newConnection);

		}catch(e){
			console.dir(e);
		}
	}

	//////////////////////////////////




	//////////////////////////////////////////////
	// Connection callback depending on browser //
	//////////////////////////////////////////////

	function signalingComplete(){
		if(webrtcDetectedBrowser && webrtcDetectedBrowser === "firefox"){
			firefoxComplete.apply(this, arguments);
		}else{
			chromeComplete.apply(this, arguments);
		}
	}

	///////////////////////////////////////////////




	////////////////////////////////
	// Firefox signaling complete //
	////////////////////////////////

	function firefoxComplete(rtcPeerConnection){
		console.log("Signaling Complete!");
	}

	////////////////////////////////



	///////////////////////////////
	// Chrome signaling complete //
	///////////////////////////////

	function chromeComplete(rtcPeerConnection){
		console.log("Signaling Complete!");
	}

	///////////////////////////////





	////////////////////////////
	// creates a data channel //
	////////////////////////////

	function createDataChannel(connection, channelOptions){
		var clientChannel = connection.createDataChannel("chat", channelOptions);

		connection.dataChannel = clientChannel;
		console.log("Datachannel Created");

		clientChannel.onopen = function () {
			console.log("Datachannel is open");
		};

		clientChannel.onmessage = function(event){
			console.log("Recieved a message:");
			console.log(event.data);
			addToBox(event.data);
		};
		clientChannel.onerror = function(err){
			console.log("Error: "+err);
		};
	}

	///////////////////////////////////////


/*_______________________________________________________________________________*/

}());
