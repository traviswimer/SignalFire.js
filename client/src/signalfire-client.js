/**********************************/
/* Signalfire Javascript Library  */
/* Version: 0.0.6                 */
/*                                */
/* Copyright 2013 Travis Wimer    */
/* http://traviswimer.com         */
/*                                */
/* Released under the MIT license */
/**********************************/

(function(){

var signalfire = function(){


/////////////////
// Peer Object //
/*****************************************************************************/
	var createPeer = function(socket, options, failCallback){

	////////////////////////////////
	// Peer Object Initialization //
	//////////////////////////////////////////////////
	//                                              //

		// The Peer object
		var peerObject = {
			socket: socket
		};


		// listen for server requesting offer
		peerObject.socket.on('serverRequestingOffer', sendOfferToServer);

		// detect receiving an offer from server
		peerObject.socket.on('serverSendingOffer', sendAnswerToServer);

		// listen for server sending an answer
		peerObject.socket.on('serverSendingAnswer', receiveAnswerFromServer);

		// listen for ice candidates
		peerObject.socket.on('serverSendingIce', receiveIceCandidate);

	//                                              //
	//////////////////////////////////////////////////


	/////////////////////////////////////
	// Peer Object's Private Variables //
	//////////////////////////////////////////////////
	//                                              //

		// holds the RTCPeerConnections of peers
		var connectingPeers = {};

		// holds ice candidates for uninitialized peer connections
		var storedIceCandidates = {};


		// holds function to call when server requests a connection offer
		// or provides a connection offer
		var makeRTCPeer = options.connector;

		// holds function to call when signaling process is complete
		var signalingComplete = options.onSignalingComplete || function(){};

		// holds function to call when signaling fails
		var signalingFail = options.onSignalingFail || function(){};

	//                                              //
	//////////////////////////////////////////////////



	///////////////////////////////////
	// Peer Object's Private Methods //
	//////////////////////////////////////////////////
	//                                              //

		// Receive offer request and return an offer
		function sendOfferToServer(data){

			// fail if required data is not received
			if(!data || !data.peerId){
				signalingFail('Invalid data recieved from server');
				return;
			}

			// create RTCPeerConnection
			makeRTCPeer(function(rtcPeerConnection){
				// initialize ice candidate listeners
				iceSetup(rtcPeerConnection, data);

				// Add connection to list of peers
				connectingPeers[data.peerId] = rtcPeerConnection;

				// create offer and send to server
				rtcPeerConnection.createOffer(
					function(offerResponse){

						// Increase the size limit for datachannels
						var removeSizeLimit = offerResponse.sdp.split("b=AS:30");
						if(removeSizeLimit.length > 1){
							offerResponse.sdp = removeSizeLimit[0] + "b=AS:1638400" + removeSizeLimit[1];
						}

						data.offer = offerResponse;
						rtcPeerConnection.setLocalDescription(offerResponse, function(){
							socket.emit('clientSendingOffer', data);
						});
					},
					null,
					{
						optional: [],
						mandatory: {
							OfferToReceiveAudio: true,
							OfferToReceiveVideo: true
						}
					}
				);
			}, false);
		}


		// Receive peer offer from server. Return an answer.
		function sendAnswerToServer(data){

			// fail if required data is not received
			if(!data || !data.peerId || !data.offer){
				signalingFail('Invalid data recieved from server');
				return;
			}

			// create RTCPeerConnection
			makeRTCPeer(function(rtcPeerConnection){
				// initialize ice candidate listeners
				iceSetup(rtcPeerConnection, data);

				// Add connection to list of peers
				connectingPeers[data.peerId] = rtcPeerConnection;

				// Create description from offer received
				var offer = new RTCSessionDescription(data.offer);

				// Set Description, create answer, send answer to server
				rtcPeerConnection.setRemoteDescription(offer, function(){
					rtcPeerConnection.createAnswer(

						function(answer){
							rtcPeerConnection.setLocalDescription(answer);
							var answerData = {
								peerId:data.peerId,
								answer:answer
							};
							socket.emit('clientSendingAnswer', answerData);
						},
						null,
						{
							optional: [],
							mandatory: {
								OfferToReceiveAudio: true,
								OfferToReceiveVideo: true
							}
						}
					);
				});
			}, true);

		}


		// Receive peer answer from server
		function receiveAnswerFromServer(data){

			// fail if required data is not received
			if(!data || !data.peerId || !data.answer){
				signalingFail('Invalid data recieved from server');
				return;
			}

			var peerConn = connectingPeers[data.peerId];

			var answer = new RTCSessionDescription(data.answer);
			peerConn.setRemoteDescription(answer, function(){

			});

		}

		// receive ice candidates from server
		function receiveIceCandidate(data){

			// If peer connection has not started, save ice candidates for later
			// otherwise add them to the connection
			if(typeof connectingPeers[data.peerId] == 'undefined'){
				if(!storedIceCandidates[data.peerId]){
					storedIceCandidates[data.peerId] = [];
				}
				if(data && data.candidate !== null){
					storedIceCandidates[data.peerId].push(data);
				}
			}else{
				if(data && data.candidate !== null){
					connectingPeers[data.peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
				}
			}
		}


		// setup ice candidate handling
		function iceSetup(rtcPeerConnection, data){
			//////////////////////////////////////////////
			// Determine if connection has been created //
			//////////////////////////////////////////////

			// These are the callbacks implemented by Chrome
			rtcPeerConnection.oniceconnectionstatechange = rtcPeerConnection.onicechange = function(evt){
				if(rtcPeerConnection.iceConnectionState === 'connected'){
					signalingComplete(rtcPeerConnection);

					// developer is expected to store rtc connection within
					// their app, so it can be removed from the list
					delete connectingPeers[data.peerId];
				}
			};

			// These are the callbacks implemented by Firefox
			rtcPeerConnection.ongatheringchange = function(){
				if(rtcPeerConnection.readyState === 'active'){
					signalingComplete(rtcPeerConnection);

					// developer is expected to store rtc connection within
					// their app, so it can be removed from the list
					delete connectingPeers[data.peerId];
				}
			};

			//////////////////////////////////////////////



			// listen for ice candidates and send to server
			rtcPeerConnection.onicecandidate = function(iceData){
				var sendingIceInfo = {
					peerId: data.peerId,
					candidate: iceData.candidate
				};
				socket.emit('clientSendingIce', sendingIceInfo);
			};

			// check for ice candidates already recieved from peer and add them
			var hasVisited = false;
			if(storedIceCandidates[data.peerId]){
				while(hasVisited === false && storedIceCandidates[data.peerId].length > 0){
					hasVisited = true;
					receiveIceCandidate(storedIceCandidates[data.peerId].pop());
				}

				// array will no longer be used, so remove reference
				delete storedIceCandidates[data.peerId];
			}

		}



	//                                              //
	//////////////////////////////////////////////////



		// Return the Peer object
		return peerObject;
	};

/*____________________________________________________________________________*/



////////////////////
// Public Methods //
/*****************************************************************************/

	var connect = function(options, successCallback, failCallback){
		/*
			--OPTIONS--
			"server" - The url + port of the server to connect to

			"connector" - A function that is called when the server requests
						an RTC offer. Must return an RTCPeerConnction object.

			"onSignalingComplete" - Callback function for when the signaling 
						process has successfully created a peer connection.

			"onSignalingFail" - Callback function for when there is an error 
						in the signaling process.
		*/

		// Check if options are valid
		failCallback = failCallback || function(e){throw e;};
		if(typeof options != 'object' || typeof options.connector != 'function'){
			failCallback('Invalid option provided');
			return;
		}


		// Create new socket connection
		var socket;
		if(typeof options.server === "string"){
			// Server is a URL string for the server/port to connect to
			try{
				socket = io.connect(options.server, {'force new connection': true});
			}catch(e){
				failCallback(e);
			}
		}else{
			// Server is an object that provides a socket-like API
			socket = options.server;
		}

		// Create new peer once connected
		socket.on('connect', function () {
			var peer;
			try{
				peer = createPeer(socket, options, failCallback);
			}catch(e){
				failCallback(e);
			}finally{
				successCallback(peer);
			}
		});

		// detect connection error
		socket.on('connect_error', function(e){
			failCallback(e);
		});

		return socket;
	};

	return {
		connect:connect
	};

/*____________________________________________________________________________*/

};

// set the signalfire global variable
window.signalfire = signalfire();

}());