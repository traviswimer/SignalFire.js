/**********************************/
/* Signalfire Javascript Library  */
/* Version: 0.0.2                 */
/*                                */
/* Copyright 2013 Travis Wimer    */
/* http://traviswimer.com         */
/*                                */
/* Released under the MIT license */
/**********************************/


var io = require('socket.io');

module.exports = function(){

	// Is used to give each peer a unique ID
	var peerIdCounter = 0;

	// create next ID and return it
	var incrementPeerIdCounter = function(){
		peerIdCounter++;
		return peerIdCounter;
	};





/////////////////
// Peer Object //
/*****************************************************************************/
	var createPeer = function(socket){



	////////////////////////////////
	// Peer Object Initialization //
	//////////////////////////////////////////////////
	//                                              //

		// The Peer object
		var peerObject = {
			'socket': socket
		};

		// listen for client sending offer
		peerObject.socket.on('clientSendingOffer', receiveOfferFromClient.bind(peerObject));

		// detect receiving an answer from clietn
		peerObject.socket.on('clientSendingAnswer', receiveAnswerFromClient.bind(peerObject));

		// listen for ice candidates
		peerObject.socket.on('clientSendingIce', receiveIceCandidate.bind(peerObject));

	//                                              //
	//////////////////////////////////////////////////


	/////////////////////////////////////
	// Peer Object's Private Variables //
	//////////////////////////////////////////////////
	//                                              //

		var id = incrementPeerIdCounter();

		// holds the peerConnect offer for this peer
		var offer;

		// list of peers that can connect
		var connectingPeers = {};

	//                                              //
	//////////////////////////////////////////////////



	//////////////////////////////////
	// Peer Object's Public Methods //
	//////////////////////////////////////////////////
	//                                              //
		// Initiates signaling process
		peerObject.connectToPeer = function(peer){
			// answering peer starts waiting for an offer
			peer.acceptOfferFrom(this);

			// This peer will make an offer
			this.makeOfferRequest(peer);
		};

		// Request a peerConnection offer from the current peer
		peerObject.makeOfferRequest = function(peer){

			// add peer to list of accepted requests
			connectingPeers[peer.getPeerId()] = peer;

			// If the peer disconnects, remove them
			removePeerOnDisconnect(peer);

			// ask client for an offer
			this.socket.emit('serverRequestingOffer', {peerId:peer.getPeerId()});
		};

		// Accept peerConnection offers from the specified peer
		peerObject.acceptOfferFrom = function(peer){

			// add peer to list of accepted requests
			connectingPeers[peer.getPeerId()] = peer;

			// If the peer disconnects, remove them
			removePeerOnDisconnect(peer);

		};

		// getter for the peer ID
		peerObject.getPeerId = function(){
			return id;
		};

		// getter for the peer offer
		peerObject.getPeerOffer = function(){
			return offer;
		};


	//                                              //
	//////////////////////////////////////////////////



	///////////////////////////////////
	// Peer Object's Private Methods //
	//////////////////////////////////////////////////
	//                                              //

		// Handle an offer sent from the client
		function receiveOfferFromClient(data){
			offer = data.offer;

			sendOfferToClient.call(this, data.peerId);
		}

		// Send offer to the other peer
		function sendOfferToClient(peerId){

			// If peer exists, send offer
			if(connectingPeers[peerId]){
				connectingPeers[peerId].socket.emit(
					'serverSendingOffer',
					{
						peerId: this.getPeerId(),
						offer: offer
					}
				);
			}
		}

		// Send answer to initiating peer
		function receiveAnswerFromClient(data){
			var peerId = data.peerId;
			data.peerId = this.getPeerId();

			// If peer exists, send answer
			if(connectingPeers[peerId]){
				connectingPeers[peerId].socket.emit('serverSendingAnswer', data);
			}
		}

		//Handle ICE candidates received
		function receiveIceCandidate(data){
			var iceInfo = {
				peerId: this.getPeerId(),
				candidate: data.candidate
			};

			// If peer exists, send ICE candidate
			if(connectingPeers[data.peerId]){
				connectingPeers[data.peerId].socket.emit('serverSendingIce', iceInfo);
			}
		}


		// Removes peers that disconnect from the list
		function removePeerOnDisconnect(peer){
			peer.socket.on('disconnect', function () {
				var remotePeerId=peer.getPeerId();
				if(connectingPeers[remotePeerId]){
					delete connectingPeers[remotePeerId];
				}
			});
		}

	//                                              //
	//////////////////////////////////////////////////


		// Return an instance of the Peer class
		return peerObject;
	};

/*____________________________________________________________________________*/




/////////////////////////////
// Module's Public Methods //
/*****************************************************************************/

	// Initiates listening for signaling requests
	///////////////////////////////////////////////
	var listen = function(port, successCallback, failCallback){
		if(typeof port != 'number'){
			return false;
		}



		// Handle socket requests
		/////////////////////////////
		var server = io.listen(port);

		server.sockets.on('connection', function(socket){
			var peer;
			try{
				peer = createPeer(socket);
			}catch(e){
				failCallback(e);
			}finally{
				successCallback(peer);
			}
		});

		return server;
	};

	// Return the public methods
	return {
		listen:listen
	};

/*____________________________________________________________________________*/





}();