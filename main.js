const { app, BrowserWindow } = require('electron');
const path = require('path');

const http = require('http');
const WebSocket = require('ws');

const fs = require('fs');

app.whenReady().then(function () {
	function createWindow() {
		// 创建浏览器窗口
		let win = new BrowserWindow({
			width: 800,
			height: 600
		})
	
		// 加载index.html文件
		win.loadFile(path.resolve('assets/index.html'), {
			hash: `${ipc.address.port}`
		});
	}

	const ipc = {
		server: http.createServer(),
		wss: null,
		address: null
	};

	ipc.wss = new WebSocket.Server({
		server: ipc.server,
		perMessageDeflate: false
	}).on('connection', function connection(ws) {
		ws.on('message', function incoming(data) {
			console.log(data);
			
			fs.writeFile(path.resolve('output/block.png'), data, function(err) {
				if (err) {
					return console.error(err)
				}
			});
		});
	});

	ipc.server.listen();

	ipc.server.on('listening', function () {
		ipc.address = ipc.server.address();

		createWindow();
	});
});
