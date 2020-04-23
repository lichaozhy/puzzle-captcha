'use strict';

const { app } = require('electron');
const Workbench = require('./src/Workbench');
const repository = require('./src/repository');
const APIApplication = require('./src/application');

const principalRegistry = require('./public/principal.json');
const config = require('./public/config.json');

app.whenReady().then(async function () {
	await Workbench.bootstrap();
	setTimeout(() => repository.init(config.captcha.bufferSize), 1000);

	const app = APIApplication(principalRegistry);

	app.listen(config.api.port);
});
