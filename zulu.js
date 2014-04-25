var net = require('net');
var io = require('socket.io');

function wrap(func, arg) {
	return function(a, b, c, d, e, f) {
		func(arg, a, b, c, d, e, f);
	};
}

var Client = function(socket, type) {
	this.socket = socket;
	if (type === 'socket.io') {
		this.send = function(data) {
			this.socket.send(data);
		};
		this.onData = function(callback) {
			this.socket.on('message', callback);
		};
		this.onClose = function(callback) {
			this.socket.on('disconnect', callback);
		};
	} else if (type === 'tcp') {
		this.send = function(data) {
			this.socket.write(data + '\n');
		};
		this.onData = function(callback) {
			this.socket.on('data', callback);
		};
		this.onClose = function(callback) {
			this.socket.on('end', callback);
		}
	}
};

var Server = function() {
	this.callbacks = {};
	this.on = function(evt, callback) {
		if (this.callbacks[evt] == undefined) this.callbacks[evt] = [];
		this.callbacks[evt].push(callback);
	};
	this.fire = function(evt, data) {
		if (this.callbacks[evt] == undefined) return;
		for (var i in this.callbacks[evt]) {
			(this.callbacks[evt][i])(data);
		}
	};
	this.bindTCP = function(port, ip) {
		try {
			net.createServer(wrap(function(server, socket) {
				server.fire('connect', new Client(socket, 'tcp'));
			}, this)).listen(port, ip);
			return true;
		} catch (err) {
			return false;
		}
	};
	this.bindWebSocket = function(port, ip) {
		try {
			this.wssocket = io.listen(port, {
				hostname: ip
			});
			this.wssocket.set('log level', '1');
			this.wssocket.on('connection', wrap(function(server, socket) {
				server.fire('connect', new Client(socket, 'socket.io'));
			}, this));
			return true;
		} catch (err) {
			return false;
		}
	};
};

module.exports = {
	Server: Server,
	Client: Client
};