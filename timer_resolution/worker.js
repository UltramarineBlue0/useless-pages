"use strict";
(() => {
	const dateTimestamp = () => Date.now();
	const perfTimestamp = () => performance.now();

	// uses 192 MiB of ram
	const testLength = 24 * 1024 * 1024;
	const resultArray = new Float64Array(testLength);


	//returns test run duration according to supplier
	const fillValues = supplier => {
		for (let i = 0; i < testLength; ++i) {
			resultArray[i] = supplier();
		}

		return resultArray[testLength - 1] - resultArray[0];
	};

	// This test uses a lot of ram. Try to calculate stats in place. Throws if clock is not monotone
	// Jitter: abs((timestamp_n+2 - timestamp_n+1) - (timestamp_n+1 - timestamp_n))
	// n here means next unique timestamp
	const calcStats = (testType, testDuration) => {
		let uniques = 0,
			minDiff = Number.MAX_VALUE,
			maxDiff = - Number.MAX_VALUE,
			totalDiff = 0,
			minJitter = Number.MAX_VALUE,
			maxJitter = - Number.MAX_VALUE,
			lastDiff = 0;

		for (let i = 1; i < testLength; ++i) {
			const diff = resultArray[i] - resultArray[i - 1];

			// Next unique timestamp found
			if (diff > 0) {
				++uniques;
				totalDiff += diff;

				if (diff > maxDiff) {
					maxDiff = diff;
				}
				if (diff < minDiff) {
					minDiff = diff;
				}

				// calculate jitter after the first two unique timestamps has been found
				if (lastDiff > 0) {
					const jitter = diff - lastDiff;

					if (jitter > maxJitter) {
						maxJitter = jitter;
					}
					if (jitter < minJitter) {
						minJitter = jitter;
					}
				}

				lastDiff = diff;
			} else if (diff < 0) {
				// abort, since stats on non monotone clocks probably aren't so useful
				throw testType + " is a non monotone clock";
			}

			resultArray[i - 1] = diff;
		}

		// remove last value, the array only contains diffs now
		resultArray[testLength - 1] = 0;

		// if the sum of all diffs is not the same as the test duration and the clock is monotone, the clock is skipping ahead
		// floating point comparison with epsilon is needed since totalDiff is a sum of many values, while testDuration is the difference of two values
		// testDuration is always positive and larger than zero
		if (Math.abs(testDuration - totalDiff) > (Number.EPSILON * testDuration)) {
			throw testType + " skips ahead";
		}

		return {
			uniques,
			minDiff,
			maxDiff,
			totalDiff,
			minJitter,
			maxJitter,
		};
	};

	// Standard deviation: sqrt(sum((value - avg)^2) / count)
	const calcStdDeviation = average => {
		let sum = 0;
		let count = 0;

		for (const diff of resultArray) {
			if (diff > 0) {
				++count;
				sum += Math.pow(diff - average, 2);
			}
		}

		return Math.sqrt(sum / count);
	};

	onmessage = event => {
		// Incoming message starts a test run. Determine what to test
		let currentTest;
		if (event.data === "perf") {
			currentTest = perfTimestamp;
		} else if (event.data === "date") {
			currentTest = dateTimestamp;
		} else {
			throw "Unknown event";
		}

		const testDuration = fillValues(currentTest);
		const result = calcStats(event.data + ".now()", testDuration);
		const stdDeviation = calcStdDeviation(result.totalDiff / result.uniques);

		// Construct result. The type is needed for the other end to distinguish between test types
		const msgValue = Object.assign({
			type: event.data,
			testDuration,
			stdDeviation,
			testLength,
		}, result);

		postMessage(msgValue);
	};

})();
