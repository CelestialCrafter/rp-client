const RPC = require('discord-rpc');
const psList = require('ps-list');
const options = require('./config');
const debug = require('debug');

require('dotenv').config();

const logAFK = debug('feature:afk');
const logAFKError = logAFK.extend('error');
const logMain = debug('main');
const logRPC = debug('rpc');

debug.log = console.info.bind(console);
logAFKError.log = console.error.bind(console);

logMain(`Running in ${global.process.env.NODE_ENV} environment`);

let getAfk = () => 0;

try {
	const system = require('@paulcbetts/system-idle-time');
	getAfk = () => (system.getIdleTime() >= options.afkTime ? true : false);
	logAFK('AFK Enabled');
} catch (e) {
	logAFK('AFK Disabled');
	logAFKError(e);
}

const client = new RPC.Client({ transport: 'ipc' });

options.processes.forEach(fp => (fp.useState ? fp.init?.() : null));

const refreshStatus = async () => {
	const isAfk = getAfk();

	const processList = await psList();
	// Gets the process with highest priority
	const selectedProcesses = processList
		.filter(process => options.processes.find(fp => fp.name === process.name))
		.filter((o, i, p) => i === p.findIndex(e => e['name'] === o['name']));
	const formattedProcesses = selectedProcesses.map(p =>
		options.processes.find(fp => fp.name === p.name)
	);
	const highestPriority = Math.max(
		...formattedProcesses.map(fp => fp.priority)
	);
	const process = formattedProcesses.find(fp => fp.priority == highestPriority);

	// Creates default state errors
	let state = null;
	if (!process) state = { success: false, error: new Error('No Process') };
	else if (!process.state)
		state = { success: false, error: new Error('No State') };
	else if (!process.useState)
		state = { success: false, error: new Error('State not in use') };
	else state = await process.state();

	const buttons = [options.button];
	// If state exists, check if a button exists on the state and push it to the buttons list
	state.success ? (state.button ? buttons.push(state.button) : null) : null;

	const statusIndex = Math.floor(Math.random() * options.statuses.length);

	process
		? logRPC('RPC Update %O', {
				executable: process.name,
				displayName: process.display,
				priority: process.priority,
				imageKey: process.image,
				status: options.statuses[statusIndex],
				state: { ...state, error: state.error?.toString() },
				usingState: state.success
		  })
		: logRPC('RPC Update %O', {
				status: options.statuses[statusIndex]
		  });

	process
		? client.setActivity({
				details: isAfk ? 'Idle' : state.usingText || 'Using ' + process.display,
				state: state?.result || options.statuses[statusIndex],
				largeImageKey: options.image,
				largeImageText: `${client.user.username}#${client.user.discriminator}`,
				smallImageKey: process?.image,
				smallImageText: `${process.name} - Priority: ${process.priority}${
					state.smallData ? ' - ' + state.smallData : ''
				}`,
				buttons
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
	refreshStatus();
	setInterval(() => {
		refreshStatus();
	}, options.refreshDelay);

	logMain('Logged In');
	logMain(`User ID: ${client.user.id}`);
});

client.login({ clientId: options.clientId });
