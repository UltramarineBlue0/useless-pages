"use strict";
(() => {
	const dateTimestamp = () => Date.now();
	const perfTimestamp = () => performance.now();
	const dateResult = {};
	const perfResult = {};

	const testLength = 24 * 1024 * 1024;
	const resultArray = new Float64Array(testLength);
	const clickEvent = "click";
	const eventOption = { passive: true, capture: true };

	const test = (supplier, resultDisplay) => {
		for (let i = 0; i < testLength; ++i) {
			resultArray[i] = supplier();
		}
	};

	const startButton = document.getElementById("startTest");
	startButton.addEventListener(clickEvent, event => {
		event.stopImmediatePropagation();
		startButton.disabled = true;
		startButton.textContent = "Testing …";
		if (Math.random() < 0.5) {
			test(dateTimestamp, dateResult);
			test(perfTimestamp, perfResult);
		} else {
			test(perfTimestamp, perfResult);
			test(dateTimestamp, dateResult);
		}
		startButton.disabled = false;
		startButton.textContent = "Retest";
	}, eventOption);
})();
