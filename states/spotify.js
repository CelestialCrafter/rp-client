const SpotifyWebApi = require('spotify-web-api-node');
const app = require('express')();
const open = require('open');
const crypto = require('crypto');
const { writeFileSync, readFileSync, existsSync } = require('fs');
const { join } = require('path');

const spotifyApi = new SpotifyWebApi({
	redirectUri: 'http://localhost:52752/',
	clientId: '1e30f68691034f77ad92c2878480005d',
	clientSecret: '2b583abd4cff43d695984340f20a1af2'
});

const credentialPath = join(__dirname, '../data/spotifyCredentials.txt');

const allowedDeviceIds = [
	// Phone
	'03d93e7ab244b99003a06cf373810b8e19c7d351',
	// Computer
	'fb26fea75472bb257e4feaa535a37396809fb853'
]

const spotify = () =>
	new Promise((res, rej) => {
		spotifyApi
			.getMyCurrentPlaybackState()
			.then(data => {
				if (!data.body.device) return;
				if (!allowedDeviceIds.includes(data.body.device.id)) return;
				res({
					success: true,
					result: `${data.body.item.artists[0].name} - ${data.body.item.name}`,
					button: {
						label: 'Listen',
						url: data.body.item.external_urls.spotify
					}
				});
			})
			.catch(err => res({ success: false, error: new Error(err) }));
	});

const getUserCredentials = () => {
	const listener = app.listen(52752, () =>
		console.log('Listening for spotify auth on port 52752')
	);

	app.get('/', (req, res) => {
		res.json({ success: true });
		spotifyApi
			.authorizationCodeGrant(req.query.code)
			.then(data => {
				spotifyApi.setAccessToken(data.body['access_token']);
				spotifyApi.setRefreshToken(data.body['refresh_token']);
				try {
					writeFileSync(credentialPath, data.body['refresh_token']);
				} catch(err) {
					console.log(err);
					console.log(credentialPath)
				}
				listener.close();
				console.log('Spotify has been authorized');
			})
			.catch(err => console.log('Error: ' + err.body.error.message));
	});

	const authUrl = spotifyApi.createAuthorizeURL(
		['user-read-playback-state', 'user-read-currently-playing'],
		crypto.randomBytes(15).toString('hex')
	);
	open(authUrl);
};

if (existsSync(credentialPath)) {
	spotifyApi.setRefreshToken(readFileSync(credentialPath));
	spotifyApi.refreshAccessToken().then(data => {
		spotifyApi.setAccessToken(data.body['access_token']);
		console.log('Spotify has been authorized');
	}).catch(err => {
		console.log(err);
		console.log('Requesting user authentication');
		getUserCredentials();
	})
} else {
	console.log('Refresh token file does not exist');
	console.log('Requesting user authentication');
	getUserCredentials();
}

module.exports = spotify;
