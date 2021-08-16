const app = require('express')();
const debug = require('debug');

const logHttp = debug('feature:http');
const logAnime = debug('feature:anime');

let currentAnime = null;
let currentTime = null;

let animeLastRequestTimestamp = 0;
let timeLastRequestTimestamp = 0;

const animepahe = () => new Promise(res => {
	const time = Date.now();

	if (!currentAnime) res({ success: false, error: new Error('No Anime') });
	if (!currentTime) res({ success: false, error: new Error('No Time') });
	else {
		res({
			success: true,
			result: `${currentAnime.title} - Episode ${currentAnime.episode}`,
			usingText: 'Watching Anime',
			startTimestamp: time,
			endTimestamp: time + (currentTime.duration - currentTime.currentTime)
		});
	}
});

const startAnimeServer = () => {
	app.get('/anime', (req, res) => {
		const anime = {
			title: req.query.title,
			episode: req.query.episode
		};
		currentAnime = anime;
		animeLastRequestTimestamp = Date.now();

		logAnime(`Anime: ${anime.title} - ${anime.episode}`);
		setTimeout(() => {
			if (Date.now() - animeLastRequestTimestamp > 30 * 1000) {
				currentAnime = null;
				logAnime(
					'Browser has not sent anime data within 30 seconds. Clearing anime data'
				);
			}
		}, 30 * 1000);

		res.status(200).json({});
	});

	app.get('/time', (req, res) => {
		currentTime = {
			currentTime: req.query.currentTime * 1000,
			duration: req.query.duration * 1000
		};
		timeLastRequestTimestamp = Date.now();

		const dateTime = new Date(currentTime.currentTime);
		const dateDuration = new Date(currentTime.duration);

		const formatTime = `${dateTime.getMinutes()}:${dateTime.getSeconds()}`;
		const formatDuration = `${dateDuration.getMinutes()}:${dateDuration.getSeconds()}`;

		logAnime(
			`Time: ${formatTime}/${formatDuration}`
		);
		setTimeout(() => {
			if (Date.now() - timeLastRequestTimestamp > 10 * 1000) {
				currentTime = null;
				logAnime(
					'Browser has not sent time data within 10 seconds. Clearing time data'
				);
			}
		}, 10 * 1000);

		res.status(200).json({});
	});

	app.listen(49948, () => logHttp('Listening for anime data on port 49948'));
};

module.exports = animepahe;
module.exports.init = startAnimeServer;
