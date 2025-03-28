"use strict";

const scIframeId = "sc-iframe";
const scIframe = document.getElementById(scIframeId);

const urlPrefix = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/";
const urlSuffix = "&color=%23000000&auto_play=false&show_comments=false&show_teaser=false&single_active=false";
const defaultPlaylist = "playlists/346110701";

const createUrl = (pathSegment = defaultPlaylist) => `${urlPrefix}${pathSegment}${urlSuffix}`;

// load tracks from the hash/search box
// chrome clears the search box after reload, reset it here
const fragmentId = location.hash.trim();
let playlistID;
if (fragmentId.length > 1) {
	playlistID = fragmentId.substring(1);
} else {
	location.hash = defaultPlaylist;
	playlistID = defaultPlaylist;
}
const pathSegmentInput = document.getElementById("pathSegment");
scIframe.contentWindow.focus();
scIframe.src = createUrl(playlistID);
pathSegmentInput.value = playlistID;

window.addEventListener("hashchange", () => location.reload());

import { isEmpty, alertError } from "../common/utils.js";

document.getElementById("headerForm").addEventListener("submit", event => {
	event.preventDefault();
	event.stopImmediatePropagation();

	const pathSegment = pathSegmentInput.value.trim();
	if (!isEmpty(pathSegment)) {
		location.hash = pathSegment;
	}
});

const scWidget = SC.Widget(scIframeId);
scWidget.bind(SC.Widget.Events.ERROR, (...listenerArgs) => {
	console.log(listenerArgs);
	alertError(JSON.stringify(listenerArgs, null, 2));
});
scWidget.bind(SC.Widget.Events.READY, () => {
	// Some of it is copied from the youtube player
	// Volume control
	const volumeSlider = document.getElementById("volumeSlider");
	const volumeValueDisp = document.getElementById("volumeValueDisp");
	volumeValueDisp.textContent = volumeSlider.valueAsNumber;
	const setVolume = () => {
		const selectedVolume = volumeSlider.valueAsNumber;
		scWidget.setVolume(selectedVolume);
		volumeValueDisp.textContent = selectedVolume;
	};

	volumeSlider.addEventListener("change", setVolume);
	scWidget.bind(SC.Widget.Events.PLAY, setVolume);

	// Playback position
	document.getElementById("rewind").addEventListener("click", () => {
		scWidget.getPosition((currentPosition) =>
			scWidget.seekTo(Math.max(0, currentPosition - 8000)));
	});
	document.getElementById("fastForward").addEventListener("click", () => {
		scWidget.getPosition((currentPosition) =>
			scWidget.seekTo(Math.min(Number.MAX_SAFE_INTEGER, currentPosition + 8000)));
	});
});