"use strict";

const buildIframeHtml = imgurId => `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="content-security-policy"
		content="block-all-mixed-content; object-src 'none'; form-action 'none'; base-uri 'none'; default-src https://imgur.com https://*.imgur.com ${location.origin} 'self';">
	<meta name="referrer" content="no-referrer">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<link href="${new URL("./imgur.css", location)}" rel="stylesheet">
</head>
<body>
	<blockquote class="imgur-embed-pub" lang="en" data-id="${imgurId}" data-context="false">
		<a href="https://imgur.com/${imgurId}">Imgur link</a>
	</blockquote>
	<script async src="https://s.imgur.com/min/embed.js"></script>
</body>
</html>`;
// See https://help.imgur.com/hc/en-us/articles/211273743-Embed-Unit
// Kind of similar to twitter embeds

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

// show the entire page fullscreen. if only the iframe is fullscreen, the return button won't be visible
const fullScreenToggle = document.getElementById("fullScreenToggle");
const embedBox = document.getElementById("embedBox");

const rightAlignClass = "right-align";
const floatBottomRightClass = "float-bottom-right";
const fullPageEmbedBoxClass = "full-page-embed-box";
const normalEmbedBoxClass = "embed-box accenting-border";
const hideOverflowClass = "hide-overflow";

// See https://developer.mozilla.org/en-US/docs/Web/API/Element/onfullscreenchange
fullScreenToggle.addEventListener("click", e => {
	if (document.fullscreenElement) {
		document.exitFullscreen();
	} else {
		document.body.requestFullscreen({
			navigationUI: "hide",
		});
	}
});

document.body.addEventListener("fullscreenchange", e => {
	if (document.body.isSameNode(document.fullscreenElement)) {
		embedBox.className = fullPageEmbedBoxClass;
		fullScreenToggle.className = floatBottomRightClass;
		document.body.classList.add(hideOverflowClass);
		// just entered fullscreen, reload to fix layout
		const iframeSrc = iframe.srcdoc;
		iframe.srcdoc = "";
		iframe.srcdoc = iframeSrc;
	} else if (isEmpty(document.fullscreenElement)) {
		// exited fullscreen
		embedBox.className = normalEmbedBoxClass;
		fullScreenToggle.className = rightAlignClass;
		document.body.classList.remove(hideOverflowClass);

		const iframeSrc = iframe.srcdoc;
		iframe.srcdoc = "";
		iframe.srcdoc = iframeSrc;
	}
});