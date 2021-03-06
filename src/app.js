const RPC = require('discord-rpc');
const debug = require('debug');
let refreshStatus = require('./refreshStatus');
require('dotenv').config();

const options = require('../config');

const logAFK = debug('feature:afk');
const logAFKError = logAFK.extend('error');
const logMain = debug('main');
const logMainError = logMain.extend('error');

debug.log = console.info.bind(console);
logAFKError.log = console.error.bind(console);

// @TODO Add README to states

logMain(`Running in ${process.env.NODE_ENV} environment`);
// eslint-disable-next-line global-require
logMain(`Running from ${require('path').resolve('.')}`);

let getAfk = () => 0;

try {
	// eslint-disable-next-line global-require, import/no-unresolved
	const system = require('@paulcbetts/system-idle-time');
	getAfk = () => system.getIdleTime() >= options.afkTime;
	logAFK('AFK Enabled');
} catch (e) {
	logAFK('AFK Disabled');
	logAFKError(e);
}

const client = new RPC.Client({ transport: 'ipc' });
refreshStatus = refreshStatus({ client, getAfk });

options.processes.forEach(fp => fp.init?.());

client.on('ready', () => {
	client.clearActivity();
	setInterval(() => {
		refreshStatus();
	}, options.refreshDelay);

	logMain('Logged In');
	logMain(`User ID: ${client.user.id}`);
});

const login = (tries = 0) => client.login({ clientId: options.clientId }).catch(error => {
	logMainError(error);
	if (tries >= 10) return process.exit(0);
	setTimeout(login(tries + 1), options.loginRetryDelay || 2000);
	login(tries + 1);
});

login();

module.exports = { client, getAfk };
