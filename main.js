'use strict';

const { app } = require('electron');
const Workbench = require('./src/Workbench');
const repository = require('./src/repository')

app.whenReady().then(async function () {
	await Workbench.bootstrap();
	repository.init();
});
