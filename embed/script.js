"use strict";

const iframe = document.getElementById("contentIframe");

const allowScriptsStr = "allow-scripts";
const allowSameOriginStr = "allow-same-origin";
const allowScripts = document.getElementById(allowScriptsStr);
const allowSameOrigin = document.getElementById(allowSameOriginStr);

const srcUrlStr = "srcUrl";
const srcUrl = document.getElementById(srcUrlStr);

const parseUrl = userInput => {
	if (userInput.length === 0) {
		return "about:blank";
	} else if (!userInput.includes("://")) {
		// No scheme in the user input. Default to https
		return `https://${userInput}`;
	}
	return userInput;
};

const updateIframe = () => {
	iframe.sandbox.toggle(allowScriptsStr, allowScripts.checked);
	iframe.sandbox.toggle(allowSameOriginStr, allowSameOrigin.checked);

	iframe.src = parseUrl(srcUrl.value.trim());
};

document.getElementById("htmlForm").addEventListener("submit", event => {
	event.preventDefault();
	event.stopImmediatePropagation();

	updateIframe();
});

// Load the url from the hash, if present
const loadUrlFromHash = () => {
	const fragmentId = document.location.hash;
	if (fragmentId.length > 1) {
		srcUrl.value = fragmentId.trim().substring(1);

		updateIframe();
	}
};

window.addEventListener("hashchange", loadUrlFromHash);
loadUrlFromHash();

// show embedded iframe on top the page, using the full viewport
const fullPageToggle = document.getElementById("fullPageToggle");
const iframeBox =  document.getElementById("iframeBox");

const rightAlignClass = "right-align";
const floatBottomRightClass = "float-bottom-right";
const fullPageEmbedBoxClass = "full-page-embed-box";
const normalEmbedBoxClass = "embed-box";

fullPageToggle.addEventListener("click", e => {
	iframeBox.classList.toggle(fullPageEmbedBoxClass);
	iframeBox.classList.toggle(normalEmbedBoxClass);
	fullPageToggle.classList.toggle(rightAlignClass);
	fullPageToggle.classList.toggle(floatBottomRightClass);
});