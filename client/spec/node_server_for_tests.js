var signalfire = require('../../lib/signalfire');

var connectedPeers={};

var sf=signalfire.listen(3333,function(peer){
	peer.socket.on('addToRoom', function(data){
		addToRoom(data.roomName,peer);
		if(connectedPeers[data.roomName].length>1){
			var peer1 = connectedPeers[data.roomName][0];
			var peer2 = connectedPeers[data.roomName][1];

			peer1.connectToPeer(peer2);
		}
	});



	peer.socket.on('testServerRequest', function(data){
		peer.socket.emit(data.requestType, data.data);
	});

	peer.socket.on('disconnectAll', function(data){
		var curPeer;
		while(curPeer = connectedPeers[data.room].pop()){
			curPeer.socket.disconnect();
		}
	});

},function(error){});


var addToRoom = function(roomName, peer){
	if(typeof connectedPeers[roomName] === 'undefined'){
		connectedPeers[roomName] = [];
	}

	connectedPeers[roomName].push(peer);
};