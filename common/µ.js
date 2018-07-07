"use strict";
(global => {
	const globalContext = global;

	// xoshiro128** algorithm by David Blackman and Sebastiano Vigna
	// http://xoshiro.di.unimi.it/xoshiro128starstar.c
	// Int32 because js' bitwise operators convert numbers into 32-bit signed integers
	const rndState = new Int32Array(4);
	// Seeding during initial load
	globalContext.crypto.getRandomValues(rndState);

	const rotl = (x, k) => (x << k) | (x >>> (32 - k));

	const rand = () => {
		const result = rotl(rndState[0] * 5, 7) * 9;
		const t = rndState[1] << 9;

		rndState[2] ^= rndState[0];
		rndState[3] ^= rndState[1];
		rndState[1] ^= rndState[2];
		rndState[0] ^= rndState[3];

		rndState[2] ^= t;

		rndState[3] = rotl(rndState[3], 11);

		return result | 0;
	};

	const ticker = () => performance.now();

	const nop = x => x;

	const checkIsFunc = func => {
		if ((typeof func) !== "function") {
			throw "Not a function";
		}
		return func;
	}

	// This is a very rudimentary testing framework mostly used for benchmarking. It intentionally doesn't
	// have any kind of advanced features like assertions or async.
	// Can only accept one before and one after function
	class TestTemplate {
		constructor(testName = "Test") {
			this._name = testName
			this._before = nop;
			this._after = nop;
		}

		before(beforeTest = nop) {
			this._before = checkIsFunc(beforeTest);
			return this;
		}

		after(afterTest = nop) {
			this._after = checkIsFunc(afterTest);
			return this;
		}
	}

	class Test extends TestTemplate {
		constructor(testName = "Test") {
			super(testName);
		}

		test(testFunction) {
			this._test = checkIsFunc(testFunction);
			return this;
		}

		run(initialResource = {}) {
			if (this._test === undefined) {
				throw "Incomplete test";
			}

			const testResource = this._before(initialResource);

			const startTime = ticker();
			const testResult = this._test(testResource);
			const testDuration = ticker() - startTime;

			const processedResult = this._after(testResult, testDuration);
			return {
				testResult: processedResult,
				testDuration,
			};
		}
	};

	const checkIsTest = testCase => {
		if (testCase instanceof Test) {
			return testCase;
		}
		throw "Not a test case";
	};

	class TestSuite {
		constructor(testName = "TestSuite") {
			this._name = testName
			this._beforeAll = nop;
			this._testCases = [];
			this._afterAll = nop;
		}

		beforeAll(beforeTest = nop) {
			this._beforeAll = checkIsFunc(beforeTest);
			return this;
		}

		afterAll(afterTest = nop) {
			this._afterAll = checkIsFunc(afterTest);
			return this;
		}

		addTest(testCase) {
			this._testCases.push(checkIsTest(testCase));
			return this;
		}

		run(initialResource = {}) {
			if (this._testCases.length === 0) {
				throw "Incomplete test suite";
			}

			const testResource = this._beforeAll(initialResource);

			const startTime = ticker();
			const testResults = this._testCases.map(testCase => testCase.run(testResource));
			const testDuration = ticker() - startTime;

			const processedResults = this._afterAll(testResults, testDuration)
			return {
				testResult: processedResults,
				testDuration,
			};
		}
	}

	// Make the global property extensible, so that it can be extended from users of the library
	// However, make the shipped tools frozen and unmodifiable to avoid unpleasant surprises
	const assignUnmodifiable = (target, source) => {
		const properties = Object.entries(source);

		properties.forEach(([name, value]) => {
			Object.freeze(value);

			Object.defineProperty(target, name, {
				enumerable: true,
				configurable: false,
				writable: false,
				value: value,
			});
		});


		return {
			testResult: processedResult,
			testDuration,
		};
	}

	const µ = Object.create(null);

	assignUnmodifiable(µ, {
		rand,
		Test,
		TestSuite,
	});

	// Selfishly hog the name "µ"
	Object.defineProperty(globalContext, "µ", {
		enumerable: true,
		configurable: false,
		writable: false,
		value: µ,
	});
})(self);