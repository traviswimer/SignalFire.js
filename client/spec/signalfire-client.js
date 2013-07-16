describe("signalfire", function() {

	it("signalfire object exists", function() {
		expect(typeof signalfire).toEqual('object');
	});

	describe("connect method", function(){
		it("connect method exists", function() {
			expect(typeof signalfire.connect).toEqual('function');
		});

		it("should call fallCallback or throw error if URL or PeerConnection arguments are invalid", function() {
			var conn;
			try{
				conn = signalfire.connect();
			}catch(err){
				expect(err).toEqual('Invalid option provided');
			}

			try{
				conn = signalfire.connect("a");
			}catch(err){
				expect(err).toEqual('Invalid option provided');
			}

			try{
				conn = signalfire.connect(2,2);
			}catch(err){
				expect(err).toEqual('Invalid option provided');
			}



			conn = signalfire.connect(2,2, function(err){
				expect(err).toEqual('Invalid option provided');
			});


		});

		describe("onSignalingComplete",function(){
			var conn, conn2;
			var async = new AsyncSpec(this);
			var storeRetrievedPeerConnection;

			async.it("should return socketio object if valid arguments", function(done) {

				var options = {
					server: "http://localhost:3333",
					connector: function(setConnection){
						var newConnection = new RTCPeerConnection({
							"iceServers": [{ "url": "stun:173.194.73.127:19302" }]
						});

						setConnection(newConnection);
					}
				};

				conn = signalfire.connect(options,function(){
					expect(typeof conn).toEqual('object');
					done();
				});

			});


			async.it("should call onSignalingComplete function", function(done) {
				console.log("calling the function");
				var options = {
					server: "http://localhost:3333",
					connector: function(setConnection){
						// Creates a datachannel connection. Sets it up based on your browser
						console.log("connector called");

						setupDataChannelConnection(setConnection);
					},
					onSignalingComplete: function(peerConnection){
						expect(typeof peerConnection).toEqual('object');
						storeRetrievedPeerConnection = peerConnection;
						done();
					}
				};

				conn2 = signalfire.connect(options,function(){
					conn.emit('addToRoom',{
						roomName:"test"
					});
					conn2.emit('addToRoom',{
						roomName:"test"
					});
				});

			}, 10000);

			it("reference to peer connection should still exist",function(){
				expect(typeof storeRetrievedPeerConnection).toEqual('object');

				conn.emit('disconnectAll',{"room": "test"});
				conn.disconnect();
				conn2.disconnect();
			});


		});


		describe("onSignalingFail",function(){
			var failAsync = new AsyncSpec(this);
			var options;

			beforeEach(function(){
				options = {
					server: "http://localhost:3333",
					connector: function(setConnection){
						var newConnection = new RTCPeerConnection({
							"iceServers": [{ "url": "stun:173.194.73.127:19302" }]
						});
						return setConnection(newConnection);
					}
				};
			});


			failAsync.it("should cause fail if offer request null", function(done) {

				options.onSignalingFail = function(err){
					expect(err).toEqual('Invalid data recieved from server');
					done();
				};

				var conn = signalfire.connect(options, function(){
					conn.emit('testServerRequest',{
						requestType: 'serverRequestingOffer',
						data: null
					});
				});

			});

			failAsync.it("should cause fail if offer request peerId undefined", function(done) {

				options.onSignalingFail = function(err){
					expect(err).toEqual('Invalid data recieved from server');
					done();
				};

				var conn = signalfire.connect(options, function(){
					conn.emit('testServerRequest',{
						requestType: 'serverRequestingOffer',
						data: {}
					});
				});

			});

			failAsync.it("should cause fail if peer offer data is null", function(done) {

				options.onSignalingFail = function(err){
					expect(err).toEqual('Invalid data recieved from server');
					done();
				};

				var conn = signalfire.connect(options, function(){
					conn.emit('testServerRequest',{
						requestType: 'serverSendingOffer',
						data: null
					});
				});

			});

			failAsync.it("should cause fail if peer offer data does not contain peerId", function(done) {

				options.onSignalingFail = function(err){
					expect(err).toEqual('Invalid data recieved from server');
					done();
				};

				var conn = signalfire.connect(options, function(){
					conn.emit('testServerRequest',{
						requestType: 'serverSendingOffer',
						data: {offer:{}}
					});
				});

			});

			failAsync.it("should cause fail if peer offer data does not contain offer", function(done) {

				options.onSignalingFail = function(err){
					expect(err).toEqual('Invalid data recieved from server');
					done();
				};

				var conn = signalfire.connect(options, function(){
					conn.emit('testServerRequest',{
						requestType: 'serverSendingOffer',
						data: {peerId:1}
					});
				});

			});

			failAsync.it("should cause fail if peer answer data is null", function(done) {

				options.onSignalingFail = function(err){
					expect(err).toEqual('Invalid data recieved from server');
					done();
				};

				var conn = signalfire.connect(options, function(){
					conn.emit('testServerRequest',{
						requestType: 'serverSendingAnswer',
						data: null
					});
				});

			});

			failAsync.it("should cause fail if peer answer data does not contain peerId", function(done) {

				options.onSignalingFail = function(err){
					expect(err).toEqual('Invalid data recieved from server');
					done();
				};

				var conn = signalfire.connect(options, function(){
					conn.emit('testServerRequest',{
						requestType: 'serverSendingAnswer',
						data: {answer:{}}
					});
				});

			});

			failAsync.it("should cause fail if peer answer data does not contain answer", function(done) {

				options.onSignalingFail = function(err){
					expect(err).toEqual('Invalid data recieved from server');
					done();
				};

				var conn = signalfire.connect(options, function(){
					conn.emit('testServerRequest',{
						requestType: 'serverSendingAnswer',
						data: {peerId:1}
					});
				});

			});




		});

	});



});



function setupDataChannelConnection(setConnection){

	var newConnection;
	var clientChannel;

	if(window.webrtcDetectedBrowser === "firefox"){
		// Firefox's WebRTC implemention is odd, and requires a fake media stream
		// to make datachannels work

		try{

			newConnection = new RTCPeerConnection(
				{
					"iceServers": [{ "url": "stun:173.194.73.127:19302" }]
				}
			);

			clientChannel = newConnection.createDataChannel("chat", {
				reliable: false
			});
			clientChannel.binaryType = 'blob';

			getUserMedia(
				{
					audio: true,
					fake: true
				},
				function(stream) {
					console.log("stream created");
					newConnection.addStream(stream);
					setConnection(newConnection);
				},
				function(){
					console.log("FAIL!!!! OH NO");
				}
			);

		}catch(e){
			console.dir(e);
		}
	}else{

		try{

			newConnection = new RTCPeerConnection(
				{
					"iceServers": [{ "url": "stun:173.194.73.127:19302" }]
				},
				{
					'optional': [
						{'DtlsSrtpKeyAgreement': true},
						{'RtpDataChannels': true }
					]
				}
			);

			clientChannel = newConnection.createDataChannel("chat", {
				reliable: false
			});

			setConnection(newConnection);

		}catch(e){
			console.dir(e);
		}
	}
}