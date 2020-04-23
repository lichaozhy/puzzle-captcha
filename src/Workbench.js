'use strict';

const { BrowserWindow } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

const http = require('http');
const WebSocket = require('ws');

function randInt(from, to) {
	return Math.round(Math.random() * (to - from)) + from;
}

const workbenchRegistry = {
	ready: [],
	all: {}
};

const ipc = {
	server: http.createServer().on('listening', function () {
		ipc.address = ipc.server.address();
	}).listen(),
	wss: null,
	address: null
};

ipc.wss = new WebSocket.Server({
	server: ipc.server,
	perMessageDeflate: false
}).on('connection', function connection(ws) {
	wsResolver(ws);
	wsResolver = null;
});

function createWindow(source) {
	const window = new BrowserWindow({
	});

	window.loadFile(path.resolve('assets/index.html'), {
		hash: `;${ipc.address.port};${source}`,
	});

	return window;
}

class Workbench {
	constructor(source, window, ws) {
		this.window = window;
		this.ws = ws;
		this.source = source;

		this.reciever = null;

		ws.on('message', data => {
			if (this.reciever !== null) {
				this.reciever(data);
			}
		});
	}

	async getProduct() {
		const readyList = workbenchRegistry.ready;

		readyList.splice(readyList.indexOf(this), 1);

		if (this.reciever !== null) {
			throw new Error('Workbench is busy.');
		}

		const x = randInt(16, 190);
		const y = randInt(16, 90);

		const sha256 = crypto.createHash('sha256');

		sha256.update(`${x}-${y}-${Date.now()}-${randInt(100000, 999999)}`);

		const token = sha256.digest('hex');

		return new Promise((resolve, reject) => {
			const command = {
				name: 'fetch',
				payload: { x, y }
			};

			this.reciever = resolve;
			this.ws.send(JSON.stringify(command));

			setTimeout(() => reject(new Error('No response.')), 5000);
		}).then(image => {
			return { token, image, x, y };
		}).finally(() => {
			this.reciever = null;
			readyList.push(this);
		});
	}
}

let wsResolver = null;

module.exports = {
	async bootstrap() {
		fs.readdir(path.resolve('assets/preset')).then(async list => {
			while(list.length) {
				const source = list.pop();
				const window = createWindow(source);

				const ws = await new Promise(resolve => {
					wsResolver = resolve;
				});

				const workbench = new Workbench(source, window, ws);

				workbenchRegistry.all[source] = workbench;
				workbenchRegistry.ready.push(workbench);
			}
		});
	},
	get() {
		if (workbenchRegistry.ready.length === 0) {
			return null;
		}

		return workbenchRegistry.ready[0];
	}
};
