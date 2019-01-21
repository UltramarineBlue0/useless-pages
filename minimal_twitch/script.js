"use strict";

const clipsHost = "clips.twitch.tv";
const twitchHost = "twitch.tv";

const twitchPlayer = `https://player.${twitchHost}/?`;
const playerParams = "&autoplay=false";
const clipsPlayer = `https://${clipsHost}/embed?`;

const ttvIframe = document.getElementById("ttv-iframe");

const formElement = document.getElementById("form");
const queryType = document.getElementById("type");
const queryInput = document.getElementById("query");

// read hash as channel name
const fragmentId = document.location.hash;
if (fragmentId.length > 1) {
	ttvIframe.src = `${twitchPlayer}channel=${encodeURIComponent(fragmentId.substring(1))}${playerParams}`;
	queryInput.blur();
}

import { isEmpty } from "../common/utils.js";
import { alertError, assertNotEmpty } from "../common/assertions.js";

const getClipSlug = input => {
	// get clip id: https://clips.twitch.tv/{AdjectiveAdjectiveNounEmote}
	const url = new URL(input);
	const hostname = url.hostname;
	const pathArray = url.pathname.split("/");
	if (hostname.endsWith(clipsHost)) {
		return assertNotEmpty(pathArray[1]);
	}
	throw new Error(`Unknown format: ${input}`);
};

const onlyDigits = /^\d+$/;

const getVideoID = input => {
	// get video id: https://www.twitch.tv/videos/{a large number}?t=1h20m5s
	const url = new URL(input);
	const hostname = url.hostname;
	const pathArray = url.pathname.split("/");
	const lastPath = pathArray[pathArray.length - 1];
	if (hostname.endsWith(twitchHost) && onlyDigits.test(lastPath)) {
		const id = "v" + lastPath;
		let timestamp = url.searchParams.get("t");
		if (isEmpty(timestamp)) {
			timestamp = "0s";
		}
		return [id, timestamp];
	}
	throw new Error(`Unknown format: ${input}`);
};

formElement.addEventListener("submit", event => {
	event.preventDefault();
	event.stopImmediatePropagation();
	const query = queryInput.value.trim().normalize();
	const type = queryType.value;

	try {
		if (type === "clip") {
			// show twitch clip
			const clipID = getClipSlug(query);
			ttvIframe.src = clipsPlayer + "clip=" + clipID + playerParams;
		} else if (type === "video") {
			// show twitch vod
			const [id, timestamp] = getVideoID(query);
			ttvIframe.src = twitchPlayer + "video=" + id + "&time=" + timestamp + playerParams;
		} else if (type === "channel") {
			// show the channel of a user
			ttvIframe.src = twitchPlayer + "channel=" + encodeURIComponent(query) + playerParams;
		}

		queryInput.blur();
	} catch (error) {
		console.log(`Form error: ${error}`);
		alertError(error, `Error parsing "${query}"`);
	}
});
