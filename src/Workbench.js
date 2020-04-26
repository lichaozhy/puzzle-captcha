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

const wsMap = {};

ipc.wss = new WebSocket.Server({
	server: ipc.server,
	perMessageDeflate: false
}).on('connection', function connection(ws) {
	ws.once('message', data => {
		wsMap[data](ws);
		delete wsMap[data];
	});
});

class Workbench {
	constructor(source) {
		this.window = new BrowserWindow({
			width: 580,
			height: 420
		});
		this.ws = null;
		this.source = source;
		this.work = 0;

		this.reciever = null;

		this.reload();
	}

	setBusy() {
		const readyList = workbenchRegistry.ready;

		readyList.splice(readyList.indexOf(this), 1);
	}

	setReady() {
		workbenchRegistry.ready.push(this);
	}

	async reload() {
		if (this.ws !== null) {
			this.ws.close();
		}

		this.window.loadFile(path.resolve('index.html'), {
			hash: `;${ipc.address.port};${this.source}`,
		});

		const ws = await new Promise(resolve => {
			wsMap[this.source] = resolve;
		});

		this.ws = ws.on('message', data => {
			if (this.reciever !== null) {
				this.reciever(data);
			}
		});

		this.work = 0;
		this.setReady();
	}

	async getProduct() {
		if (this.reciever !== null) {
			throw new Error('Workbench is busy.');
		}

		this.setBusy();

		const x = randInt(16, 190);
		const y = randInt(16, 90);

		const sha256 = crypto.createHash('sha256');

		sha256.update(`${x}-${y}-${Date.now()}-${randInt(100000, 999999)}`);

		const token = sha256.digest('hex');
		let timer = null;

		return new Promise((resolve, reject) => {
			const command = {
				name: 'fetch',
				payload: { x, y }
			};

			this.reciever = resolve;
			this.ws.send(JSON.stringify(command));

			timer = setTimeout(() => {
				reject(new Error('No response.'));
				console.log(this.source);
			}, 1000);
		}).then(image => {
			clearTimeout(timer);

			return { token, image, x, y };
		}).finally(() => {
			this.reciever = null;
			this.work++;

			if (this.work > 100) {
				this.reload();
			} else {
				this.setReady();
			}
		});
	}
}

module.exports = {
	async bootstrap() {
		fs.readdir(path.resolve('public/preset')).then(async list => {
			while(list.length) {
				const source = list.pop();
				const workbench = new Workbench(source);

				workbenchRegistry.all[source] = workbench;
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
