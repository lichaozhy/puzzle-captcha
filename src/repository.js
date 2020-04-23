'use strict';

const Workbench = require('./Workbench');
const store = global.store = [];

module.exports = {
	init() {
		(async function watchStore() {
			if (store.length > 200) {
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
	},
	fetch() {
		return store.shift();
	}
};
