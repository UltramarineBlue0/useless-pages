"use strict";
(() => {
	const clipsHost = "clips.twitch.tv";
	const twitchHost = "twitch.tv";

	const twitchPlayer = "http://player." + twitchHost + "/?";
	const playerParams = "&autoplay=false";
	const clipsPlayer = "https://" + clipsHost + "/embed?";

	const ttvIframe = document.getElementById("ttv-iframe");

	const formElement = document.getElementById("form");
	const queryType = document.getElementById("type");
	const queryInput = document.getElementById("query");

	const showError = input => {
		alert("Invalid / unsupported input:\n" + input);
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

	const getClipSlug = input => {
		// get clip id: https://clips.twitch.tv/{AdjectiveAdjectiveNounEmote}
		const url = new URL(input);
		const hostname = url.hostname;
		const pathArray = url.pathname.split("/");
		if (hostname.endsWith(clipsHost)) {
			return checkNotEmpty(pathArray[1]);
		}
		throw "Unsupported URL";
	};

	const getVideoID = input => {
		// get video id: https://www.twitch.tv/videos/{a large number}?t=1h20m5s
		const url = new URL(input);
		const hostname = url.hostname;
		const pathArray = url.pathname.split("/");
		if (hostname.endsWith(twitchHost) && pathArray[1] === "videos") {
			const id = "v" + checkNotEmpty(pathArray[2]);
			let timestamp = url.searchParams.get("t");
			if (isEmpty(timestamp)) {
				timestamp = "0s";
			}
			return [id, timestamp];
		}
		throw "Unsupported URL";
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
		} catch (error) {
			showError(query);
		}

		queryInput.blur();
		ttvIframe.focus();
	});
})();