'use strict';

const Workbench = require('./Workbench');
const store = global.store = [];

module.exports = {
	init() {
		(async function watchStore() {
			if (store.length > 10000) {
				console.log(store.length);
				return setTimeout(watchStore, 5000);
			}

			const workbench = Workbench.get();

			if (workbench === null) {
				return setImmediate(watchStore);
			}

			global.workbench = workbench;
			workbench.getProduct().then(captcha => store.push(captcha));

			watchStore();
		}());
	}
};
