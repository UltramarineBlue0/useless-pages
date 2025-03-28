"use strict";
(() => {
	const testWorker = new Worker("worker.js");

	const startButton = document.getElementById("startTest");

	const perfTotal = document.getElementById("perfTotal");
	const perfUnique = document.getElementById("perfUnique");
	const perfPerc = document.getElementById("perfPerc");
	const perfMedian = document.getElementById("perfMedian");
	const perfAvg = document.getElementById("perfAvg");
	const perfMax = document.getElementById("perfMax");
	const perfMin = document.getElementById("perfMin");
	const perfAvgJitter = document.getElementById("perfAvgJitter");
	const perfMaxJitter = document.getElementById("perfMaxJitter");
	const perfMinJitter = document.getElementById("perfMinJitter");
	const perfStdDev = document.getElementById("perfStdDev");
	const perfMAD = document.getElementById("perfMAD");
	const perfIQR = document.getElementById("perfIQR");

	const dateTotal = document.getElementById("dateTotal");
	const dateUnique = document.getElementById("dateUnique");
	const datePerc = document.getElementById("datePerc");
	const dateMedian = document.getElementById("dateMedian");
	const dateAvg = document.getElementById("dateAvg");
	const dateMax = document.getElementById("dateMax");
	const dateMin = document.getElementById("dateMin");
	const dateAvgJitter = document.getElementById("dateAvgJitter");
	const dateMaxJitter = document.getElementById("dateMaxJitter");
	const dateMinJitter = document.getElementById("dateMinJitter");
	const dateStdDev = document.getElementById("dateStdDev");
	const dateMAD = document.getElementById("dateMAD");
	const dateIQR = document.getElementById("dateIQR");

	// Message body
	const perfTest = "perf";
	const dateTest = "date";
	// Test state
	let perfDone = false;
	let dateDone = false;

	startButton.addEventListener("click", event => {
		event.stopImmediatePropagation();
		startButton.disabled = true;
		startButton.textContent = "Testing …";

		perfDone = false;
		dateDone = false;

		// Randomly select the first test
		if (Math.random() < 0.5) {
			testWorker.postMessage(dateTest);
		} else {
			testWorker.postMessage(perfTest);
		}
	});

	const fmtNum = value => value.toFixed(6);

	testWorker.onmessage = event => {
		const result = event.data;

		// Display test result
		if (result.type === perfTest) {
			perfDone = true;

			perfTotal.textContent = result.testDuration.toFixed(2);
			perfUnique.textContent = result.uniques.toFixed(0);
			perfPerc.textContent = fmtNum((result.uniques / result.testLength) * 100);
			perfMedian.textContent = fmtNum(result.median);
			perfAvg.textContent = fmtNum(result.totalDiff / result.uniques);
			perfMax.textContent = fmtNum(result.maxDiff);
			perfMin.textContent = fmtNum(result.minDiff);
			perfAvgJitter.textContent = fmtNum(result.totalJitter / (result.uniques - 1));
			perfMaxJitter.textContent = fmtNum(result.maxJitter);
			perfMinJitter.textContent = fmtNum(result.minJitter);
			perfStdDev.textContent = fmtNum(result.stdDeviation);
			perfMAD.textContent = fmtNum(result.mad);
			perfIQR.textContent = fmtNum(result.interquartileRange);
		} else if (result.type === dateTest) {
			dateDone = true;

			dateTotal.textContent = result.testDuration.toFixed(2);
			dateUnique.textContent = result.uniques.toFixed(0);
			datePerc.textContent = fmtNum((result.uniques / result.testLength) * 100);
			dateMedian.textContent = fmtNum(result.median);
			dateAvg.textContent = fmtNum(result.totalDiff / result.uniques);
			dateMax.textContent = fmtNum(result.maxDiff);
			dateMin.textContent = fmtNum(result.minDiff);
			dateAvgJitter.textContent = fmtNum(result.totalJitter / (result.uniques - 1));
			dateMaxJitter.textContent = fmtNum(result.maxJitter);
			dateMinJitter.textContent = fmtNum(result.minJitter);
			dateStdDev.textContent = fmtNum(result.stdDeviation);
			dateMAD.textContent = fmtNum(result.mad);
			dateIQR.textContent = fmtNum(result.interquartileRange);
		} else {
			alert("Impossible error");
			throw "Impossible";
		}

		// Reset button on test finish, else continue testing
		if (perfDone && dateDone) {
			startButton.disabled = false;
			startButton.textContent = "Retest";
		} else if (perfDone) {
			testWorker.postMessage(dateTest);
		} else if (dateDone) {
			testWorker.postMessage(perfTest);
		} else {
			alert("Impossible error");
			throw "Impossible";
		}
	};

	// Crude error handling
	testWorker.onerror = event => {
		alert(event.message + "\n\nIn " + event.filename + "; Line: "+ event.lineno);
	};
})();
