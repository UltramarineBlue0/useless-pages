"use strict";

import { alertError, isEmpty } from "../common/utils.js";

const parseUrl = userInput => {
	if (isEmpty(userInput)) {
		return "about:blank";
	} else if (!userInput.includes("://")) {
		// No scheme in the user input. Default to https
		return `https://${userInput}`;
	}
	return userInput;
};

const iframe = document.getElementById("contentIframe");

const allowFormsStr = "allow-forms";
const allowForms = document.getElementById(allowFormsStr);
const allowSameOriginStr = "allow-same-origin";
const allowSameOrigin = document.getElementById(allowSameOriginStr);
const allowScriptsStr = "allow-scripts";
const allowScripts = document.getElementById(allowScriptsStr);
const enableFullscreen = document.getElementById("enable-fullscreen");

const srcUrlStr = "srcUrl";
const srcUrl = document.getElementById(srcUrlStr);

const updateIframe = () => {
	iframe.sandbox.toggle(allowFormsStr, allowForms.checked);
	iframe.sandbox.toggle(allowSameOriginStr, allowSameOrigin.checked);
	iframe.sandbox.toggle(allowScriptsStr, allowScripts.checked);
	iframe.allowFullscreen = enableFullscreen.checked;

	iframe.contentWindow.focus();
	iframe.src = parseUrl(srcUrl.value.trim());
};

const formElement = document.getElementById("htmlForm");
formElement.addEventListener("submit", event => {
	event.preventDefault();
	event.stopImmediatePropagation();

	updateIframe();
});

// Empty iframe content upon form reset
formElement.addEventListener("reset", () => {
	srcUrl.focus();
	iframe.src = "about:blank";
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

// show body element fullscreen. if only the iframe is fullscreen, the nav elements won't be shown
const fullscreenToggle = document.getElementById("fullscreenToggle");
fullscreenToggle.addEventListener("click", () => {
	if (document.fullscreenElement) {
		document.exitFullscreen();
		fullscreenToggle.textContent = "Fullscreen";
	} else {
		fullscreenToggle.textContent = "Exit fullscreen";

		document.body.requestFullscreen({
			navigationUI: "hide",
		}).catch(e => {
			fullscreenToggle.textContent = "Fullscreen";
			console.log(e);
			alertError(e, "Failed to create fullscreen");
		});
	}
});

const navbar = document.getElementById("navbar");
document.getElementById("showNavbar").addEventListener("click", () => {
	navbar.hidden = false;
});
document.getElementById("hideNavbar").addEventListener("click", () => {
	navbar.hidden = true;
});

// Unfortunately, due to cross-origin policy, this script can't access the location of the iframe
// This means that the current url is unknown and the iframe can't be reloaded properly: the src
// attribute isn't always the current location