const app = require('express')();
const debug = require('debug');

const logHttp = debug('feature:http');
const logAnime = debug('feature:anime');

let currentAnime = null;
let lastRequestTimestamp = 0;

const animepahe = () =>
	new Promise((res, rej) => {
		if (!currentAnime) res({ success: false, error: new Error('No Anime') });
		else
			res({
				success: true,
				result: `${currentAnime.title} - Episode ${currentAnime.episode}`,
				usingText: 'Watching Anime'
			});
	});

const startAnimeServer = () => {
	app.get('/', (req, res) => {
		const anime = {
			title: req.query.title,
			episode: req.query.episode
		};
		currentAnime = anime;
		lastRequestTimestamp = Date.now();

		logAnime(`Anime: ${anime.title} - ${anime.episode}`);
		setTimeout(() => {
			if (Date.now() - lastRequestTimestamp > 30 * 1000) {
				currentAnime = null;
				logAnime(
					'Browser has not sent anime data within 30 seconds. Clearing anime data'
				);
			}
		}, 30 * 1000);

		res.status(200).json({});
	});

	app.listen(49948, () => logHttp('Listening for anime data on port 49948'));
};

module.exports = animepahe;
module.exports.init = startAnimeServer;
