/* eslint-disable global-require */
const config = {
	clientId: '823637382967328779',
	image: 'cool_image_key',
	afkTime: 5 * 60 * 1000, // Waits 5 minutes before changing your status to idle
	refreshDelay: 10 * 1000,
	bumpStateProcessesBy: 10,
	loginRetryDelay: 2000,
	statuses: ['status1', 'status2'],
	button: {
		label: 'cool link',
		url: 'http://google.com'
	},
	extraButton: {
		label: 'not cool link',
		url: 'http://virus.com'
	},
	processes: [
		{
			display: 'App Name!',
			name: 'Process.exe',
			image: 'appname_image_key',
			priority: 0
		},
		{
			display: 'Spotify',
			name: 'Spotify.exe',
			image: 'spotify',
			priority: 1,
			state: require('./src/states/spotify/spotify'),
			init: require('./src/states/spotify/spotify').init
		},
		{
			display: 'Visual Studio Code',
			name: 'Code.exe',
			image: 'vscode',
			priority: 2
		}
	]
};

module.exports = config;
