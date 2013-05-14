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
},function(error){});


var addToRoom = function(roomName, peer){
	if(typeof connectedPeers[roomName] === 'undefined'){
		connectedPeers[roomName] = [];
	}

	connectedPeers[roomName].push(peer);
};