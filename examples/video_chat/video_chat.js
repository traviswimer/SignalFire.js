(function(){

// stores an array of peer connections
var connectedPeers = [];

// The DOM element holding the video elements
var videosList = document.getElementById('videos');

// create the user's A/V stream
var myStream;
getUserMedia(
	{
		audio: true,
		video: true
	},
	function(stream) {
		myStream = stream;
		addVideoStreamToList(stream);
	},
	function(err){
		console.log("getUserMedia failure:");
		console.log(err);
	}
);


//////////////////////
// DOM interactions //
/*********************************************************************************/

	// Adds a video object for viewing
	function addVideoStreamToList(stream){
		var videoURL = URL.createObjectURL(stream);
		var newVideoElement = document.createElement('video');
		newVideoElement.className = "video";
		newVideoElement.src = videoURL;
		videosList.appendChild(newVideoElement);
		newVideoElement.play();

		var allVideos = videosList.children;
		var vidRows = Math.ceil( Math.sqrt(allVideos.length) );

		var vidHeight = Math.floor(550/vidRows);
		for(var i=0; i<allVideos.length; i++){
			allVideos[i].style.height = vidHeight + "px";
		}

		return newVideoElement;
	}

/*_______________________________________________________________________________*/






/////////////////////////
// Connector Functions //
/*********************************************************************************/


	///////////////////////////
	// Main SignalFire setup //
	///////////////////////////
	var setupInterval = setInterval(initialSetup, 500);
	function initialSetup(){
		if(myStream){
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
			clearInterval(setupInterval);
		}
	}
	///////////////////////////



	//////////////////////////////////////////////////////////////
	// Sets up a connection (works for both chrome and firefox) //
	//////////////////////////////////////////////////////////////

	function makeConnector(setConnection, isAnswer){
		try{

			var newConnection = new RTCPeerConnection(
				{
					"iceServers": [{ "url": "stun:173.194.73.127:19302" }]
				}
			);

			var peerVideoElement;

			// handle incoming video stream
			newConnection.onaddstream = function(evt){
				peerVideoElement = addVideoStreamToList(evt.stream);
			};

			// remove video on disconnect
			newConnection.onclose = function(){
				if(peerVideoElement){
					peerVideoElement.parentNode.removeChild(peerVideoElement);
				}
			};

			// Add the video stream to the connection
			newConnection.addStream(myStream);


			// Callback
			setConnection(newConnection);

		}catch(e){
			console.dir(e);
		}
	}

	///////////////////////////////////////////////




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





/*_______________________________________________________________________________*/

}());
