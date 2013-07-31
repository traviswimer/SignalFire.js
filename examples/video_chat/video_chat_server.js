var signalfire = require('../../lib/signalfire.js');

var connectedPeers={};

var sf=signalfire.listen(3333,function(peer){
	peer.socket.on('addToRoom', function(data){
		addToRoom(data.roomName, peer);
		var roomArray=connectedPeers[data.roomName];
		if(roomArray.length>1){
			for(var i=0; i<roomArray.length; i++){
				if(peer !== roomArray[i]){
					peer.connectToPeer(roomArray[i]);
				}
			}
		}
	});
},function(error){
	console.log(error);
});



var addToRoom = function(roomName, peer){
	if(typeof connectedPeers[roomName] === 'undefined'){
		connectedPeers[roomName] = [];
	}

	connectedPeers[roomName].push(peer);

	// Remove peer from list when they disconnect
	peer.socket.on('disconnect', function () {
		var arrayId = connectedPeers[roomName].indexOf(peer);
		if(arrayId >= 0){
			connectedPeers[roomName].splice(arrayId,1);
		}
	});
};