//Mocha unit tests

var http = require('http').Server;
var assert = require('assert');
var request = require('supertest');
var io = require('socket.io-client');
var signalfire = require('../lib/signalfire');

describe('signalfire.js', function(){

	//Basic tests on signalfire object
	it('signalfire object',function(){
		assert(signalfire, 'signalfire variable exists');
		assert.equal(typeof signalfire, 'object', 'signalfire is an object');
	});

	// test on the main listen method
	describe('listen method', function(){

		it('basics',function(){
			assert(signalfire.listen, 'listen method exists');
			assert.equal(typeof signalfire.listen, 'function', 'listen property is a function');
		});

		it('should return false if port is not a number', function(){
			assert.deepEqual(false, signalfire.listen("a",function(){},function(error){}));
		});

		it('should return socket.io object if successful', function(done){
			var sf=signalfire.listen(3333,function(){},function(error){});
			assert.deepEqual(typeof sf, 'object');
			assert.deepEqual(sf.constructor.name,'Manager','is a socket.io Manager object');
			sf.server.close();
			done();
		});

		it('should fire success callback with peer object', function(done){
			var sf = signalfire.listen(
				3333,
				function(peer){
					assert.deepEqual(typeof peer,'object','Peer object received');
					assert.deepEqual(peer.constructor.name,'Peer','is a Peer object');
					client.disconnect();
					sf.server.close();
					done();
				},
				function(){}
			);
			var client = io.connect('http://localhost:3333', {'force new connection': true});
		});

	});


	// User socket connection tests
	describe('Peer Object', function(){
		var sf;
		var client1;
		var client2;
		var peer1;
		var peer2;

		before(function(done){
			sf = signalfire.listen(
				3333,
				function(peer){
					if(!peer1){
						peer1 = peer;
						client2 = io.connect('http://localhost:3333', {'force new connection': true});
					}else{
						peer2 = peer;
						done();
					}
				},
				function(err){}
			);
			client1 = io.connect('http://localhost:3333', {'force new connection': true});
		});

		it('should have a socket property containing socket.io object',function(){
			assert(peer1.socket, "Socket property exists");
			assert.deepEqual(typeof peer1.socket,'object','is an object');
			assert.deepEqual(peer1.socket.constructor.name,'Socket','is a socket.io object');
		});

		it('should have a `connectToPeer` method',function(){
			assert(peer1.connectToPeer, "Socket property exists");
			assert.deepEqual(typeof peer1.connectToPeer,'function','is a function');
		});

		describe('signaling',function(){

			it('connectToPeer complete all signaling',function(done){

				peer1.connectToPeer(peer2);

				// Offer request from server
				client1.on('serverRequestingOffer', function (data) {
					assert.equal(typeof data,'object','received data');
					assert(data.peerId,'peerId received');

					data.offer="offer";
					client1.emit('clientSendingOffer', data);
				});

				// Offer transferred from client1 to client2
				client2.on('serverSendingOffer', function (data) {
					assert.equal(typeof data,'object','received data');
					assert(data.peerId,'peerId received');
					assert.equal(data.offer,'offer','offer received');

					var answerData={
						peerId:data.peerId,
						answer:'answer'
					};
					client2.emit('clientSendingAnswer', answerData);
				});

				// Answer transferred from client2 to client1
				client1.on('serverSendingAnswer', function (data) {
					assert.equal(typeof data,'object','received data');
					assert(data.peerId,'peerId received');
					assert.equal(data.answer,'answer','offer received');
				});


				client1.emit(
					'clientSendingIce',
					{
						peerId:peer2.getPeerId(),
						candidate:'candidate'
					}
				);

				// Ice candidate received from server
				client2.on('serverSendingIce', function (data) {
					assert(data,'Ice candidate received');
					done();
				});

			});


		});


		after(function(){
			sf.server.close();
		});

	});



});