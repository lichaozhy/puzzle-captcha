'use strict';

const Workbench = require('./Workbench');
const store = global.store = [];

module.exports = {
	init() {
		setInterval(async () => {
			if (store.length > 5) {
				return;
			}

			const workbench = Workbench.get();

			if (workbench === null) {
				return;
			}

			global.workbench = workbench;
			store.push(await workbench.getProduct());
		}, 1000);
	}
};
