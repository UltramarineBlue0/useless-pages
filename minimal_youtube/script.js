"use strict";

const ytIframeId = "yt-iframe";
const ytIframe = document.getElementById(ytIframeId);
const queryInput = document.getElementById("query");

// load playlist if a hash is present
const fragmentId = document.location.hash;
if (fragmentId.length > 1) {
	ytIframe.src = `https://www.youtube.com/embed?list=${encodeURIComponent(fragmentId.substring(1))}&listType=playlist&hl=en-US&gl=US&enablejsapi=1&cc_lang_pref=en&modestbranding=1`;
	queryInput.blur();
} else {
	// default youtube video
	ytIframe.src = `https://www.youtube.com/embed/feBF_IY-HI8?hl=en-US&gl=US&enablejsapi=1&cc_lang_pref=en&modestbranding=1`;
}

window.addEventListener("hashchange", () => document.location.reload(false));

import { isEmpty } from "../common/utils.js";
import { alertError, assertNotEmpty } from "../common/assertions.js";

self.onYouTubeIframeAPIReady = () => {
	const onPlayerError = event => {
		console.log(`Player error: ${JSON.stringify(event, null, 2)}`);
		alert(`YouTube reported error code:\n${event.data}`);
	};

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

	// Only accept urls from YouTube's own hostnames
	const YT_urlShort = "youtu.be".toLowerCase();
	const YT_normal = "youtube.com".toLowerCase();
	const YT_nocookie = "youtube-nocookie.com".toLowerCase();

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

		throw new Error(`Unknown format: ${input}`);
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

		throw new Error(`Unknown format: ${input}`);
	};

	// form elements
	const preferResolution = document.getElementById("resolution");
	const playbackSpeed = document.getElementById("speed");
	const formElement = document.getElementById("form");
	const queryType = document.getElementById("type");
	const volumeSlider = document.getElementById("volumeSlider");

	const onPlayerReady = e => {
		const player = e.target;

		formElement.addEventListener("submit", event => {
			event.preventDefault();
			event.stopImmediatePropagation();

			const resolution = preferResolution.value;
			const type = queryType.value;
			const query = queryInput.value.trim().normalize();

			try {
				// cancel the currently playing video. when playing a playlist: in certain situations, YT will autoplay the newly queued video
				// stopVideo() causes the player to lose some of the current setting. those are reapplied in onStateChange
				if (!isEmpty(player.getPlaylist())) {
					switch (player.getPlayerState()) {
						case YT.PlayerState.BUFFERING:
						case YT.PlayerState.PLAYING:
						case YT.PlayerState.UNSTARTED:
							player.stopVideo();
						default:
							break;
					}
				}

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
			} catch (error) {
				console.log(`Form error: ${error}`);
				alertError(error, `Error parsing "${query}"`);
			}
		});

		playbackSpeed.addEventListener("change", () => {
			player.setPlaybackRate(Number.parseFloat(playbackSpeed.value));
		});

		// playback quality currently doesn't work. neither on chrome nor on firefox :(
		preferResolution.addEventListener("change", () => {
			player.setPlaybackQuality(preferResolution.value);
		});

		const volumeValueDisp = document.getElementById("volumeValueDisp");
		volumeSlider.addEventListener("change", () => {
			const selectedVolume = volumeSlider.valueAsNumber;
			player.setVolume(selectedVolume);
			volumeValueDisp.textContent = selectedVolume;
		});
		volumeValueDisp.textContent = volumeSlider.valueAsNumber;

		document.getElementById("shufflePlaylist").addEventListener("click", () => player.setShuffle(true));
	};

	const convertSecToString = seconds => {
		let remainingSecs = seconds;
		let returnStr = "";

		const hours = Math.trunc(remainingSecs / 3600);
		remainingSecs = remainingSecs % 3600;
		if (hours > 0) {
			returnStr += hours + "h ";
		}

		const minutes = Math.trunc(remainingSecs / 60);
		remainingSecs = remainingSecs % 60;
		// for consistency: show 0 minutes if there's an hour count
		if (minutes > 0 || hours > 0) {
			returnStr += minutes + "m ";
		}

		// 0 seconds length means that the video is currently still loading. don't display anything
		if (remainingSecs > 0 || minutes > 0 || hours > 0) {
			returnStr += Math.ceil(remainingSecs) + "s";
		}

		return returnStr;
	};

	const originalTitle = document.title;
	const channel = document.getElementById("channel");
	const videoTitle = document.getElementById("videoTitle");
	const videoLength = document.getElementById("videoLength");

	const onStateChange = event => {
		const player = event.target;
		const state = event.data;

		const videoData = player.getVideoData();
		const videoName = videoData.title;
		const channelName = videoData.author;

		// according to the docs, yt player should reset the playback speed on new queue, however that behavior is not consistent
		// moreover, on firefox the player could be stuck on 1x speed, if the new speed is the same as the old setting and the player has reset the speed
		// between videos. setting it to a different playback speed "unstucks" the player
		const updatePlayerSetting = () => {
			const selectedSpeed = Number.parseFloat(playbackSpeed.value);
			if (selectedSpeed <= 1) {
				player.setPlaybackRate(2);
			} else {
				player.setPlaybackRate(0.25);
			}
			player.setPlaybackRate(selectedSpeed);
			player.setVolume(volumeSlider.valueAsNumber);
			player.setPlaybackQuality(preferResolution.value);
		};
		// video started playing: change window title
		const updateWindowTitle = () => document.title = `${videoName} ― ${channelName}`;
		// reset window title when video is not playing
		const resetWindowTitle = () => document.title = originalTitle;
		// disable autoplay if currently in the middle of a playlist: each video must be manually started by the user
		// stopVideo() puts the player in a strange state, it'll sometimes "lose" information about the current video, when it's called right at the beginning of a video
		const stopAutoplay = () => {
			const currentPlaylist = player.getPlaylist();
			if (!isEmpty(currentPlaylist)) {
				player.pauseVideo();
			}
		};
		// display info about the currently loaded video
		// sometimes, when a video is paused right at the beginning and then a different video is selected from the playlist, the newly selected video will
		// start playing without going through the UNSTARTED state. also, the information is not available when a single video is queued:
		// update on both playing and buffering
		const updateVideoInfo = () => {
			const durationInSec = player.getDuration();
			channel.textContent = channelName;
			videoTitle.textContent = videoName;
			videoLength.textContent = convertSecToString(durationInSec);
		};

		switch (state) {
			case YT.PlayerState.BUFFERING:
				updatePlayerSetting();
				break;
			case YT.PlayerState.PLAYING:
				updateVideoInfo();
				updateWindowTitle();
				break;
			case YT.PlayerState.ENDED:
				stopAutoplay();
				resetWindowTitle();
				break;
			case YT.PlayerState.UNSTARTED:
				updateVideoInfo();
			default:
				resetWindowTitle();
				break;
		}
	};

	new YT.Player(ytIframeId, {
		events: {
			onReady: onPlayerReady,
			onError: onPlayerError,
			onStateChange: onStateChange,
		},
	});
};
