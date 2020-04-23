'use strict';

const fs = require('fs');
const axios = require('axios');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const agent = axios.create({
	baseURL: 'http://127.0.0.1/api'
});

describe('PuzzleCaptchaAPI::', function () {
	const examplePath = path.join(__dirname, '../example');
	const publicPath = path.join(__dirname, '../public');

	fs.unlinkSync(publicPath);
	fs.linkSync(examplePath, publicPath);

	it('should be 401 without token for all APIs.');

	describe('CreateCaptcha::', function () {
		it('should get a captcha successfully', function () {

		});
	});

	describe('RequestCaptchaImage::', function () {
		it('should 404 when request a captcha image if not existed.', function () {

		});

		it('should request an existed captcha image successfully.', function () {

		});
	});

	describe('VerifyCaptcha::', function () {
		it('should be 400 if query `x` can NOT to be a number.', function () {

		});

		it('should be 416 if `x` is NOT satisfactory.', function () {

		});

		it('should be successful if `x` is satisfactory.', function () {

		});
	});

	describe('GetVerifiedCaptcha::', function () {
		it('should be 404 if the captcha specific by hash is NOT verified.', function () {

		});

		it('should be 200 if the captcha specific by hash is verified.', function () {

		});
	});
});