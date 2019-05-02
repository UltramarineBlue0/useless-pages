"use strict";

const iframeSrcDocPrefix = `<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<meta http-equiv="content-security-policy" content="object-src 'none'; form-action 'none'; base-uri 'none';">
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

const updateSandboxAttr = () => {
	iframe.sandbox.toggle(allowScriptsStr, allowScripts.checked);
	iframe.sandbox.toggle(allowSameOriginStr, allowSameOrigin.checked);
};

const htmlText = document.getElementById("htmlText");

const updateIframeSrcDoc = () => iframe.srcdoc = `${iframeSrcDocPrefix}

${htmlText.value.trim()}

${iframeSrcDocSuffix}`;

document.getElementById("htmlForm").addEventListener("submit", event => {
	event.preventDefault();
	event.stopImmediatePropagation();

	updateSandboxAttr();
	updateIframeSrcDoc();
});