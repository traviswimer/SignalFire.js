/**********************************/
/* Signalfire Javascript Library  */
/* Version: 0.0.1                 */
/*                                */
/* Copyright 2013 Travis Wimer    */
/* http://traviswimer.com         */
/*                                */
/* Released under the MIT license */
/**********************************/

(function(){

var signalfire = function(){



//  //  //  //  /
/////////////////
// Peer Object //
/*****************************************************************************/
	var createPeer=function(socket, options){


	/////////////////////////////////////
	// Peer Object's Private Variables //
	//////////////////////////////////////////////////
	//                                              //
		var self;

		//holds the ids of the peers that are connecting
		var connectingPeers={};


		// holds function to call when server requests a connection offer
		// or provides a connection offer
		var makeRTCPeer = options.connector || function(){};

		// holds function to call when signaling process is complete
		var signalingComplete = options.onSignalingComplete || function(){};



		// The Peer class
		function Peer(socket){
			this.socket = socket;
			self=this;


			// listen for server requesting offer
			self.socket.on('serverRequestingOffer', sendOfferToServer);

			// detect receiving an offer from server
			self.socket.on('serverSendingOffer', sendAnswerToServer);

			// listen for ice candidates
			self.socket.on('serverSendingAnswer', receiveAnswerFromServer);

			// listen for ice candidates
			self.socket.on('serverSendingIce', receiveIceCandidate);

		}
	//                                              //
	//////////////////////////////////////////////////



	///////////////////////////////////
	// Peer Object's Private Methods //
	//////////////////////////////////////////////////
	//                                              //

		// Receive offer request and return an offer
		var sendOfferToServer = function(data){

			// create RTCPeerConnection
			var rtcPeerConnection=makeRTCPeer();

			// initialize ice candidate listeners
			iceSetup(rtcPeerConnection, data);


			// Add connection to list of peers
			connectingPeers[data.peerId] = rtcPeerConnection;


			// create offer and send to server
			rtcPeerConnection.createOffer(function(offerResponse){
				data.offer = offerResponse;
				rtcPeerConnection.setLocalDescription(offerResponse, function(){
					socket.emit('clientSendingOffer', data);
				});
			});
		};


		// Receive peer offer from server. Return an answer.
		var sendAnswerToServer = function(data){

			// create RTCPeerConnection
			var rtcPeerConnection=makeRTCPeer();

			// initialize ice candidate listeners
			iceSetup(rtcPeerConnection, data);

			// Add connection to list of peers
			connectingPeers[data.peerId] = rtcPeerConnection;

			// Create description from offer received
			var offer = new RTCSessionDescription(data.offer);

			// Set Description, create answer, send answer to server
			rtcPeerConnection.setRemoteDescription(offer, function(){
				rtcPeerConnection.createAnswer(function(answer){
					rtcPeerConnection.setLocalDescription(answer);
					var answerData={
						peerId:data.peerId,
						answer:answer
					};
					socket.emit('clientSendingAnswer', answerData);
				});
			});

		};


		// Receive peer answer from server
		var receiveAnswerFromServer = function(data){

			var peerConn = connectingPeers[data.peerId];

			var answer = new RTCSessionDescription(data.answer);
			peerConn.setRemoteDescription(answer, function(){

			});

		};

		// receive ice candidates from server
		var receiveIceCandidate = function(data){
			if(data.candidate !== null){
				connectingPeers[data.peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
			}
		};


		// setup ice candidate handling
		var iceSetup = function(rtcPeerConnection, data){
			// check if connection has been created
			rtcPeerConnection.onicechange=function(evt){
				if(rtcPeerConnection.iceConnectionState === 'connected'){
					signalingComplete(rtcPeerConnection);
				}
			};

			// listen for ice candidates and send to server
			rtcPeerConnection.onicecandidate = function(iceData){
				var sendingIceInfo = {
					peerId: data.peerId,
					candidate: iceData.candidate
				};
				socket.emit('clientSendingIce', sendingIceInfo);
			};
		};



	//                                              //
	//////////////////////////////////////////////////



		// Return an instance of the Peer class
		return new Peer(socket);
	};

/*____________________________________________________________________________*/



//  //  //  //  //  
////////////////////
// Public Methods //
/*****************************************************************************/

	var connect = function(options, successCallback, failCallback){
		/*
		Options:
			"server" - The url + port of the server to connect to
			"connector" - A function that is called when the server requests
						an RTC offer. Must return an RTCPeerConnction object.
		*/

		if(typeof options != 'object'){
			return false;
		}

		var socket = io.connect(options.server, {'force new connection': true});

		socket.on('connect', function () {
			var peer;
			try{
				peer = createPeer(socket, options);
			}catch(e){
				failCallback(e);
			}finally{
				successCallback(peer);
			}
		});

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