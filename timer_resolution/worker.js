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

	// First pass through resultArray. Transforms the timestamps to diffs
	// This test uses a lot of ram. Try to calculate stats in place. Throws if clock is not monotonic
	// Jitter: abs((timestamp_n+2 - timestamp_n+1) - (timestamp_n+1 - timestamp_n))
	// n here means next unique timestamp
	const calcStats1 = (testType, testDuration) => {
		let uniques = 0;
		let minDiff = Number.MAX_VALUE;
		let maxDiff = - Number.MAX_VALUE;
		let totalDiff = 0;
		let minJitter = Number.MAX_VALUE;
		let maxJitter = - Number.MAX_VALUE;
		let totalJitter = 0;
		let lastDiff = 0;

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
					const jitter = Math.abs(diff - lastDiff);
					totalJitter += jitter;

					if (jitter > maxJitter) {
						maxJitter = jitter;
					}
					if (jitter < minJitter) {
						minJitter = jitter;
					}
				}

				lastDiff = diff;
			} else if (diff < 0) {
				// abort, since stats on non monotonic clocks probably aren't so useful
				throw testType + " is a non monotonic clock";
			}

			resultArray[i - 1] = diff;
		}

		// remove last value, the array only contains diffs now
		resultArray[testLength - 1] = 0;

		// if the sum of all diffs is not the same as the test duration and the clock is monotonic, the clock is skipping ahead
		// comparison with epsilon is necessary since totalDiff is a sum of many values, epsilon can accommodate for floating point inaccuracies
		// using testDuration as scale, it's always positive and larger than zero
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
			totalJitter,
		};
	};

	// both indices are inclusive
	const getMiddle = (startIndex, endIndex) => {
		return {
			left: Math.floor((startIndex + endIndex) / 2),
			right: Math.ceil((startIndex + endIndex) / 2),
		};
	}

	const getMedian = (array, startIndex, endIndex) => {
		const middle = getMiddle(startIndex, endIndex);
		return (array[middle.left] + array[middle.right]) / 2;
	}

	// Second pass through resultArray, now containing diffs instead of timestamps
	// Standard deviation: sqrt(sum((value - avg)^2) / count)
	const calcStats2 = average => {
		// sort low to high, no compare function is the fast path
		resultArray.sort();

		const lastIndex = testLength - 1;
		let sum = 0;
		let count = 0;
		let index = lastIndex;

		// Sorted diffs: walk backwards until the last 0 in array which is the end of diffs
		for (; index > -1; --index) {
			const current = resultArray[index];

			if (current === 0) {
				break;
			}

			sum += Math.pow(current - average, 2);
			++count;
		}

		const firstIndex = index + 1;

		const median = getMedian(resultArray, firstIndex, lastIndex);

		// interquartile range = median(higher half of samples) - median(lower half of samples)
		const middle = getMiddle(firstIndex, lastIndex);
		let iqrIndexLeft = 0;
		let iqrIndexRight = 0;

		if (middle.left === middle.right) {
			iqrIndexLeft = middle.left - 1;
			iqrIndexRight = middle.left + 1;
		} else {
			iqrIndexLeft = middle.left;
			iqrIndexRight = middle.right;
		}

		const interquartileRange = getMedian(resultArray, iqrIndexRight, lastIndex) - getMedian(resultArray, firstIndex, iqrIndexLeft);

		return {
			stdDeviation: Math.sqrt(sum / count),
			median,
			interquartileRange,
			firstIndex,
		};
	};

	// Expects the resultArray to contain a sorted list of diffs
	const calcMAD = (median, firstIndex) => {
		const resultView = resultArray.subarray(firstIndex);
		for (let i = 0; i < resultView.length; ++i) {
			resultView[i] = Math.abs(resultView[i] - median);
		}

		resultView.sort();

		return getMedian(resultView, 0, resultView.length - 1);
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
		const result1 = calcStats1(event.data + ".now()", testDuration);
		const result2 = calcStats2(result1.totalDiff / result1.uniques);
		const mad = calcMAD(result2.median, result2.firstIndex);

		// Construct result. The type is needed for the other end to distinguish between test types
		const msgValue = Object.assign({
			type: event.data,
			testDuration,
			testLength,
			mad,
		}, result1, result2);

		postMessage(msgValue);
	};

})();
