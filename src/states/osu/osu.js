/* eslint-disable indent */
const axios = require('axios');
const OAuth = require('oauth');
const debug = require('debug');
const options = require('./config.js');

const logOsu = debug('feature:osu');

debug.log = console.info.bind(console);

let accessToken = '';

const osu = () => new Promise(res => {
		axios
			.get(
				`https://osu.ppy.sh/api/v2/users/${options.userId}/scores/recent?include_fails=1&limit=1`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			)
			.then(response => res({
					success: true,
					// eslint-disable-next-line max-len
					result: `${response.data[0].beatmapset.artist_unicode} - ${response.data[0].beatmapset.title_unicode}`,
					button: { label: 'Spectate', url: `osu://spectate/${options.userId}` }
				}))
			.catch(error => res({ success: false, error }));
	});

const authorizeOsu = () => {
	const oauth2 = new OAuth.OAuth2(
		options.clientId,
		options.clientSecret,
		'https://osu.ppy.sh/',
		null,
		'oauth/token',
		null
	);

	oauth2.getOAuthAccessToken(
		'',
		{ grant_type: 'client_credentials', scope: 'public' },
		(err, accessTokenResp) => {
			accessToken = accessTokenResp;
			logOsu('osu! has been authorized');
		}
	);
};

module.exports = osu;
module.exports.init = authorizeOsu;
