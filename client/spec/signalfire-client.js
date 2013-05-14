describe("signalfire", function() {

	it("signalfire object exists", function() {
		expect(typeof signalfire).toEqual('object');
	});

	describe("connect method", function(){
		it("connect method exists", function() {
			expect(typeof signalfire.connect).toEqual('function');
		});

		it("should return false if URL or PeerConnection arguments are invalid", function() {
			var conn = signalfire.connect();
			expect(conn).toEqual(false);

			conn = signalfire.connect("a");
			expect(conn).toEqual(false);

			conn = signalfire.connect(2,2);
			expect(conn).toEqual(false);
		});

		var conn;

		it("should return socketio object if valid arguments", function() {
			var asynchFlag=false;

			runs(function(){
				var options = {
					server: "http://localhost:3333",
					connector: function(){
						var newConnection = new RTCPeerConnection({
							"iceServers": [{ "url": "stun:stun.l.google.com:19302" }]
						});

						

						console.log("IT IS SIGNALING!!!");
						return newConnection;
					}
				};

				conn = signalfire.connect(options,function(){
					asynchFlag=true;
				});
			});

			waitsFor(function() {
				expect(typeof conn).toEqual('object');
				return asynchFlag;
			}, "socketio connect complete", 2000);
		});


		it("should do something when emitting custom request", function() {
			var asynchFlag=false;

			runs(function(){
				var options = {
					server: "http://localhost:3333",
					connector: function(){
						var newConnection = new RTCPeerConnection({
							"iceServers": [{ "url": "stun:stun.l.google.com:19302" }]
						});
						return newConnection;
					},
					onSignalingComplete: function(){
						console.log("ITS DONE!!!!!!!");
						asynchFlag=true;
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
			});

			waitsFor(function() {
				expect(typeof conn).toEqual('object');
				return asynchFlag;
			}, "socketio connect complete", 2000);
		});


	});

});