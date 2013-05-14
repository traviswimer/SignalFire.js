# SignalFire.js

An RTCPeerConnection signaling library/npm module. It does the signaling and then gets out of your way.

### Client-side: ###

```js
var options = {
	server: "http://localhost:3333",
	connector: function(){
		var newConnection = new RTCPeerConnection(
			{
			  "iceServers": [{ "url": "stun:stun.l.google.com:19302" }]
			}
		);

		return newConnection;
	},
	onSignalingComplete: function(rtcPeerConnection){
		// What to do once signaling is complete
	}
};

var conn = signalfire.connect(options,function(){
	conn.emit('askServerForPeer',{
		data: someData
	});
});
```

### Server-side: ###

```js
var sf=signalfire.listen(3333,function(peer){
	peer.socket.on('askServerForPeer', function(data){
		peer.connectToPeer(anotherPeer);
	});
},function(error){
	console.log('something went wrong');
});
```