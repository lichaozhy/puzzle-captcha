'use strict';

const { app } = require('electron');
const Workbench = require('./src/Workbench');
const repository = require('./src/repository');
const APIApplication = require('./src/application');

const principalRegistry = {
	a: {}
};

app.whenReady().then(async function () {
	await Workbench.bootstrap();
	setTimeout(() => repository.init(), 1000);

	const app = APIApplication(principalRegistry);

	app.listen(80);
});
