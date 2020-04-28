"use strict";

const ytIframeId = "yt-iframe";
const ytIframe = document.getElementById(ytIframeId);

// load playlist if a hash is present
// the "-nocookie" domain prevents viewing behaviour here affecting the main YouTube page
const fragmentId = location.hash;
if (fragmentId.length > 1) {
	ytIframe.contentWindow.focus();
	const playlistID = encodeURIComponent(fragmentId.trim().substring(1));
	ytIframe.src = `https://www.youtube-nocookie.com/embed?list=${playlistID}&listType=playlist&hl=en-US&gl=US&enablejsapi=1&modestbranding=1`;
} else {
	// default youtube video
	ytIframe.src = `https://www.youtube-nocookie.com/embed/xbBr5b3-wSQ?hl=en-US&gl=US&enablejsapi=1&modestbranding=1`;
}

window.addEventListener("hashchange", () => location.reload());

import { isEmpty, alertError } from "../common/utils.js";
import { convertSecToString, getPlaylistID, getVideoID } from "./yt_util.js";

globalThis.onYouTubeIframeAPIReady = () => {
	const onPlayerError = event => {
		console.log(`Player error: ${JSON.stringify(event, null, 2)}`);
		alert(`YouTube reported error code:\n${event.data}`);
	};

	// form elements
	const queryInput = document.getElementById("query");
	const playbackSpeed = document.getElementById("speed");
	const speedValueDisp = document.getElementById("speedValueDisp");
	const formElement = document.getElementById("form");
	const queryType = document.getElementById("type");
	const volumeSlider = document.getElementById("volumeSlider");
	const volumeValueDisp = document.getElementById("volumeValueDisp");

	volumeValueDisp.textContent = volumeSlider.valueAsNumber;
	speedValueDisp.textContent = playbackSpeed.valueAsNumber;

	const onPlayerReady = e => {
		const player = e.target;

		formElement.addEventListener("submit", event => {
			event.preventDefault();
			event.stopImmediatePropagation();

			const type = queryType.value;
			const query = queryInput.value.trim();

			try {
				if (type === "url") {
					// Load video based on the video id in the url
					const [videoID, startSeconds] = getVideoID(query);
					player.cueVideoById({
						videoId: videoID,
						startSeconds: startSeconds,
					});
				} else {
					let playlistID;

					if (type === "playlist") {
						// Load playlist based on the playlist id in the url
						playlistID = getPlaylistID(query);
					} else {
						// Load list of videos from channel name
						playlistID = query;
					}

					player.cuePlaylist({
						listType: type,
						list: playlistID,
					});
				}

				// Issue with firefox (addons?): focus is ignored if it's immediately changed after queueing something. Fix by delaying it
				// cancel the currently playing video. when playing a playlist: in certain situations, YT will autoplay the newly queued video
				// stopVideo() causes the player to lose some of the current setting. those are reapplied in onStateChange
				setTimeout(() => {
					ytIframe.contentWindow.focus();
					player.stopVideo();
				}, 9);
			} catch (error) {
				console.log(`Form error: ${error}`);
				alertError(error, `Error parsing "${query}"`);
			}
		});

		playbackSpeed.addEventListener("change", () => {
			const selectedSpeed = playbackSpeed.valueAsNumber;
			player.setPlaybackRate(selectedSpeed);
			speedValueDisp.textContent = playbackSpeed.valueAsNumber;
		});

		volumeSlider.addEventListener("change", () => {
			const selectedVolume = volumeSlider.valueAsNumber;
			player.setVolume(selectedVolume);
			volumeValueDisp.textContent = selectedVolume;
		});

		document.getElementById("playbackToggle").addEventListener("click", () => {
			const currentState = player.getPlayerState();
			if (currentState === YT.PlayerState.BUFFERING || currentState === YT.PlayerState.PLAYING) {
				player.pauseVideo();
			} else {
				player.playVideo();
			}
		});

		document.getElementById("rewind").addEventListener("click", () => {
			const currentVideoTime = player.getCurrentTime();
			player.seekTo(Math.max(0, currentVideoTime - 15), true);
		});

		document.getElementById("fastForward").addEventListener("click", () => {
			const currentVideoTime = player.getCurrentTime();
			player.seekTo(Math.min(Number.MAX_SAFE_INTEGER, currentVideoTime + 15), true);
		});
	};

	const originalTitle = document.title;
	const channel = document.getElementById("channel");
	const videoTitle = document.getElementById("videoTitle");
	const videoLength = document.getElementById("videoLength");
	const videoLength2 = document.getElementById("videoLength2");
	const videoTime = document.getElementById("videoTime");

	let previousState = YT.PlayerState.UNSTARTED;
	let videoTimeUpdater;

	const onStateChange = event => {
		const player = event.target;
		const state = event.data;

		const videoData = player.getVideoData();
		const videoName = videoData.title;
		const channelName = videoData.author;

		// according to the docs, yt player should reset the playback speed on new queue, however that behavior is not consistent
		// moreover, on firefox the player could be stuck on 1x speed, if the new speed is the same as the old setting and the player has reset the speed
		// between videos. setting it to a different playback speed "unstucks" the player
		// delay the configuration after the BUFFERING event, otherwise some settings might be ignored
		const resetPlayerAtVideoBegin = () => {
			// only apply settings on the transition from one of the "dead" states (UNSTARTED, CUED, ENDED) to one of the "playing"
			// states (PLAYING, BUFFERING)
			if (previousState != YT.PlayerState.PAUSED && previousState != YT.PlayerState.PLAYING && previousState != YT.PlayerState.BUFFERING) {
				const selectedSpeed = playbackSpeed.valueAsNumber;
				if (selectedSpeed < 1.25) {
					player.setPlaybackRate(2);
				} else {
					player.setPlaybackRate(1);
				}
				player.setVolume(0);

				setTimeout(() => {
					player.setPlaybackRate(selectedSpeed);
					player.setVolume(volumeSlider.valueAsNumber);
				}, 9);
			}
		};
		// video started playing: change window title
		const updateWindowTitle = () => document.title = `${videoName} ― ${channelName}`;
		// reset window title when video is not playing
		const resetWindowTitle = () => document.title = originalTitle;
		// disable autoplay if currently in the middle of a playlist: each video must be manually started by the user
		// stopVideo() puts the player in a strange state, it'll sometimes lose information about the current video, when it's called right at the
		// beginning of a video
		const stopAutoplay = () => {
			const currentPlaylist = player.getPlaylist();
			if (!isEmpty(currentPlaylist)) {
				setTimeout(() => player.pauseVideo(), 9);
			}
		};
		// display info about the currently loaded video
		// sometimes, when a video is paused right at the beginning and then a different video is selected from the playlist, the newly selected video will
		// start playing without going through the UNSTARTED state. also, the information is not available when a single video is queued:
		// update on both playing and buffering
		const updateVideoInfo = () => {
			const videoDuration = convertSecToString(player.getDuration());
			channel.textContent = channelName;
			videoTitle.textContent = videoName;
			videoLength.textContent = videoDuration;
			videoLength2.textContent = videoDuration;
		};

		const startVideoTimeUpdater = () => {
			if (isEmpty(videoTimeUpdater)) {
				videoTimeUpdater = setInterval(() => {
					videoTime.textContent = convertSecToString(player.getCurrentTime());
				}, 200);
			}
		};

		const stopVideoTimeUpdater = () => {
			if (!isEmpty(videoTimeUpdater)) {
				clearInterval(videoTimeUpdater);
				videoTimeUpdater = undefined;
				videoTime.textContent = "";
			}
		};

		switch (state) {
			case YT.PlayerState.BUFFERING:
			case YT.PlayerState.PLAYING:
				resetPlayerAtVideoBegin();
				startVideoTimeUpdater();
				updateVideoInfo();
				updateWindowTitle();
				break;
			case YT.PlayerState.UNSTARTED:
			case YT.PlayerState.CUED:
				updateVideoInfo();
				stopVideoTimeUpdater();
				resetWindowTitle();
				break;
			case YT.PlayerState.ENDED:
				stopAutoplay();
				stopVideoTimeUpdater();
			case YT.PlayerState.PAUSED:
				resetWindowTitle();
				break;
		}

		previousState = state;
	};

	new YT.Player(ytIframeId, {
		events: {
			onReady: onPlayerReady,
			onError: onPlayerError,
			onStateChange: onStateChange,
		},
	});
};

const iframeContainer = document.getElementById("iframe-box");
const embedBoxClass = "embed-box";
const hidePlayerClass = "hide-player";
const toggleButton = document.getElementById("iframeToggle");
const playbackControls = document.getElementById("playbackControls");
toggleButton.addEventListener("click", () => {
	iframeContainer.classList.toggle(embedBoxClass);
	iframeContainer.classList.toggle(hidePlayerClass);
	playbackControls.hidden = !playbackControls.hidden;
	if (playbackControls.hidden) {
		toggleButton.textContent = "Hide player";
	} else {
		toggleButton.textContent = "Show player";
	}
});