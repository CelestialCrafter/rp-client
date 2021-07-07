const config = {
	clientId: '823637382967328779',
	image: 'cool_image_key',
	afkTime: 5 * 60 * 1000,
	refreshDelay: 10 * 1000,
	statuses: ['status1', 'status2'],
	button: {
		label: 'cool link',
		url: 'http://google.com'
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
			state: require('./states/spotify.js'),
			useState: true
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
