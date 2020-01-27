"use strict";

const buildIframeHtml = imgurId => {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="content-security-policy" content="block-all-mixed-content; object-src 'none'; form-action 'none'; base-uri 'none';">
	<meta name="referrer" content="no-referrer">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<link href="${new URL("../common/style.css", location)}" rel="stylesheet">
	<link href="${new URL("./imgur.css", location)}" rel="stylesheet">
</head>
<body>
	<blockquote class="imgur-embed-pub" lang="en" data-id="${imgurId}" data-context="false">
		<a href="https://imgur.com/${imgurId}">Link</a>
	</blockquote>
	<script async src="https://s.imgur.com/min/embed.js" charset="utf-8"></script>
</body>
</html>`;
	// See https://help.imgur.com/hc/en-us/articles/211273743-Embed-Unit
	// Kind of similar to twitter embeds
};

import { alertError, assertNotEmpty, isEmpty } from "../common/utils.js";

const urlType = document.getElementById("urlType");
const imgurUrl = document.getElementById("imgurUrl");

const parseImgurId = () => {
	const input = new URL(imgurUrl.value.trim());

	if (!input.hostname.endsWith("imgur.com")) {
		throw new Error("Url is not from imgur");
	}

	let pathArray = input.pathname.split("/");
	// last non empty path segment
	pathArray = pathArray.filter(p => !isEmpty(p));
	assertNotEmpty(pathArray, "Url doesn't contain an imgur id");
	const lastSegment = pathArray[pathArray.length - 1];

	// extract id from direct urls, e.g: i.imgur.com/aaaaa.jpg
	const imgurId = (lastSegment.split("."))[0];

	const selectedType = urlType.value;
	if (selectedType === "album") {
		return `a/${imgurId}`;
	} else if (selectedType === "image") {
		return imgurId;
	}
	throw new Error("Unknown url type");
};

const iframe = document.getElementById("contentIframe");

document.getElementById("form").addEventListener("submit", e => {
	e.preventDefault();
	e.stopImmediatePropagation();

	try {
		const imgurId = parseImgurId();
		iframe.srcdoc = buildIframeHtml(imgurId);
		iframe.contentWindow.focus();
	} catch (e) {
		console.log(e);
		alertError(e);
	}
});

// toggle fullscreen display of imgur. the iframe here cannot request fullscreen itself
const fullScreenToggle = document.getElementById("fullScreenToggle");

const rightAlignClass = "right-align";
const floatBottomRightClass = "float-bottom-right";
const fullPageIframeClass = "full-page-iframe";
const normalIframeClass = "accenting-border";
const hideOverflowClass = "hide-overflow";

// See https://developer.mozilla.org/en-US/docs/Web/API/Element/onfullscreenchange
fullScreenToggle.addEventListener("click", e => {
	if (document.fullscreenElement) {
		document.exitFullscreen();
	} else {
		iframe.requestFullscreen({
			navigationUI: "hide"
		}).catch(e => {
			console.log(e);
			alertError(e, "Failed to create fullscreen");
		});
	}
});

iframe.addEventListener("fullscreenchange", e => {
	if (document.fullscreenElement === iframe) {
		// just entered fullscreen
		iframe.className = fullPageIframeClass;
		fullScreenToggle.className = floatBottomRightClass;
		document.documentElement.className = hideOverflowClass;
	} else {
		// exited fullscreen
		iframe.className = normalIframeClass;
		fullScreenToggle.className = rightAlignClass;
		document.documentElement.className = null;
	}
});