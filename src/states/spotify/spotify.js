const SpotifyWebApi = require('spotify-web-api-node');
const app = require('express')();
const open = require('open');
const crypto = require('crypto');
const {
	writeFileSync, readFileSync, existsSync, mkdirSync
} = require('fs');
const { join } = require('path');
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

const dataPath = join(__dirname, 'data/');
const credentialPath = join(dataPath, 'spotifyCredentials.txt');

const getUserCredentials = () => {
	const listener = app.listen(52752, () => logHttp('Listening for spotify auth on port 52752'));

	app.get('/', (req, res) => {
		res.sendFile(join(__dirname, '../auth.html'));
		if (!req.query.code) return logSpotifyError('No Auth Code');
		spotifyApi
			.authorizationCodeGrant(req.query.code)
			.then(data => {
				spotifyApi.setAccessToken(data.body.access_token);
				spotifyApi.setRefreshToken(data.body.refresh_token);
				try {
					writeFileSync(credentialPath, data.body.refresh_token);
				} catch (err) {
					logSpotifyError(err);
				}
				listener.close();
				logSpotify('Spotify has been authorized');
			})
			.catch(err => logSpotifyError(err.body.error.message));
	});

	const authUrl = spotifyApi.createAuthorizeURL(
		[
			'user-read-playback-state',
			'user-read-currently-playing',
			...options.extraScopes
		],
		crypto.randomBytes(16).toString('hex')
	);
	open(authUrl);
};

const authorizeSpotify = () => {
	if (existsSync(credentialPath)) {
		spotifyApi.setRefreshToken(readFileSync(credentialPath));
		spotifyApi
			.refreshAccessToken()
			.then(data => {
				spotifyApi.setAccessToken(data.body.access_token);
				logSpotify('Spotify has been authorized');
			})
			.catch(err => {
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

const spotify = () => new Promise(res => {
	spotifyApi
		.getMyCurrentPlaybackState()
		.then(data => {
			// Check if spotify is running on an authorized device
			if (!data.body.device) res({ success: false, error: new Error('No Device') });
			if (
				!(
					options.allowedDevices.includes(data.body.device.id)
						|| options.allowedDevices.includes(data.body.device.name)
				)
			) res({ success: false, error: new Error('Unauthorized Device') });

			// eslint-disable-next-line max-len
			if (data.body.currently_playing_type === 'ad') res({ success: false, error: new Error('Ad is currently playing') });
			else res({
				success: true,
				result: `${data.body.item.artists[0].name} - ${data.body.item.name}`,
				smallData: `Volume: ${data.body.device.volume_percent}`,
				button: {
					label: 'Listen',
					url: data.body.item.external_urls.spotify
				},
				startTimestamp: Date.now() - data.body.progress_ms,
				// eslint-disable-next-line max-len
				endTimestamp: options.timeLeft
					? Date.now() - data.body.progress_ms + data.body.item.duration_ms
					: undefined
			});
		})
		.catch(err => {
			if (err.toString().toLowerCase().includes('access token expired')) {
				logSpotifyWarning('Access token expired! Regenerating access token.');
				authorizeSpotify();
			}
			res({ success: false, error: err });
		});
});

module.exports = spotify;
module.exports.init = authorizeSpotify;
