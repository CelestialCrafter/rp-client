const RPC = require('discord-rpc');
const psList = require('ps-list');
const options = require('./config');
const system = require('@paulcbetts/system-idle-time');

const client = new RPC.Client({ transport: 'ipc' });

options.processes.forEach(fp => (fp.useState ? fp.init?.() : null));

const refreshStatus = async () => {
	// afkTime counts as AFK
	const isAfk = system.getIdleTime() >= options.afkTime ? true : false;

	const processList = await psList();
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

	const statusIndex = Math.floor(Math.random() * options.statuses.length);
	let state = null;
	if (!process) state = { success: false, error: new Error('No Process') };
	else if (!process.state)
		state = { success: false, error: new Error('No State') };
	else if (!process.useState)
		state = { success: false, error: new Error('State not in use') };
	else state = await process.state();

	const buttons = [ options.button ];
	// If state exists, check if a button exists on the state and push it to the buttons list
	state.success ? (state.button ? buttons.push(state.button) : null) : null;

	process
		? console.log(`
-------------------------
Executable: ${process.name}
Display Name: ${process.display}
Priority: ${process.priority}
Image Key: ${process.image}
Status: ${options.statuses[statusIndex]}
State: ${JSON.stringify(state)}
Using State: ${state.success}${
	!state.success ? `\n${state.error.toString()}` : ''
		  }
-------------------------`)
		: null;

	process
		? client.setActivity({
			details: isAfk
				? 'Idle'
				: 'Using ' + process.display,
			state: state?.result || options.statuses[statusIndex],
			largeImageKey: options.image,
			largeImageText: `${client.user.username}#${client.user.discriminator}`,
			smallImageKey: process?.image,
			smallImageText: `${process.name} - Priority: ${process.priority}${state.smallData ? ' - ' + state.smallData : ''}`,
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
	setInterval(refreshStatus, options.refreshDelay);
	console.log(`Running\nUser ID: ${client.user.id}`);
});

client.login({ clientId: options.clientId });
