"use strict";
(() => {
	const iframeHtml = String.raw`
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<meta http-equiv="content-security-policy" content="block-all-mixed-content; form-action 'none'; base-uri 'none'; object-src 'none';">
	<meta name="referrer" content="no-referrer">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<title>Test executor</title>

	<link href="${new URL("../common/style.css", location)}" rel="stylesheet">
	<script src="${new URL("../common/µ.js", location)}" defer></script>
	<script src="${new URL("testExecutor.js", location)}" defer></script>
</head>

<body>
	<main id="display"></main>
</body>

</html>
	`;

	const iframe = document.getElementById("test-iframe");
	iframe.srcdoc = iframeHtml;
	const testSandbox = iframe.contentWindow;

	const before = document.getElementById("before");
	const test0 = document.getElementById("test0");
	const run = document.getElementById("run");
	const result = document.getElementById("result");

	self.onmessage = msg => {
		if (msg.source === testSandbox) {
			if ("string" === (typeof msg.data)) {
				// String messages indicate errors
				result.textContent = msg.data;
			}
		}
	};

	run.addEventListener("click", () => {
		result.textContent = null;
		testSandbox.postMessage(before.value.trim().normalize(), "*");
	});

})();