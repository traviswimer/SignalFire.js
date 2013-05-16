describe("signalfire", function() {

	it("signalfire object exists", function() {
		expect(typeof signalfire).toEqual('object');
	});

	describe("connect method", function(){
		it("connect method exists", function() {
			expect(typeof signalfire.connect).toEqual('function');
		});

		it("should call fallCallback or throw error if URL or PeerConnection arguments are invalid", function() {
			try{
				var conn = signalfire.connect();
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