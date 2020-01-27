"use strict";

const parseUrl = userInput => {
	if (userInput.length === 0) {
		return "about:blank";
	} else if (!userInput.includes("://")) {
		// No scheme in the user input. Default to https
		return `https://${userInput}`;
	}
	return userInput;
};

const iframe = document.getElementById("contentIframe");

const allowScriptsStr = "allow-scripts";
const allowSameOriginStr = "allow-same-origin";
const allowScripts = document.getElementById(allowScriptsStr);
const allowSameOrigin = document.getElementById(allowSameOriginStr);

const srcUrlStr = "srcUrl";
const srcUrl = document.getElementById(srcUrlStr);

const updateIframe = () => {
	iframe.sandbox.toggle(allowScriptsStr, allowScripts.checked);
	iframe.sandbox.toggle(allowSameOriginStr, allowSameOrigin.checked);

	iframe.src = parseUrl(srcUrl.value.trim());
	iframe.contentWindow.focus();
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

const rightAlignClass = "right-align";
const floatBottomRightClass = "float-bottom-right";
const fullPageIframeClass = "full-page-iframe";
const normalIframeClass = "accenting-border";
const hideOverflowClass = "hide-overflow";

fullPageToggle.addEventListener("click", e => {
	iframe.classList.toggle(fullPageIframeClass);
	iframe.classList.toggle(normalIframeClass);
	fullPageToggle.classList.toggle(rightAlignClass);
	fullPageToggle.classList.toggle(floatBottomRightClass);
	// prevent the background from scrolling. the iframe needs to be treated as a modal popup
	document.body.classList.toggle(hideOverflowClass);
});