"use strict";
self.onYouTubeIframeAPIReady = () => {
	const onPlayerError = event => {
		alert("YouTube reported error code:\n" + event.data);
	};

	const onPlayerReady = e => {
		const player = e.target;

		// Only accept urls from YouTube's own hostnames
		const YT_urlShort = "youtu.be".toLowerCase();
		const YT_normal = "youtube.com".toLowerCase();
		const YT_nocookie = "youtube-nocookie.com".toLowerCase();

		// form elements
		const preferResolution = document.getElementById("resolution");
		const playbackSpeed = document.getElementById("speed");
		const formElement = document.getElementById("form");
		const queryType = document.getElementById("type");
		const queryInput = document.getElementById("query");

		const showError = input => {
			alert("Invalid / unsupported YouTube URL:\n" + input);
		};

		const isEmpty = input => {
			return input === null || input === undefined || input.length === 0;
		};

		const checkNotEmpty = input => {
			if (isEmpty(input)) {
				throw "Empty";
			}

			return input;
		};

		const defaultToZero = input => {
			const result = Number.parseInt(input);
			if (Number.isNaN(result)) {
				return 0;
			}
			return result;
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

				let seconds = Number.parseInt(start, 10);
				// if the param is a simple int: url in new syntax: ?t=34200 (9h30m0s)
				if (Number.isNaN(seconds)) {
					return 0;
				} else {
					return seconds;
				}
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
					return [checkNotEmpty(pathArray[1]), startSeconds];
				}
			} else if (hostname.endsWith(YT_normal) || hostname.endsWith(YT_nocookie)) {
				if (pathArray[1] === "v" || pathArray[1] === "embed") {
					// for url for the embedded player, e.g. "https://www.youtube.com/v/VIDEO_ID?start=123"
					return [checkNotEmpty(pathArray[2]), startSeconds];
				} else if (searchParams.has("v")) {
					// for normal youtube urls, e.g. "https://www.youtube.com/watch?v=VIDEO_ID&t=1m1s"
					return [checkNotEmpty(searchParams.get("v")), startSeconds];
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
					return checkNotEmpty(searchParams.get("list"));
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
				player.getIframe().focus();
			} catch (error) {
				showError(query);
			}
		});

		playbackSpeed.addEventListener("change", () => {
			player.setPlaybackRate(Number.parseFloat(playbackSpeed.value));
		});

		preferResolution.addEventListener("change", () => {
			player.setPlaybackQuality(preferResolution.value);
		});
	};

	const unused = new YT.Player("yt-iframe", {
		playerVars: {
			autoplay: 0,
			enablejsapi: 1,
			hl: "en-US",
			gl: "US",
			modestbranding: 1,
			playsinline: 1,
			showinfo: 1,
		},
		events: {
			onReady: onPlayerReady,
			onError: onPlayerError,
		},
	});
};