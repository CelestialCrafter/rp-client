const RPC = require('discord-rpc');
const psList = require('ps-list');
const debug = require('debug');

const options = require('../config');

require('dotenv').config();

const logAFK = debug('feature:afk');
const logAFKError = logAFK.extend('error');
const logMain = debug('main');
const logMainError = logMain.extend('error');
const logRPC = debug('rpc');

debug.log = console.info.bind(console);
logAFKError.log = console.error.bind(console);

// @TODO Add README to states

logMain(`Running in ${process.env.NODE_ENV} environment`);
logMain(`Running from ${require('path').resolve('.')}`);

let getAfk = () => 0;

try {
	// eslint-disable-next-line global-require, import/no-extraneous-dependencies
	const system = require('@paulcbetts/system-idle-time');
	getAfk = () => system.getIdleTime() >= options.afkTime;
	logAFK('AFK Enabled');
} catch (e) {
	logAFK('AFK Disabled');
	logAFKError(e);
}

const client = new RPC.Client({ transport: 'ipc' });

options.processes.forEach(fp => fp.init?.());

const refreshStatus = async () => {
	const stateCache = {};
	const isAfk = getAfk();
	const bumpedProcesses = [];

	const processList = await psList();

	// Gets the process with highest priority
	const selectedProcesses = processList
		.filter((process) => options.processes.find((fp) => fp.name === process.name))
		.filter((o, i, p) => i === p.findIndex((e) => e.name === o.name));
	const formattedProcessesUB = selectedProcesses.map((p) => options.processes.find((fp) => fp.name === p.name));

	// eslint-disable-next-line no-restricted-syntax
	const stateArray = [];

	formattedProcessesUB.forEach(fp => {
		if (options.bumpStateProcessesBy && fp.state) stateArray.push({ fp, state: fp.state() });
	});

	await Promise.all(stateArray.map(s => s.state)).then(states => states.forEach((state, index) => {
		const { fp } = stateArray[index];
		if (state.success) {
			bumpedProcesses.push(fp);
			logMain(
				`State running for process ${fp.name} Bumping priority by ${options.bumpStateProcessesBy}`
			);
		}
	}));

	/* eslint-disable max-len */
	const formattedProcesses = formattedProcessesUB.filter(fp => !bumpedProcesses.map(bfp => bfp.name).includes(fp.name));
	bumpedProcesses.forEach(bp => formattedProcesses.push({ ...bp, priority: bp.priority + options.bumpStateProcessesBy }));
	/* eslint-enable max-len */

	const highestPriority = Math.max(
		...formattedProcesses.map((fp) => fp.priority)
	);
	const process = formattedProcesses.find((fp) => fp.priority === highestPriority);

	// Creates default state errors
	let state = null;
	if (!process) state = { success: false, error: new Error('No Process') };
	else if (!process.state) state = { success: false, error: new Error('No State') };
	else if (process.useState ?? false) state = { success: false, error: new Error('State not in use') };
	else state = stateCache[process.name] ?? (await process.state());

	if (!stateCache[process.name]) stateCache[process.name] = state;

	const buttons = [options.button];
	// If state exists, check if a button exists on the state and push it to the buttons list
	// eslint-disable-next-line no-unused-expressions, no-nested-ternary
	state.success ? (state.button ? buttons.push(state.button) : null) : null;

	const statusIndex = Math.floor(Math.random() * options.statuses.length);
	const nonOptionalLogs = {
		status: options.statuses[statusIndex],
		state: { ...state, error: state.error?.toString() },
		isAfk
	};

	process
		? logRPC('RPC Update %O', {
			executable: process.name,
			displayName: process.display,
			priority: process.priority,
			imageKey: process.image,
			...nonOptionalLogs
		})
		: logRPC('RPC Update %O', nonOptionalLogs);

	process
		? client.request('SET_ACTIVITY', {
			pid: global.process.pid,
			activity: {
				details: isAfk
					? 'Idle'
					: state.usingText || `Using ${process.display}`,
				state: state?.result || options.statuses[statusIndex],
				assets: {
					large_image: options.image,
					large_text: `${client.user.username}#${client.user.discriminator}`,
					small_image: process?.image,
					// eslint-disable-next-line max-len
					small_text: `${process.name} - Priority: ${process.priority}${state.smallData ? ` - ${state.smallData}` : ''
						}`
				},
				timestamps: {
					start: state?.startTimestamp,
					end: state?.endTimestamp
				},
				instance: true,
				buttons
			}
		})
		: client.setActivity({
			details: options.statuses[statusIndex],
			largeImageKey: options.image,
			largeImageText: `${client.user.username}#${client.user.discriminator}`,
			buttons
		});
};

client.on('ready', () => {
	client.clearActivity();
	setInterval(() => {
		refreshStatus();
	}, options.refreshDelay);

	logMain('Logged In');
	logMain(`User ID: ${client.user.id}`);
});

client.login({ clientId: options.clientId }).catch(error => {
	logMainError(error);
	process.exit(0);
});
