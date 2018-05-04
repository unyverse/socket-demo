'use strict';

/* Store */
let entityData = {};
let self = null;
const config = {
	entitySize: 20
};

/* Networking */
const socket = io.connect('/');

socket.on('connected', data => {
	console.log(':: Socket.IO :: Connected as ' + data.id);
	entityData = data.entityData;
	self = data.id;
	document.querySelector('.uuid').innerHTML = 'UUID: ' + self;
});

socket.on('disconnect', reason => {
	console.log(':: Socket.IO :: Disconnected with reason "' + reason + '"');
	window.setTimeout(() => {
		location.reload();
	}, 500);
});

socket.on('entity-move', data => {
	entityData[data.id] = {
		x: data.x,
		y: data.y
	};
});

socket.on('entity-disconnect', data => {
	delete entityData[data.id];
});

/* Render */
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const resize = () => {
	canvas.height = window.innerHeight;
	canvas.width = window.innerWidth;
};

const render = () => {
	window.requestAnimationFrame(render);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (const id in entityData) {
		const entity = entityData[id];
		ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
		ctx.fillRect((entity.x * canvas.width) - (config.entitySize/2), (entity.y * canvas.height) - (config.entitySize/2), config.entitySize, config.entitySize);
	}
	
	if (self) {
		const entity = entityData[self];
		ctx.fillStyle = 'rgba(32, 255, 32, 0.95)';
		ctx.fillRect((entity.x * canvas.width) - (config.entitySize/2), (entity.y * canvas.height) - (config.entitySize/2), config.entitySize, config.entitySize);	
	}
};

/* Movement */
const move = (x, y) => {
	socket.emit('move', {
		x, y
	});
};

/* Events */
window.addEventListener('resize', e => {
	resize();
});

window.addEventListener('keydown', e => {
	if (e.keyCode == '37') {
		move(-1, 0);
	}
	else if (e.keyCode == '38') {
		move(0, -1);
	}
	else if (e.keyCode == '39') {
		move(1, 0);
	}
	else if (e.keyCode == '40') {
		move(0, 1);
	}
});

/* Initial Setup */
resize();
render();