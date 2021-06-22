const config = {
	clientId: '823637382967328779',
	image: 'celestial_profile',
	statuses: [
		'status1',
		'status2'
	],
	button: {
		label: 'cool link',
		url: 'http://google.com'
	},
	processes: [
		{
			display: 'Discord',
			name: 'DiscordCanary.exe',
			image: 'discord',
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
