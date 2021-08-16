const SpotifyWebApi = require('spotify-web-api-node');
const app = require('express')();
const open = require('open');
const crypto = require('crypto');
const {
	writeFileSync, readFileSync, existsSync, mkdirSync
} = require('fs');
const { join, resolve } = require('path');
const debug = require('debug');
const options = require('./config.js');

const logHttp = debug('http');
const logSpotify = debug('feature:spotify');
const logSpotifyWarning = logSpotify.extend('warning');
const logSpotifyError = logSpotify.extend('error');

debug.log = console.info.bind(console);
logSpotifyWarning.log = console.warn.bind(console);
logSpotifyError.log = console.error.bind(console);

const spotifyApi = new SpotifyWebApi({
	redirectUri: 'http://localhost:52752/',
	clientId: options.clientId,
	clientSecret: options.clientSecret
});

const dataPath = resolve('data/');
const credentialPath = join(dataPath, 'spotifyCredentials.txt');

const spotify = () => new Promise(res => {
	spotifyApi
		.getMyCurrentPlaybackState()
		.then((data) => {
			if (!data.body.device) return;
			if (
				!options.allowedDevices.includes(data.body.device.id)
					&& !options.allowedDevices.includes(data.body.device.name)
			) return;

			// eslint-disable-next-line no-unused-expressions
			data.body.device.is_private_session
				? res({ success: false, error: new Error('Private Session') })
				: res({
					success: true,
					result: `${data.body.item.artists[0].name} - ${data.body.item.name}`,
					smallData: `Volume: ${data.body.device.volume_percent}`,
					button: {
						label: 'Listen',
						url: data.body.item.external_urls.spotify
					}
				});
		})
		.catch((err) => res({ success: false, error: new Error(err) }));
});

const getUserCredentials = () => {
	const listener = app.listen(52752, () => logHttp('Listening for spotify auth on port 52752'));

	app.get('/', (req, res) => {
		res.sendFile(join(__dirname, '../auth.html'));
		if (!req.query.code) return console.error(new Error('No Auth Code'));
		spotifyApi
			.authorizationCodeGrant(req.query.code)
			.then((data) => {
				spotifyApi.setAccessToken(data.body.access_token);
				spotifyApi.setRefreshToken(data.body.refresh_token);
				try {
					writeFileSync(credentialPath, data.body.refresh_token);
				} catch (err) {
					console.error(err);
				}
				listener.close();
				logSpotify('Spotify has been authorized');
			})
			.catch((err) => console.error(new Error(err.body.error.message)));
	});

	const authUrl = spotifyApi.createAuthorizeURL(
		['user-read-playback-state', 'user-read-currently-playing'],
		crypto.randomBytes(16).toString('hex')
	);
	open(authUrl);
};

const authorizeSpotify = () => {
	if (existsSync(credentialPath)) {
		spotifyApi.setRefreshToken(readFileSync(credentialPath));
		spotifyApi
			.refreshAccessToken()
			.then((data) => {
				spotifyApi.setAccessToken(data.body.access_token);
				logSpotify('Spotify has been authorized');
			})
			.catch((err) => {
				logSpotifyError(err);
				logSpotifyError('Requesting user authentication');
				getUserCredentials();
			});
	} else {
		if (!existsSync(dataPath)) mkdirSync(dataPath);
		logSpotifyWarning('Refresh token file does not exist');
		logSpotifyWarning('Requesting user authentication');
		getUserCredentials();
	}
};

module.exports = spotify;
module.exports.init = authorizeSpotify;
