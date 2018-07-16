"use strict";
(() => {
	const startButton = document.getElementById("startTest");

	const smallXorAligned = document.getElementById("smallXorAligned");
	const smallMathAligned = document.getElementById("smallMathAligned");
	const smallLodashAligned = document.getElementById("smallLodashAligned");

	const smallXor = document.getElementById("smallXor");
	const smallMath = document.getElementById("smallMath");
	const smallLodash = document.getElementById("smallLodash");

	const largeXorAligned = document.getElementById("largeXorAligned");
	const largeMathAligned = document.getElementById("largeMathAligned");
	const largeLodashAligned = document.getElementById("largeLodashAligned");

	const largeXor = document.getElementById("largeXor");
	const largeMath = document.getElementById("largeMath");
	const largeLodash = document.getElementById("largeLodash");

	const getRandomInt = (minInclusive, maxExclusive) => {
		const min = Math.ceil(minInclusive);
		const max = Math.ceil(maxExclusive);
		const diff = max - min;
		if (Number.isSafeInteger(min) && Number.isSafeInteger(max) && Number.isSafeInteger(diff) && (diff > 0)) {
			return Math.floor(Math.random() * diff) + min;
		} else {
			throw new RangeError("Invalid range");
		}
	};

	const testSize = 100000;

	const testRandom = randIntSupplier => {
		let num = 0;
		const startTime = performance.now();
		for (let i = 0; i < testSize; ++i) {
			num ^= randIntSupplier();
		}
		const testDuration = performance.now() - startTime;
		µ.absorbInt(num);
		return testDuration;
	};

	const testXor = (minInclusive, maxExclusive) => µ.getRandomInt(minInclusive, maxExclusive);

	const testMath = (minInclusive, maxExclusive) => getRandomInt(minInclusive, maxExclusive);

	const testLodash = (minInclusive, maxExclusive) => _.random(minInclusive, maxExclusive - 1); // In lodash both bounds are inclusive

	const dispatchTask = () => {

	};

	startButton.addEventListener("click", event => {
		event.stopImmediatePropagation();
		startButton.disabled = true;
		startButton.textContent = "Testing …";


	});

})();