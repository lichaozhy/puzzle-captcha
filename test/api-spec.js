'use strict';

const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const principal = require('../example/principal.json');

const agent = axios.create({
	baseURL: 'http://127.0.0.1/api',
});

const token = Object.keys(principal)[0];

describe('PuzzleCaptchaAPI::', function () {
	const examplePath = path.join(__dirname, '../example');
	const publicPath = path.join(__dirname, '../public');

	before(async () => {
		this.electron = spawn(process.platform === 'win32' ? 'node.exe' : 'node', [
			path.join(require.resolve('electron'), '../cli.js'),
			'./'
		], {
			detached: true,
			env: {
				NODE_ENV: 'development'
			}
		});

		return new Promise(resolve => setTimeout(resolve, 5000));
	});

	fs.copySync(examplePath, publicPath);

	it('should be 403 without token for all APIs.', async function () {
		const badAgent = axios.create({
			baseURL: 'http://127.0.0.1/api'
		});

		await Promise.all([
			badAgent.post('/captcha'),
			badAgent.put('/captcha/test'),
			badAgent.get('/captcha/test'),
			badAgent.get('/captcha/test/image')
		].map(request => {
			return request.catch(error => {
				assert.equal(error.response.status, 403);
			});
		}));
	});

	describe('CreateCaptcha::', function () {
		it('should get a captcha successfully', async function () {
			const res = await agent.post('/captcha', null, {
				params: { token }
			});

			assert.equal(res.status, 200);
			assert(res.data.y);
			assert(res.data.hash);
		});
	});

	describe('RequestCaptchaImage::', function () {
		this.beforeEach(async function () {
			const res = await agent.post('/captcha', null, {
				params: { token }
			});

			this.hash = res.data.hash;
		});

		it('should 404 when request a captcha image if not existed.', async function () {
			const res = await agent.get(`/captcha/${this.hash}/image`, {
				params: { token }
			});

			assert.equal(res.status, 200);
		});

		it('should request an existed captcha image successfully.', async function () {
			try {
				await agent.get('/captcha/badhash/image', {
					params: { token }
				});
			} catch (error) {
				assert.equal(error.response.status, 404);
			}
		});
	});

	describe('VerifyCaptcha::', function () {
		this.beforeEach(async function () {
			const res = await agent.post('/captcha', null, {
				params: { token }
			});

			this.hash = res.data.hash;
		});

		it('should be 400 if query `x` can NOT to be a number.', async function () {
			try {
				await agent.put(`/captcha/${this.hash}`, null, {
					params: { token, x: 'NaN' }
				});
			} catch (error) {
				assert.equal(error.response.status, 400);
			}
		});

		it('should be 416 if `x` is NOT satisfactory.', async function () {
			try {
				await agent.put(`/captcha/${this.hash}`, null, {
					params: { token, x: '5000' }
				});
			} catch (error) {
				assert.equal(error.response.status, 416);
			}
		});

		it('should be successful if `x` is satisfactory.', async function () {
			const answerRes = await agent.get(`/dev/${this.hash}`, {
				params: { token }
			});

			const res = await agent.put(`/captcha/${this.hash}`, null, {
				params: { token, x: answerRes.data.x }
			});

			assert.equal(res.status, 200);
		});
	});

	describe('GetVerifiedCaptcha::', function () {
		this.beforeAll(async function () {
			const res = await agent.post('/captcha', null, {
				params: { token }
			});

			this.hash = res.data.hash;
		});

		it('should be 404 if the captcha specific by hash is NOT verified.', async function () {
			try {
				await agent.get(`/captcha/${this.hash}`, {
					params: { token }
				});
			} catch (error) {
				assert.equal(error.response.status, 404);
			}
		});

		it('should be 200 if the captcha specific by hash is verified.', async function () {
			const answerRes = await agent.get(`/dev/${this.hash}`, {
				params: { token }
			});

			await agent.put(`/captcha/${this.hash}`, null, {
				params: { token, x: answerRes.data.x }
			});

			const res = await agent.get(`/captcha/${this.hash}`, {
				params: { token }
			});

			assert.equal(res.status, 200);
		});
	});

	this.afterAll(() => {
		fs.removeSync(publicPath);
		this.electron.kill();
	});
});