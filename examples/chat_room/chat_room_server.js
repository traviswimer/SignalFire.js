var signalfire = require('../../lib/signalfire.js');

var connectedPeers={};

var sf=signalfire.listen(3333,function(peer){
	peer.socket.on('addToRoom', function(data){
		addToRoom(data.roomName,peer);
		var roomArray=connectedPeers[data.roomName];
		if(roomArray.length>1){
			for(var i=0; i<roomArray.length; i++){
				if(peer !== roomArray[i]){
					console.dir(peer);
					console.dir(roomArray[i]);
					peer.connectToPeer(roomArray[i]);
				}
			}
		}
	});
},function(error){
	console.log('something went wrong');
});


var addToRoom = function(roomName, peer){
	if(typeof connectedPeers[roomName] === 'undefined'){
		connectedPeers[roomName] = [];
	}

	connectedPeers[roomName].push(peer);
};