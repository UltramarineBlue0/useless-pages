"use strict";
(() => {
	const iframeHtml = String.raw`
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<meta http-equiv="content-security-policy" content="block-all-mixed-content; form-action 'none'; base-uri 'none'; object-src 'none'; default-src https://cdnjs.cloudflare.com https://cdn.jsdelivr.net data: blob: 'self' 'unsafe-inline' 'unsafe-eval';">
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
	const run = document.getElementById("run");
	const result = document.getElementById("result");
	const before = document.getElementById("before");
	const test0 = document.getElementById("test0");

	const runText = "Run";
	const cancelText = "Cancel";

	let controllerPort;

	const finish = () => {
		if (controllerPort !== undefined) {
			controllerPort.close();
			controllerPort = undefined;
		}
		run.textContent = runText;
	};

	const listener = msg => {
		if (msg.data === "ready") {
			controllerPort.postMessage({
				before: before.value.trim(),
				tests: [
					{
						name: "test0",
						func: test0.value.trim(),
					},
				],
			});
		} else if (msg.data === "done") {
			finish();
		} else {
			result.textContent += msg.data + "\n";
		}
	};

	const reset = () => {
		finish();
		iframe.onload = () => { };
		iframe.srcdoc = "";
		result.textContent = "";
	};

	run.addEventListener("click", () => {
		if (controllerPort !== undefined) {
			// Cancel
			reset();
		} else {
			// Start new test run
			iframe.srcdoc = iframeHtml;
			result.textContent = "";
			run.textContent = cancelText;

			iframe.onload = () => {
				const msgChannel = new MessageChannel();
				controllerPort = msgChannel.port1;

				controllerPort.onmessage = listener;

				iframe.contentWindow.postMessage(null, "*", [msgChannel.port2]);
			};
		}
	});

})();