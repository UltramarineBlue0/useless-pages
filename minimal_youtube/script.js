"use strict";
self.onYouTubeIframeAPIReady = () => {
	// Selected video resolution
	const preferredRes = document.getElementById("resolution");

	const onPlayerStateChange = event => {
		// when a video first started playing, change quality to the selected quality
		// somehow doesn't work, even if I set the quality on every state change event
		const playerState = event.data;
		if (playerState === -1 || playerState === 5) {
			const player = event.target;
			player.setPlaybackQuality(preferredRes.value);
		}
	};

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
		const formElement = document.getElementById("form");
		const queryType = document.getElementById("type");
		const queryInput = document.getElementById("query");

		const showError = input => {
			alert("Invalid / unsupported YouTube URL:\n" + input);
		};

		const checkNotEmpty = input => {
			if (input === null || input === undefined || input.length === 0) {
				throw "Empty";
			}

			return input;
		};

		const getVideoID = input => {
			const url = new URL(input);
			const hostname = url.hostname.toLowerCase();
			const pathArray = url.pathname.split("/");

			if (hostname.endsWith(YT_urlShort)) {
				// for youtube's url shortener, e.g. "https://youtu.be/VIDEO_ID?t=123"
				if (pathArray.length === 2) {
					return checkNotEmpty(pathArray[1]);
				}
			} else if (hostname.endsWith(YT_normal) || hostname.endsWith(YT_nocookie)) {
				const searchParams = url.searchParams;

				if (pathArray[1] === "v" || pathArray[1] === "embed") {
					// for url for the embedded player, e.g. "https://www.youtube.com/v/VIDEO_ID?start=123"
					return checkNotEmpty(pathArray[2]);
				} else if (searchParams.has("v")) {
					// for normal youtube urls, e.g. "https://www.youtube.com/watch?v=VIDEO_ID&t=1m1s"
					return checkNotEmpty(searchParams.get("v"));
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

			const resolution = preferredRes.value;
			const type = queryType.value;
			const query = queryInput.value.trim().normalize();

			if (type === "url") {
				// Load video based on the video id in the url
				try {
					const videoID = getVideoID(query);
					player.cueVideoById({
						videoId: videoID,
						suggestedQuality: resolution,
					});
				} catch (error) {
					showError(query);
				}
			} else if (type === "playlist") {
				// Load playlist based on the playlist id in the url
				try {
					const playlistID = getPlaylistID(query);
					player.cuePlaylist({
						listType: type,
						list: playlistID,
						suggestedQuality: resolution,
					});
				} catch (error) {
					showError(query);
				}
			} else {
				// Load list of videos based on the query. That can either be a search term or a channel name
				player.cuePlaylist({
					listType: type,
					list: query,
					suggestedQuality: resolution,
				});
			}
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
			onStateChange: onPlayerStateChange,
			onError: onPlayerError,
		},
	});
};