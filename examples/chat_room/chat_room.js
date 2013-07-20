(function(){

// stores an array of peer connections
var connectedPeers = [];

// The main chat box DOM element
var chatBox = document.getElementById('chat_box');

// flag for when the app is still setting up the connection
var isInitializing = true;

// holds the user's username
var myUserName;


//////////////////////
// DOM interactions //
/*********************************************************************************/

	// handles "send" button click
	document.getElementById('chat_form').onsubmit = sendMessge;
	function sendMessge(){
		var newMsg = document.getElementById('chat_input').value;
		var sendObject = {};

		if(myUserName){
			sendObject.msg = newMsg;
			addToBox(myUserName, newMsg);
		}else{
			myUserName = newMsg;
			sendObject.username = newMsg;

			chatBox.innerHTML = "";
			document.getElementById('chat_submit').value = "Send";
			document.getElementById('chat_input').placeholder = "Type Message...";
			document.getElementById('chat_input').value = "";
		}

		var sendString = JSON.stringify(sendObject);

		// loops through each peer and sends them the message
		for(var i=0; i<connectedPeers.length; i++){
			if(connectedPeers[i].dataChannel.readyState === "open"){
				connectedPeers[i].dataChannel.send(sendString);
			}else{
				console.log("Connection not open");
			}
		}
		return false;
	}

	// Adds a chat message to the chat box
	var addToBox = function(name, msg){
		var msgContainer=document.createElement("div");
		msgContainer.className = "chat-message-container";

		var msgName=document.createElement("div");
		msgName.className = "chat-name";
		msgName.innerHTML = name;

		var msgMsg=document.createElement("div");
		msgMsg.className = "chat-message";
		msgMsg.innerHTML = msg;

		msgContainer.appendChild(msgName);
		msgContainer.appendChild(msgMsg);
		chatBox.appendChild(msgContainer);

		document.getElementById('chat_input').value = "";
	};


	// Is called when datachannel is open...
	function dataChannelWasOpened(channel){
		if(isInitializing === true){
			document.getElementById('chat_form').style.display = "block";
			isInitializing = false;
		}

		if(myUserName){
			var nameMsg = JSON.stringify({"username": myUserName});
			channel.send(nameMsg);
		}
	}

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

					var dataObject = JSON.parse(event.data);

					// All messages should either provide peer's username
					// or a new chat message
					if(dataObject.username){
						newConnection.username = dataObject.username;
					}else if(dataObject.msg){
						addToBox(newConnection.username, dataObject.msg);
					}

				};

				event.channel.onopen = function(){
					if(isInitializing){
						chatBox.innerHTML = "DataChannel open. You're ready to Chat!";
					}
					console.log("Datachannel is open");
					dataChannelWasOpened(event.channel);
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

					if(isInitializing){
						chatBox.innerHTML = "Peer Signaling in progress";
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

				newConnection.dataChannel = event.channel;
				connectedPeers.push(newConnection);

				setConnection(newConnection);
				event.channel.onmessage = function(event){
					console.log("Recieved a message:");
					console.log(event.data);
					
					var dataObject = JSON.parse(event.data);

					// All messages should either provide peer's username
					// or a new chat message
					if(dataObject.username){
						newConnection.username = dataObject.username;
					}else if(dataObject.msg){
						addToBox(newConnection.username, dataObject.msg);
					}
				};

				event.channel.onopen = function () {

					if(isInitializing){
						chatBox.innerHTML = "DataChannel open. You're ready to Chat!";
					}
					console.log("Datachannel is open");
					dataChannelWasOpened(event.channel);
				};
			};



			if(!isAnswer){
				var channelOptions = {reliable: false};
				createDataChannel(newConnection, channelOptions);
				connectedPeers.push(newConnection);
			}


			if(isInitializing){
				chatBox.innerHTML = "Peer Signaling in progress";
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

			if(isInitializing){
				chatBox.innerHTML = "DataChannel open. You're ready to Chat!";
			}
			console.log("Datachannel is open");
			dataChannelWasOpened(clientChannel);
		};

		clientChannel.onmessage = function(event){
			console.log("Recieved a message:");
			console.log(event.data);

			var dataObject = JSON.parse(event.data);

			// All messages should either provide peer's username
			// or a new chat message
			if(dataObject.username){
				connection.username = dataObject.username;
			}else if(dataObject.msg){
				addToBox(connection.username, dataObject.msg);
			}
		};
		clientChannel.onerror = function(err){
			console.log("Error: "+err);
		};
	}

	///////////////////////////////////////


/*_______________________________________________________________________________*/

}());
