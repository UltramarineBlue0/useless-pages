"use strict";

const iframeSrcDocPrefix = `<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<meta http-equiv="content-security-policy" content="object-src 'none'; form-action 'none';">
	<meta name="referrer" content="no-referrer">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link href="${new URL("../common/style.css", location)}" rel="stylesheet">
</head>

<body>`;

const iframeSrcDocSuffix = `</body> </html>`;

const iframe = document.getElementById("contentIframe");

const allowScriptsStr = "allow-scripts";
const allowSameOriginStr = "allow-same-origin";
const allowScripts = document.getElementById(allowScriptsStr);
const allowSameOrigin = document.getElementById(allowSameOriginStr);

const resetIframe = () => {
	iframe.sandbox.toggle(allowScriptsStr, allowScripts.checked);
	iframe.sandbox.toggle(allowSameOriginStr, allowSameOrigin.checked);
	iframe.removeAttribute("src");
	iframe.removeAttribute("srcdoc");
};

const htmlTextStr = "htmlText";
const htmlText = document.getElementById(htmlTextStr);
const srcUrlStr = "srcUrl";
const srcUrl = document.getElementById(srcUrlStr);
const toggleButton = document.getElementById("toggle");

toggleButton.addEventListener("click", () => {
	// value is the currently active element
	if (toggleButton.value === htmlTextStr) {
		htmlText.hidden = true;
		srcUrl.hidden = false;
		toggleButton.value = srcUrlStr;
		toggleButton.textContent = "Switch to " + htmlTextStr;
	} else if (toggleButton.value === srcUrlStr) {
		htmlText.hidden = false;
		srcUrl.hidden = true;
		toggleButton.value = htmlTextStr;
		toggleButton.textContent = "Switch to " + srcUrlStr;
	} else {
		console.error("Unknown state: ", toggleButton);
	}
});

const updateIframe = () => {
	// value is the currently active element
	if (toggleButton.value === htmlTextStr) {
		iframe.srcdoc = `${iframeSrcDocPrefix}

${htmlText.value.trim()}

${iframeSrcDocSuffix}`;
	} else if (toggleButton.value === srcUrlStr) {
		iframe.src = new URL(srcUrl.value.trim(), location);
	} else {
		console.error("Unknown state: ", toggleButton);
	}
};

document.getElementById("htmlForm").addEventListener("submit", event => {
	event.preventDefault();
	event.stopImmediatePropagation();

	resetIframe();
	updateIframe();
});