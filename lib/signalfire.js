/**********************************/
/* Signalfire Javascript Library  */
/* Version: 0.0.1                 */
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



	/////////////////////////////////////
	// Peer Object's Private Variables //
	//////////////////////////////////////////////////
	//                                              //

		var id;

		// holds the peerConnect offer for this peer
		var offer;

		// list of peers that can connect
		var connectingPeers = {};

		// The Peer class
		function Peer(socket){
			this.socket = socket;
			id = incrementPeerIdCounter();


			// listen for client sending offer
			this.socket.on('clientSendingOffer', receiveOfferFromClient.bind(this));

			// detect receiving an answer from clietn
			this.socket.on('clientSendingAnswer', receiveAnswerFromClient.bind(this));

			// listen for ice candidates
			this.socket.on('clientSendingIce', receiveIceCandidate.bind(this));

		}
	//                                              //
	//////////////////////////////////////////////////



	//////////////////////////////////
	// Peer Object's Public Methods //
	//////////////////////////////////////////////////
	//                                              //
		// Initiates signaling process
		Peer.prototype.connectToPeer = function(peer, successCallback, failCallback){
			// answering peer starts waiting for an offer
			peer.acceptOfferFrom(this);

			// This peer will make an offer
			this.makeOfferRequest(peer);
		};

		// Request a peerConnection offer from the current peer
		Peer.prototype.makeOfferRequest = function(peer){

			// add peer to list of accepted requests
			connectingPeers[peer.getPeerId()] = peer;

			// ask client for an offer
			this.socket.emit('serverRequestingOffer', {peerId:peer.getPeerId()});
		};

		// Accept peerConnection offers from the specified peer
		Peer.prototype.acceptOfferFrom = function(peer){

			// add peer to list of accepted requests
			connectingPeers[peer.getPeerId()] = peer;
		};

		// getter for the peer ID
		Peer.prototype.getPeerId = function(){
			return id;
		};

	//                                              //
	//////////////////////////////////////////////////



	///////////////////////////////////
	// Peer Object's Private Methods //
	//////////////////////////////////////////////////
	//                                              //

		// Handle an offer sent from the client
		var receiveOfferFromClient = function(data){
			offer = data.offer;

			sendOfferToClient.call(this, data.peerId);
		};

		// Send offer to the other peer
		var sendOfferToClient = function(peerId){
			connectingPeers[peerId].socket.emit(
				'serverSendingOffer',
				{
					peerId: this.getPeerId(),
					offer: offer
				}
			);
		};

		// Send answer to initiating peer
		var receiveAnswerFromClient = function(data){
			var peerId = data.peerId;
			data.peerId = this.getPeerId();
			connectingPeers[peerId].socket.emit('serverSendingAnswer', data);
		};


		//Handle ICE candidates received
		var receiveIceCandidate = function(data){
			var iceInfo = {
				peerId: this.getPeerId(),
				candidate: data.candidate
			};
			connectingPeers[data.peerId].socket.emit('serverSendingIce', iceInfo);
		};

	//                                              //
	//////////////////////////////////////////////////




		// Return an instance of the Peer class
		return new Peer(socket);
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