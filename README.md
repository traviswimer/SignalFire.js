# SignalFire.js

An RTCPeerConnection signaling library/npm module. It does the signaling and then gets out of your way.

## Why do I need this? ##

There are other open-source signaling options, but many create a layer of abstraction around the RTCPeerConnection object. Although this can be useful, it can also be restrictive, especially when the WebRTC specification is still in flux.

The purpose of SignalFire.js is to:
*	Only focus on signaling
*	Give developer control before signaling
*	Return complete control to the developer after signaling

## Installation ##

### Server-side ###

1.	`npm install signalfire`
2.	`npm install` to install dependencies
3.	use `require('signalfire')` in node

### Client-side ###

*	The main script is `SignalFire.js / client / src / signalfire-client.js`
*	`adaptor.js` and `socket.io.js` are necessary dependencies in the same directory

## Basic Usage Example ##

SignalFire consists of a client-side script and a node module for signaling. Each is show below:

### Client-side: ###

```js
var options = {
	// Server to connect to
	server: "http://localhost:3333",

	// That will be called each time a new peer connection is created
	connector: function(){
		var newConnection = new RTCPeerConnection(
			{
			  "iceServers": [{ "url": "stun:stun.l.google.com:19302" }]
			}
		);

		return newConnection;
	},

	// Callback function for when the signaling process is complete
	onSignalingComplete: function(rtcPeerConnection){
		// Do something
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
var signalfire = require('signalfire');

var sf=signalfire.listen(3333,function(peer){
	peer.socket.on('askServerForPeer', function(data){
		peer.connectToPeer(anotherPeer);
	});
},function(error){
	console.log('something went wrong');
});
```

# API Documentation #

## Server-side ##

### Signalfire Object ###

Load module with `require('signalfire')`

### listen( port, successCallback, failCallback ) ###

Tells the server to listen on a certain port for socket connections to be used for peer connections. Returns a socket.io manager object.

*	**port** (number) - Server port number to listen on.
*	**successCallback** (function) - Callback function to be returned when a 
	user successful creates a socket connection with the server.
	*	Returns [peer object](#peer-object---server)
*	**failCallback** (function) - Callback function to be returned when a user fails 
	to create a socket connection with the server.
	*	Returns an error message (string)

### peer object - _server_ ###

#### socket ####

Contains a socket.io object

#### connectToPeer( peer ) ####

Connects the peer calling the method to a specified peer

*	**peer** ([peer object](#peer-object---server)) - Peer to connect to.

#### getPeerId() ####

Returns the unique ID for the peer object.


## Client-side ##

### connect( options, successCallback, failCallback ) ###

Creates a socket connection with the specified server. Returns a socket.io manager object.

*	**options** (object) - Setup options
	*	server (string) - Required. Specifies the server to connect to. `server: "http://localhost:3333"`
	*	connector (function) - Required. A function that creates and returns a new RTCPeerConnection object.
	*	onSignalingComplete (function) - Callback function for when the signaling process has successfully created a peer connection.
	*	onSignalingFail (function) - Callback function for when there is an error in the signaling process.
*	**successCallback** (function) - Callback function to be returned when a 
	user successful creates a socket connection with the server.
	*	Returns [peer object](#peer-object---client)
*	**failCallback** (function) - Callback function to be returned when a user fails to create a socket connection with the server.
	*	Returns an error message (string)


### peer object - _client_ ###

#### socket ####

Contains a socket.io object