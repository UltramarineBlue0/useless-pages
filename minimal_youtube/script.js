"use strict";

import { deepFreeze, global, isEmpty } from "../common/utils.js";
import { alertError, assertNotEmpty } from "../common/assertions.js";

global.onYouTubeIframeAPIReady = deepFreeze(() => {
	const onPlayerError = event => {
		console.log(`Player error: ${event}`);
		alert(`YouTube reported error code:\n${event.data}`);
	};

	const onPlayerReady = e => {
		const player = e.target;

		// Only accept urls from YouTube's own hostnames
		const YT_urlShort = "youtu.be".toLowerCase();
		const YT_normal = "youtube.com".toLowerCase();
		const YT_nocookie = "youtube-nocookie.com".toLowerCase();

		const iframeWindow = document.getElementById("yt-iframe").contentWindow;

		// form elements
		const preferResolution = document.getElementById("resolution");
		const playbackSpeed = document.getElementById("speed");
		const formElement = document.getElementById("form");
		const queryType = document.getElementById("type");
		const queryInput = document.getElementById("query");

		const defaultToZero = input => {
			const result = Number.parseInt(input, 10);
			if (Number.isInteger(result)) {
				return result;
			}
			return 0;
		};

		// Unfortunately I don't see a good way of parsing the old style timestamp without regex or external dependencies
		// match optional seconds param, only capturing the digits, dropping the unit "s"
		// match optional minutes param, only capturing the digits, dropping the unit "m"
		// match optional hours param, only capturing the digits, dropping the unit "h"
		const regex = /^(?:(\d+)(?:h))?(?:(\d+)(?:m))?(?:(\d+)(?:s))?$/i;

		const getStartSeconds = searchParams => {
			let start = searchParams.get("t");
			if (isEmpty(start)) {
				start = searchParams.get("start");
				// neither t nor start is defined as a query param: start at 0
				if (isEmpty(start)) {
					return 0;
				}
			}

			// js' parseInt parses any numerical characters at the beginning of a string, regardless what characters follows it
			// so first try to see if the time parameter is in the old format
			const resultArray = regex.exec(start);
			if (isEmpty(resultArray)) {
				// if the param is a simple int: url in new syntax: ?t=34200 (9h30m0s)
				return defaultToZero(start);
			}

			let seconds = 0;
			seconds += defaultToZero(resultArray[3]);
			seconds += defaultToZero(resultArray[2]) * 60;
			seconds += defaultToZero(resultArray[1]) * 3600;
			return seconds;
		};

		const getVideoID = input => {
			const url = new URL(input);
			const hostname = url.hostname.toLowerCase();
			const pathArray = url.pathname.split("/");
			const searchParams = url.searchParams;
			const startSeconds = getStartSeconds(searchParams);

			if (hostname.endsWith(YT_urlShort)) {
				// for youtube's url shortener, e.g. "https://youtu.be/VIDEO_ID?t=123"
				if (pathArray.length === 2) {
					return [assertNotEmpty(pathArray[1]), startSeconds];
				}
			} else if (hostname.endsWith(YT_normal) || hostname.endsWith(YT_nocookie)) {
				if (pathArray[1] === "v" || pathArray[1] === "embed") {
					// for url for the embedded player, e.g. "https://www.youtube.com/v/VIDEO_ID?start=123"
					return [assertNotEmpty(pathArray[2]), startSeconds];
				} else if (searchParams.has("v")) {
					// for normal youtube urls, e.g. "https://www.youtube.com/watch?v=VIDEO_ID&t=1m1s"
					return [assertNotEmpty(searchParams.get("v")), startSeconds];
				}
			}

			throw "Unknown format";
		};

		const getPlaylistID = input => {
			const url = new URL(input);
			const hostname = url.hostname.toLowerCase();
			const searchParams = url.searchParams;

			if (hostname.endsWith(YT_urlShort) || hostname.endsWith(YT_normal) || hostname.endsWith(YT_nocookie)) {
				if (searchParams.has("list")) {
					return assertNotEmpty(searchParams.get("list"));
				}
			}

			throw "Unknown format";
		};

		formElement.addEventListener("submit", event => {
			event.preventDefault();
			event.stopImmediatePropagation();

			const resolution = preferResolution.value;
			const type = queryType.value;
			const query = queryInput.value.trim().normalize();

			try {
				if (type === "url") {
					// Load video based on the video id in the url
					const [videoID, startSeconds] = getVideoID(query);
					player.cueVideoById({
						videoId: videoID,
						startSeconds: startSeconds,
						suggestedQuality: resolution,
					});
				} else {
					let playlistID;

					if (type === "playlist") {
						// Load playlist based on the playlist id in the url
						playlistID = getPlaylistID(query);
					} else {
						// Load list of videos based on the query. That can either be a search term or a channel name
						playlistID = query;
					}

					player.cuePlaylist({
						listType: type,
						list: playlistID,
						suggestedQuality: resolution,
					});
				}

				queryInput.blur();
				iframeWindow.focus();
			} catch (error) {
				console.log(`Form error: ${error}`);
				alertError(error, `Error parsing "${query}"`);
			}
		});

		playbackSpeed.addEventListener("change", () => {
			player.setPlaybackRate(Number.parseFloat(playbackSpeed.value));
		});

		preferResolution.addEventListener("change", () => {
			player.setPlaybackQuality(preferResolution.value);
		});
	};

	new YT.Player("yt-iframe", deepFreeze({
		playerVars: {
			hl: "en-US",
			gl: "US",
			enablejsapi: 1,
			cc_lang_pref: "en",
			modestbranding: 1,
		},
		events: {
			onReady: onPlayerReady,
			onError: onPlayerError,
		},
	}));
});