const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
	pingTimeout: 5000
});
const uuid = require('uuid/v1');
const chalk = require('chalk');
const fs = require('fs');

http.listen(5000, () => {
	console.log(chalk.green(':: HTTP :: ') + 'Listening on port 5000');
});

app.get('/', (req, res) => {
	console.log(chalk.green(':: Express :: ') + 'GET index.html');
	res.sendFile(__dirname + '/static/index.html');
});

app.get('/*', (req, res, next) => {
	const file = req.params[0];
	fs.access(__dirname + '/static/' + file, err => {
		if (err) {
			console.log(chalk.red(':: Express :: ') + 'GET ' + err);
			res.status(404).send('/' + file + ' is not available')
		} else {
			res.sendFile( __dirname + '/static/' + file );
			console.log(chalk.green(':: Express :: ') + 'GET ' + file);
		}
	});
});

let entityData = {};

io.on('connect', socket => {
	socket.client.userid = uuid();
	let x = Math.random();
	let y = Math.random();

	x = Math.round((4*Math.pow(x - 0.5, 3) + 0.5) * 100) / 100;
	y = Math.round((4*Math.pow(y - 0.5, 3) + 0.5) * 100) / 100;

	entityData[socket.client.userid] = {
		x, y
	};

	socket.emit('connected', {
		id: socket.client.userid,
		entityData
	});

	io.emit('entity-move', {
		id: socket.client.userid,
		x: entityData[socket.client.userid].x,
		y: entityData[socket.client.userid].y
	});
	
	console.log(chalk.green(':: Socket.IO :: ') + socket.client.userid + ' connected');

	socket.on('disconnect', reason => {
		console.log(chalk.green(':: Socket.IO :: ') + socket.client.userid + ' disconnected with reason "' + reason + '"');
		io.emit('entity-disconnect', {
			id: socket.client.userid
		});
		delete entityData[socket.client.userid];
	});

	socket.on('move', data => {
		console.log(chalk.green(':: Socket.IO :: ') + socket.client.userid + ' moved: ' + data.x + '|' + data.y);
		const entity = entityData[socket.client.userid];
		if ((entity.x + (data.x/100)) <= 1 && (entity.x + (data.x/100)) >= 0) {
			entity.x += (data.x/100);
		}
		if ((entity.y + (data.y/100)) <= 1 && (entity.y + (data.y/100)) >= 0) {
			entity.y += (data.y/100);
		}
		io.emit('entity-move', {
			id: socket.client.userid,
			x: entityData[socket.client.userid].x,
			y: entityData[socket.client.userid].y
		});
	});

	socket.on('message', data => {
		console.log(chalk.green(':: Socket.IO :: ') + socket.client.userid + ' message: ' + data.text);
		io.emit('entity-message', {
			id: socket.client.userid,
			text: data.text
		});
	});
});