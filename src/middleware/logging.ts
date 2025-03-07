import { Logtail } from '@logtail/node';
import expressWinston from 'express-winston';
import winston from 'winston';
import { LogtailTransport } from '@logtail/winston';
import express from 'express';

const logtail = new Logtail(process.env.BETTERSTACK_SOURCE_TOKEN || '', {
	endpoint: "https://s1211998.eu-nbg-2.betterstackdata.com",
});

const requestLogger = expressWinston.logger({
	transports: [
		new LogtailTransport(logtail),
		new winston.transports.Console()
	],
	format: winston.format.combine(
		winston.format.json()
	),
	meta: true,
	msg: "HTTP {{req.method}} {{req.url}}",
	expressFormat: true,
	colorize: false,
	requestWhitelist: [...expressWinston.requestWhitelist, 'body'],
	responseWhitelist: [...expressWinston.responseWhitelist, 'body'],
	dynamicMeta: (req: express.Request, res: express.Response) => {
		const meta = {
			req: {
				url: req.url,
				headers: req.headers,
				method: req.method,
				httpVersion: req.httpVersion,
				originalUrl: req.originalUrl,
				query: req.query,
				body: { ...req.body }
			},
			res: {
				statusCode: res.statusCode,
				headers: res.getHeaders(),
				body: (res as any).body
			}
		};

		if (meta.req.body) {
			meta.req.body.password = undefined;
			meta.req.body.refresh_token = undefined;
			meta.req.body.access_token = undefined;
		}

		if (meta.res.body?.data) {
			meta.res.body.data.password = undefined;
			meta.res.body.data.refresh_token = undefined;
			meta.res.body.data.access_token = undefined;
		}

		return meta;
	},
	ignoreRoute: function (req, res) { return false; }
});

const errorLogger = expressWinston.errorLogger({
	transports: [
		new LogtailTransport(logtail),
		new winston.transports.Console()
	],
	format: winston.format.combine(
		winston.format.json()
	)
});

const flush = () => {
	logtail.flush();
}

export default {
	requestLogger,
	errorLogger,
	flush
}; 