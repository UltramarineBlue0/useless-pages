"use strict";
// IIFE closure to limit scope. Act like a anonymous namespace
(() => {
	const eventOption = Object.freeze({ passive: true, capture: true });

	// Minimal delay setTimeout. Modified from
	// https://dbaron.org/log/20100309-faster-timeouts
	// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Timeouts_throttled_to_%3E4ms
	const queuedFuncs = [];
	const randomID = window.crypto.getRandomValues(new Int32Array(1))[0];

	window.addEventListener("message", event => {
		event.stopImmediatePropagation();
		if (event.source === window && event.data === randomID) {
			const func = queuedFuncs.pop();
			if (func !== undefined) {
				func();
			}
		}
	}, eventOption);

	const queueTask = func => {
		queuedFuncs.push(func);
		window.postMessage(randomID, window.location.origin);
	};

	const cpsDisplay = document.getElementById("cpsValue");
	const maxDisplay = document.getElementById("maxCps");
	const avgDisplay = document.getElementById("avgCps");
	const clickButton = document.getElementById("clickArea");
	const startButton = document.getElementById("startGenerate");
	const switchButton = document.getElementById("switchMode");

	const ticker = () => window.performance.now();

	const displayNone = "none";
	const clickEventName = "click";

	let previous = ticker();
	let clicks = 0;
	let maxCps = 0;
	let totalClicks = 0;
	let seconds = 0;

	let cancelID = null;

	const fmtNum = value => value.toFixed(2);

	// Check status roughly once every second
	// In order to minimize the click event as much as possible, the status is polled here, instead of
	// activated at the start of the first click event. This way the click event itself can be a simple increment
	// Since the polling frequency is roughly once every 1.5 seconds, this shouldn't have a noticeable performance impact
	window.setInterval(() => {
		const current = clicks;
		clicks = 0;
		const now = ticker();

		totalClicks += current;
		// Only update if the user clicked at least once
		if (totalClicks > 0) {
			// Because of JS's event loop, the browser cannot guarantee that it'll execute after exactly 1.5 seconds
			// Another benefit: the polling frequency can be changed independently from the stats calculation
			const elapsedTime = (now - previous) / 1000;
			const currentCps = current / elapsedTime;
			if (maxCps < currentCps) {
				maxCps = currentCps;
				maxDisplay.textContent = fmtNum(maxCps);
			}
			seconds += elapsedTime;
			avgDisplay.textContent = fmtNum(totalClicks / seconds);
			cpsDisplay.textContent = fmtNum(currentCps);
		}

		previous = now;
	}, 1500);

	// Click events
	const increment = event => {
		event.stopImmediatePropagation();
		++clicks;
	};

	// Afaik, despite the event loop, a call to click will be immediately trigger a click event.
	// If click is called in a loop, it'll block everything else, since you're effectively executing a long running function
	// setTimeout's delay is clamped to 4ms after a few recursive calls
	// Promises enqueue microtasks. Afaik, they'll block the UI since they have higher priority than regular tasks and are executed before them
	// postMessage seems to be the only reliable minimal delay solution
	const triggerClick = () => {
		clickButton.click();
	};

	const incrementThenClick = event => {
		event.stopImmediatePropagation();
		if (cancelID !== null) {
			++clicks;
			queueTask(triggerClick);
		}
	};

	const testFinish = () => {
		window.clearTimeout(cancelID);
		cancelID = null;

		// Stop updating stats
		clicks = 0;
		totalClicks = 0;

		startButton.disabled = false;
		startButton.textContent = "Generate click events";
	};

	// Default action: Click button increment counter once per click
	clickButton.addEventListener(clickEventName, increment, eventOption);

	// Reset all fields and internal counters, stops the test until user clicks again
	const resetAll = () => {
		if (cancelID !== null) {
			testFinish();
		}

		previous = ticker();
		clicks = 0;
		maxCps = 0;
		totalClicks = 0;
		seconds = 0;

		const initialValue = "0.00";
		avgDisplay.textContent = initialValue;
		maxDisplay.textContent = initialValue;
		cpsDisplay.textContent = initialValue;
	};

	// Start generating clicks for 30 seconds
	startButton.addEventListener(clickEventName, event => {
		event.stopImmediatePropagation();

		startButton.disabled = true;
		startButton.textContent = "Testing …";

		resetAll();
		cancelID = window.setTimeout(testFinish, 30000);

		queueTask(triggerClick); // Start test
	}, eventOption);

	// Stop and reset
	document.getElementById("resetStats").addEventListener(clickEventName, event => {
		event.stopImmediatePropagation();
		resetAll();
	}, eventOption);

	// Reset and switch between user clicks and generated clicks
	switchButton.addEventListener(clickEventName, event => {
		event.stopImmediatePropagation();
		resetAll();

		if (startButton.style.display === displayNone) {
			// Switch to generated clicks
			startButton.style.display = null;
			clickButton.style.display = displayNone;
			switchButton.textContent = "Switch to clicks by user";
			// Test mode: click event on the button starts a chain of clicks
			clickButton.removeEventListener(clickEventName, increment, eventOption);
			clickButton.addEventListener(clickEventName, incrementThenClick, eventOption);
		} else {
			// Switch to user clicks
			startButton.style.display = displayNone;
			clickButton.style.display = null;
			switchButton.textContent = "Switch to generated clicks";
			// User mode: one increment per click
			clickButton.removeEventListener(clickEventName, incrementThenClick, eventOption);
			clickButton.addEventListener(clickEventName, increment, eventOption);
		}
	}, eventOption);
})();
