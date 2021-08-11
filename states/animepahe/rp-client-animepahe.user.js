// ==UserScript==
// @name         rp-client Animepahe
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Automatically loads on Animepahe
// @author       CelestialCrafter
// @match        https://animepahe.com/play/**
// @icon         https://www.google.com/s2/favicons?domain=animepahe.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(() => {
        const teInfo = document.getElementsByClassName('theatre-info')[0].children[1].innerText.split('\n')[1].split(' - ');
        let anime = {
            title: teInfo[0],
            episode: teInfo[1]
        };

        // URIEncodes every value in the object
        // eslint-disable-next-line
        Object.keys(anime).forEach(key => anime[key] = encodeURIComponent(anime[key]));

        setInterval(() => fetch(`http://localhost:49948?title=${anime.title}&episode=${anime.episode}`, { mode: 'no-cors' }), 15 * 1000);
    }, 10 * 1000);
})();