"use strict";

import { isEmpty } from "../common/utils.js";

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

const loadingIndicator = "blue-border";

const updateIframe = () => {
	iframe.sandbox.toggle(allowFormsStr, allowForms.checked);
	iframe.sandbox.toggle(allowSameOriginStr, allowSameOrigin.checked);
	iframe.sandbox.toggle(allowScriptsStr, allowScripts.checked);
	iframe.allowFullscreen = enableFullscreen.checked;

	iframe.contentWindow.focus();
	iframe.src = parseUrl(srcUrl.value.trim());

	iframe.classList.add(loadingIndicator);
};

const navbarForm = document.getElementById("navbarForm");
navbarForm.addEventListener("submit", event => {
	event.preventDefault();
	event.stopImmediatePropagation();

	updateIframe();
});

// Empty iframe content upon form reset. Event fired before form is reset
navbarForm.addEventListener("reset", () => {
	srcUrl.focus();
	iframe.src = "about:blank";
});

// Load the url from the hash, if present
const loadUrlFromHash = () => {
	const fragmentId = location.hash;
	if (!isEmpty(fragmentId)) {
		srcUrl.value = fragmentId.trim().substring(1);

		updateIframe();
	}
};

window.addEventListener("hashchange", loadUrlFromHash);
loadUrlFromHash();

// show body element fullscreen. if only the iframe is fullscreen, the nav elements won't be shown
const fullscreenToggle = document.getElementById("fullscreenToggle");
fullscreenToggle.addEventListener("click", () => {
	if (document.body.isSameNode(document.fullscreenElement)) {
		document.exitFullscreen();
	} else if (isEmpty(document.fullscreenElement)) {
		document.body.requestFullscreen({
			navigationUI: "hide",
		});
	}
});

// Fired after body is fullscreen: https://developer.mozilla.org/en-US/docs/Web/API/Element/onfullscreenchange#Example
document.body.addEventListener("fullscreenchange", e => {
	if (e.target.isSameNode(document.fullscreenElement)) {
		fullscreenToggle.textContent = "Exit fullscreen";
	} else if (isEmpty(document.fullscreenElement)) {
		fullscreenToggle.textContent = "Fullscreen";
	}
});

document.getElementById("showNavbar").addEventListener("click", () => navbarForm.hidden = false);
document.getElementById("hideNavbar").addEventListener("click", () => navbarForm.hidden = true);

document.getElementById("historyBack").addEventListener("click", () => history.back());
document.getElementById("historyForward").addEventListener("click", () => history.forward());

// Unfortunately, due to cross-origin policy, this script can't access the location of the iframe
// This means that the current url is unknown and the iframe can't be reloaded properly: the src
// attribute isn't always the current location

// Also it seems that the "load" is the only event that fires when the iframe changes to another page.
// "error", "abort" or even "unload" is never fired. The load event also doesn't distinguish between
// successful or failed loads (e.g. due to CSP). This means, the loading indicator is only useful for
// the initial src url attribute change
iframe.addEventListener("load", () => iframe.classList.remove(loadingIndicator));