'use strict';

const Koa = require('koa');
const KoaRouter = require('@koa/router');
const repository = require('./repository');

const CLEANING_INTERVAL = 10000;
const VALID_TIME = 2 * 60 * 1000;
const X_PRECISION = 4;

const cache = {};

setInterval(function cleaner() {
	const now = Date.now();

	Object.keys(cache).forEach(hash => {
		if (cache[hash].expiredAt < now) {
			delete cache[hash];
		}
	});
}, CLEANING_INTERVAL);

const Router = new KoaRouter({
	prefix: '/api'
}).use(function (ctx, next) {
	const principal = ctx.principal[ctx.query.token];

	if (!principal) {
		return ctx.throw(401);
	}

	return next();
}).param('hash', (hash, ctx, next) => {
	const captcha = cache[hash];

	if (!captcha) {
		return ctx.throw(404);
	}

	ctx.state.captcha = captcha;

	return next();
}).post('/captcha', function createCaptcha(ctx) {
	const product = repository.fetch();

	if (product === null) {
		return ctx.throw(429);
	}

	cache[product.token] = {
		product,
		verified: false,
		expiredAt: Date.now() + VALID_TIME
	};

	ctx.body = {
		token: product.token,
		y: product.y
	};
}).put('/captcha/:hash', function verifyCaptcha(ctx) {
	const { x } = ctx.query;
	const numberX = Number(x);

	if (!Number.isInteger(numberX)) {
		return ctx.throw(400);
	}

	const { captcha } = ctx.state;

	const verified = captcha.verified =
		Math.abs(numberX - captcha.product.x) < X_PRECISION;

	if (verified) {
		ctx.status = 200;
	} else {
		ctx.throw(416);
	}
}).get('/captcha/:hash', function getVerifiedCaptcha(ctx) {
	if (ctx.state.captcha.verified) {
		return ctx.status = 200;
	}

	return ctx.throw(404);
}).get('/captcha/:hash/image', function respondCaptchaImage(ctx) {
	const captcha = cache[ctx.params.hash];

	if (!captcha) {
		return ctx.throw(404);
	}

	ctx.type = 'image/png';
	ctx.body = captcha.product.image;
});

if (process.env.NODE_ENV === 'development') {
	Router.get('/dev/:hash', function getX(ctx) {
		ctx.body = {
			x: ctx.state.captcha.product.x
		};
	});
}

module.exports = function createApplication(principalRegistry) {
	const app = new Koa();

	app.context.principal = principalRegistry;
	app.use(Router.routes());

	return app;
};