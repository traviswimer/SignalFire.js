# SignalFire.js

An RTCPeerConnection signaling library/npm module. It does the signaling and then gets out of your way.

## Why do I need this? ##

There are other open-source signaling options, but many create a layer of abstraction around the RTCPeerConnection object. Although this can be useful, it can also be restrictive, especially when the WebRTC specification is still in flux.

The purpose of SignalFire.js is to:
*	Only focus on signaling
*	Give developer control before signaling
*	Return complete control to the developer after signaling

## Basic Example Usage ##

SignalFire consists of a client-side script and a node module for signaling. Each is show below:

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