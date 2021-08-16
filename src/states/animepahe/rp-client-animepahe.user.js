// ==UserScript==
// @name         rp-client Animepahe
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Automatically loads on Animepahe
// @author       CelestialCrafter
// @match        https://animepahe.com/play/**
// @match        https://kwik.cx/e/**
// @icon         https://www.google.com/s2/favicons?domain=animepahe.com
// @grant        unsafeWindow
// ==/UserScript==

const animepahe = () => {
	setTimeout(() => {
		const teInfo = document
			.getElementsByClassName('theatre-info')[0]
			.children[1].innerText.split('\n')[1]
			.split(' - ');
		const anime = {
			title: teInfo[0],
			episode: teInfo[1]
		};

		// URIEncodes every value in the object
		// eslint-disable-next-line
		Object.keys(anime).forEach(
			(key) => (anime[key] = encodeURIComponent(anime[key]))
		);

		setInterval(
			() => fetch(
				`http://localhost:49948/anime?title=${anime.title}&episode=${anime.episode}`,
				{ mode: 'no-cors' }
			),
			15 * 1000
		);
	}, 3 * 1000);
};

const kwik = () => {
	const timeData = { currentTime: 0, duration: 0 };

	const player = document.getElementById('kwikPlayer');

	player.addEventListener('timeupdate', () => {
		timeData.currentTime = player.currentTime;
		timeData.duration = player.duration;
	});

	setInterval(
		() => fetch(
			`http://localhost:49948/time?currentTime=${timeData.currentTime}&duration=${timeData.duration}`,
			{ mode: 'no-cors' }
		),
		5 * 1000
	);
};

document.domain === 'animepahe.com' ? animepahe() : kwik();
