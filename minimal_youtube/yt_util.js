"use strict";

import { isEmpty, assertNotEmpty } from "../common/utils.js";

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

export const getVideoID = input => {
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

export const getPlaylistID = input => {
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

export const convertSecToString = seconds => {
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
		returnStr += Math.floor(remainingSecs) + "s";
	}

	return returnStr;
};