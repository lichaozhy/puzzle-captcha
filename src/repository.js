'use strict';

const Workbench = require('./Workbench');
const store = global.store = [];

module.exports = {
	init(bufferSize) {
		(async function watchStore() {
			if (store.length > bufferSize) {
				return setTimeout(watchStore, 1000);
			}

			const workbench = Workbench.get();

			if (workbench === null) {
				return setImmediate(watchStore);
			}

			global.workbench = workbench;
			workbench.getProduct().then(captcha => store.push(captcha));

			watchStore();
		}());
	},
	fetch() {
		return store.shift();
	}
};
