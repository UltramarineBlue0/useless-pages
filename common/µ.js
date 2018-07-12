"use strict";
(global => {
	const self = global;

	// xoshiro128** algorithm by David Blackman and Sebastiano Vigna
	// http://xoshiro.di.unimi.it/xoshiro128starstar.c
	// State for the random generator. Int32 because most bitwise operators convert numbers to 32-bit signed int
	const rndState = new Int32Array(4);
	// Cryptographically secure random numbers guarantees good seed
	self.crypto.getRandomValues(rndState);

	const rotl = (x, k) => (x << k) | (x >>> (32 - k));

	const randInt = () => {
		// Math.imul ensures correct overflow behavior
		const x = Math.imul(rndState[0], 5);
		const result = Math.imul(rotl(x, 7), 9);
		const t = rndState[1] << 9;

		rndState[2] ^= rndState[0];
		rndState[3] ^= rndState[1];
		rndState[1] ^= rndState[2];
		rndState[0] ^= rndState[3];

		rndState[2] ^= t;

		rndState[3] = rotl(rndState[3], 11);

		return result;
	};

	const caution_resetSeed = array => {
		for (let i = 0; i < 4; ++i) {
			rndState[i] = array[i];
		}
	}

	const randBool = () => {
		// Convert most significant bit to boolean
		return randInt() < 0;
	};

	// Avoids bias by skipping over-represented candidates
	// Returns a generator with its behavior similar to java.util.SplittableRandom.internalNextInt()
	// For the rejection in second case also see pcg32_boundedrand_r() in https://github.com/imneme/pcg-c-basic/blob/bc39cd76ac3d541e618606bcc6e1e5ba5e5e6aa3/pcg_basic.c
	const randIntGenerator = (lowerBoundInclusive, upperBoundExclusive) => {
		const l = lowerBoundInclusive | 0;
		const u = upperBoundExclusive | 0;
		if ((lowerBoundInclusive !== l) || (upperBoundExclusive !== u) || // bounds must be 32-bit signed integers
			(l >= u)) { // lower bound must be larger than upper bound
				throw new RangeError("Invalid bounds");
		}

		// The maximum range is 0xffffffff, occurs with 2147483647 (2^31 - 1) as the upper bound and -2147483648 (- 2^31) as the lower bound
		// -> The entire range can be expressed as a 32-bit unsigned integer
		const d = (u - l) >>> 0; // Range as 32-bit unsigned int
		const m = (d - 1) >>> 0; // Bit mask

		if ((d & m) === 0) {
			// 1. case: the range is a power of two
			// -> use bit mask. always generates a number in one iteration
			return () => ((randInt() & m) >>> 0) + l;
		} else {
			// 2. case: range is not a power of two
			// -> loop to reject over-represented values. expected number of iterations is between 1 and 2, depending on the range
			const max = (2 ** 32);
			const threshold = (max % d) >>> 0; // numbers below this threshold are over-represented. threshold === 0 is handled in the 1. case
			let result = 0;
			return () => {
				do {
					result = randInt() >>> 0; // reinterpret as 32-bit unsigned int
				} while (result < threshold); // reject numbers below threshold
				
				return ((result % d) >>> 0) + l;
			};
		}
	};

	const ticker = () => performance.now();

	const nop = x => x;

	const checkIsFunc = func => {
		if ((typeof func) !== "function") {
			throw new TypeError("Not a function");
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
		throw new TypeError("Not a test case");
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

	// Make the global property extensible, so that it can be extended by the users of the library
	// However, make the core tools here frozen and unmodifiable to avoid unpleasant surprises
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
		randInt,
		randBool,
		randIntGenerator,
		caution_resetSeed,
		TestTemplate,
		Test,
		TestSuite,
	});

	// Selfishly hog the name "µ"
	Object.defineProperty(self, "µ", {
		enumerable: true,
		configurable: false,
		writable: false,
		value: µ,
	});
})(self);