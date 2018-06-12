"use strict";
(() => {
	// IIFE to limit scope. Act like a anonymous namespace
	const cpsDisplay = document.getElementById("cpsValue");
	const maxDisplay = document.getElementById("maxCps");
	const avgDisplay = document.getElementById("avgCps");
	const clickButton = document.getElementById("clickArea");
	const startButton = document.getElementById("startGenerate");
	const switchButton = document.getElementById("switchMode");

	const eventOption = {passive: true, capture: true};
	const perf = window.performance;

	const displayNone = "none";
	const switchTextGenerated = "Switch to generated clicks";
	const switchTextExternal = "Switch to clicks by user";
	const clickEventName = "click";
	const initialValue = "0.00";

	let previous = perf.now();
	let clicks = 0;
	let maxCps = 0;
	let totalClicks = 0;
	let seconds = 0;

	const fmtNum = value => value.toFixed(2);
	
	// Check status roughly once every second
	const updateID = window.setInterval(() => {
		const current = clicks;
		clicks = 0;
		const now = perf.now();

		totalClicks += current;
		// Only update if the user clicked at least once
		if (totalClicks > 0) {
			const elapsedTime = (now - previous) / 1000;
			const currentCps = current / elapsedTime;
			if (maxCps < currentCps) {
				maxCps = currentCps;
				maxDisplay.innerHTML = fmtNum(maxCps);
			}
			seconds += elapsedTime;
			avgDisplay.innerHTML = fmtNum(totalClicks / seconds);
			cpsDisplay.innerHTML = fmtNum(currentCps);
		}

		previous = now;
	}, 1000);

	// Reset all fields and internal counters, stops the test until user clicks again
	const resetAll = () => {
		clicks = 0;
		maxCps = 0;
		totalClicks = 0;
		seconds = 0;

		avgDisplay.innerHTML = initialValue;
		maxDisplay.innerHTML = initialValue;
		cpsDisplay.innerHTML = initialValue;
	};
	
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
			startButton.style.display = null;
			clickButton.style.display = displayNone;
			switchButton.innerHTML = switchTextExternal;
		} else {
			startButton.style.display = displayNone;
			clickButton.style.display = null;
			switchButton.innerHTML = switchTextGenerated;
		}
	}, eventOption);

	// Start generating clicks for 30 seconds
	startButton.addEventListener(clickEventName, event => {
		event.stopImmediatePropagation();

		const start = perf.now();

		// Ideally the clicks can be generated in a another thread and stopped by the main thread
		// But since web worker can't use the DOM, this has to be on the main thread and periodically check the time
		while ((perf.now() - start) < 30000) {
			for (let i = 0; i < 1000; ++i) {
				clickButton.click();
			}
		}
	}, eventOption);
	
	// Click button increment counter once per click
	clickButton.addEventListener(clickEventName, event => {
		event.stopImmediatePropagation();
		++clicks;
	}, eventOption);
})();
