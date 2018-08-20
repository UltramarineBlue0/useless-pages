"use strict";

(global => {
	// First define the global property µ. Leave that extensible, so that it can be extended by the users of the library
	// However, make the core utilities in the library frozen and unmodifiable to avoid unpleasant surprises
	const self = global;

	const assignConst = (target, name, value) => {
		const propertyDescription = {
			enumerable: true,
			configurable: false,
			writable: false,
			value: value,
		};

		return Object.defineProperty(target, name, propertyDescription);
	};

	const freezeAssign = (target, source) => {
		Object.entries(source).forEach(([name, value]) => {
			value = Object.freeze(value);

			assignConst(target, name, value);
		});

		return target;
	};

	const µ = freezeAssign(Object.create(null), {
		assignConst,
		freezeAssign,
	});

	// Selfishly hog the name "µ"
	assignConst(self, "µ", µ);

	if (!("micro" in self)) {
		self.micro = µ;
	}


	// A few useful integer constants
	(() => {
		// The limit of two's complement integers
		µ.freezeAssign(µ, {
			minInt8: (-(2 ** 7)) | 0,
			maxInt8: ((2 ** 7) - 1) | 0,
			minUInt8: 0 >>> 0,
			maxUInt8: ((2 ** 8) - 1) >>> 0,

			minInt16: (-(2 ** 15)) | 0,
			maxInt16: ((2 ** 15) - 1) | 0,
			minUInt16: 0 >>> 0,
			maxUInt16: ((2 ** 16) - 1) >>> 0,

			minInt32: (-(2 ** 31)) | 0,
			maxInt32: ((2 ** 31) - 1) | 0,
			minUInt32: 0 >>> 0,
			maxUInt32: ((2 ** 32) - 1) >>> 0,
		});
	})();


	// A few small useful utilities
	(() => {
		const isFunction = func => (typeof func) === "function";

		// Similar to the first method shown on https://randomascii.wordpress.com/2012/02/25/comparing-floating-point-numbers-2012-edition/
		// Returns false if at least one parameter is not a finite number
		const floatEquals = (a, b) => {
			if (Number.isFinite(a) && Number.isFinite(b)) {
				const max = Math.max(Math.abs(a), Math.abs(b));
				return Math.abs(a - b) <= (max * Number.EPSILON);
			}

			return false;
		};

		const AsyncFunc = Object.getPrototypeOf(async () => { }).constructor;

		// same signature as new Function()
		const newAsyncFunc = (...args) => {
			return new AsyncFunc(...args);
		};

		µ.freezeAssign(µ, {
			isFunction,
			floatEquals,
			newAsyncFunc,
		});
	})();


	// Random number generator using xoshiro128** algorithm by David Blackman and Sebastiano Vigna
	// http://xoshiro.di.unimi.it/xoshiro128starstar.c
	(() => {
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

		const CAUTION_setSeed = array => {
			for (let i = 0; i < 4; ++i) {
				rndState[i] = array[i];
			}
		};

		const randBool = () => {
			// Convert most significant bit to boolean
			return randInt() < 0;
		};

		// Returns a generator which avoids bias by skipping over-represented candidates
		// The rejection is similar to the one in pcg32_boundedrand_r() in https://github.com/imneme/pcg-c-basic/blob/bc39cd76ac3d541e618606bcc6e1e5ba5e5e6aa3/pcg_basic.c
		// Also see "java.util.SplittableRandom.internalNextInt()" and "Random._randbelow_without_getrandbits()" in cpython/Lib/random.py
		const getRandomInt = (lowerBoundInclusive, upperBoundExclusive) => {
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

			// If the bounds are constants, a good (current/future?) VM should be able to "specialize" this function after a bit of inlining and
			// constant propagation
			if ((d & m) === 0) {
				// 1. case: the range is a power of two
				// -> use bit mask. always generates a number in one iteration
				return (randInt() & m) + l; // Highest possible mask is 0x7F_FF_FF_FF
			} else {
				// 2. case: range is not a power of two
				// -> loop to reject over-represented values. expected number of iterations are between 1 and 2, depending on the range
				const max = µ.maxUInt32 + 1; // The amount of distinct integers that can be generated by randInt
				const threshold = (max % d) >>> 0; // numbers below this threshold are over-represented. threshold === 0 is handled in the 1. case

				let nextValue = randInt() >>> 0; // reinterpret as 32-bit unsigned int
				while (nextValue < threshold) {
					nextValue = randInt() >>> 0;
				}

				return (nextValue % d) + l;
			}
		};

		µ.freezeAssign(µ, {
			randInt,
			randBool,
			getRandomInt,
			CAUTION_setSeed,
		});
	})();


	// Minimal delay setTimeout using MessageChannel. Works in web workers and main window
	// Creates macro tasks, which won't block IO or the UI
	(() => {
		const channel = new MessageChannel();
		const receiver = channel.port1;
		const sender = channel.port2;

		const queuedTasks = new Map(); // Here, Map is faster than array or plain object in both Firefox and Chrome
		let nextTaskID = 0;

		receiver.onmessage = event => {
			const taskID = event.data;
			const task = queuedTasks.get(taskID);
			// Make sure below that the map can't contain explicitly set undefined values
			if (task !== undefined) {
				queuedTasks.delete(taskID);
				task();
			}
		};

		// The id of the given task, which can be used to cancel that task
		const queueTask = func => {
			if (!µ.isFunction(func)) {
				throw new Error("Not a function");
			}

			const currentID = nextTaskID;
			++nextTaskID;
			queuedTasks.set(currentID, func);
			sender.postMessage(currentID);

			return currentID;
		};

		// Returns true if the task was in the queue and is now removed, false if the id doesn't correspond to any tasks in the queue
		const cancelTask = taskID => {
			if ((!Number.isSafeInteger(taskID)) || (taskID < 0)) {
				return false;
			}

			return queuedTasks.delete(taskID);
		};

		µ.freezeAssign(µ, {
			queueTask,
			cancelTask,
		});
	})();


	// Accepts a int, float, boolean or string to create a data dependency, so that current and future javascript engines can't eliminate "dead code"
	// This is common in benchmarks, especially micro-benchmarks
	// Don't call an of the functions in a hot loop. While they shouldn't take long to execute, they'll still affect the performance
	// The caller has to make sure that the correct function is called depending on the type, otherwise it might not work reliably or at all
	(() => {
		const trashCan = new ArrayBuffer(4);
		const int32Bin = new Int32Array(trashCan);
		const int16Bin = new Int16Array(trashCan);

		const floatConvert = new ArrayBuffer(8);
		const writeOnly = new Float64Array(floatConvert);
		const readOnly = new Int32Array(floatConvert);

		// Retry every 24 days and 20 hours to see if crypto returns 65536 bytes of zero. In theory this should never happen
		// This creates a data dependency from test code to something that in practice never runs
		// console seems to be the only somewhat acceptable way to create such a dependence, which is available in both web workers and the main window
		self.setInterval(() => {
			const notZero = new Uint32Array(16384);
			self.crypto.getRandomValues(notZero);
			if (notZero.every(value => value === 0)) {
				console.error("This should never appear: %o", int32Bin);
				console.error("This should never appear: %o", int16Bin);;
			}
		}, µ.maxInt32);

		// Bit-wise AND, OR, XOR and arithmetic operations ADD, SUB are the fastest instructions on most of the CPUs
		// If fed with random values, AND and OR gravitate towards all 0s and all 1s
		// XOR is best suited for the job, because, unlike ADD and SUB, it doesn't have any obvious issues with NaNs and Infinities
		// Looking at the "BlackHole" class in the Java Micro-Benchmark Harness, these operations are much more expensive (since data is actually written here)
		// However, in Java, they use the "threat of data race under concurrency" (volatile field) to trick the VM. I'm not aware of
		// anything remotely similar in functionality and speed that is both available in main window and web workers
		// It would be ｖｅｒｙ  ｎｉｃｅ, if any of core developers of V8 and SpiderMonkey can comment on this and suggest any improvements
		const absorbInt = num => {
			int32Bin[0] ^= num;
		};

		const absorbFloat = num => {
			writeOnly[0] = num;
			int32Bin[0] ^= readOnly[0];
			int32Bin[0] ^= readOnly[1];
		};

		const absorbString = str => {
			int16Bin[1] ^= str.charCodeAt(str.length - 1);
		};

		const absorbBool = bool => {
			int16Bin[1] ^= (bool << 15);
		};

		µ.freezeAssign(µ, {
			absorbInt,
			absorbFloat,
			absorbString,
			absorbBool,
		});
	})();


	// Tools for light statistical analysis of arrays of numbers
	(() => {
		// both indices are inclusive
		const getCenter = (startIndex, endIndex) => {
			return {
				left: Math.floor((startIndex + endIndex) / 2),
				right: Math.ceil((startIndex + endIndex) / 2),
			};
		};

		// array has to be already sorted
		const median = (array, startIndex = 0, endIndex = (array.length - 1)) => {
			const middle = getCenter(startIndex, endIndex);
			return (array[middle.left] + array[middle.right]) / 2;
		};

		// interquartile range = median(higher half of samples) - median(lower half of samples)
		const interquartileRange = (array, startIndex = 0, endIndex = (array.length - 1)) => {
			const middle = getCenter(startIndex, endIndex);
			let iqrIndexLeft = 0;
			let iqrIndexRight = 0;

			if (middle.left === middle.right) {
				iqrIndexLeft = middle.left - 1;
				iqrIndexRight = middle.left + 1;
			} else {
				iqrIndexLeft = middle.left;
				iqrIndexRight = middle.right;
			}

			return median(array, iqrIndexRight, endIndex) - median(array, startIndex, iqrIndexLeft);
		};

		µ.freezeAssign(µ, {
			median,
			interquartileRange,
		});
	})();


	// loads external resources like js or css files in the given order
	// returns a promise so that caller can subscribe to the event when all files has been loaded, or if any of them failed to load
	(() => {
		class ResourceLoadError extends Error {
			constructor(url, message) {
				super(message + ": " + url);
				this.name = ResourceLoadError.name;
				this.url = url;
			}
		}

		const loadJS = (...urls) => {
			const promises = urls.map(url => new Promise((resolve, reject) => {
				const jsElement = document.createElement("script");

				jsElement.addEventListener("load", () => resolve());
				jsElement.addEventListener("error", () => reject(new ResourceLoadError(url, "JS failed to load")));

				jsElement.async = false;
				jsElement.defer = true;
				jsElement.crossOrigin = "anonymous";
				jsElement.src = url;

				document.head.appendChild(jsElement);
			}));

			return Promise.all(promises);
		};

		const loadCSS = (...urls) => {
			const promises = urls.map(url => new Promise((resolve, reject) => {
				const cssElement = document.createElement("link");

				cssElement.addEventListener("load", () => resolve());
				cssElement.addEventListener("error", () => reject(new ResourceLoadError(url, "CSS failed to load")));

				cssElement.rel = "stylesheet";
				cssElement.crossOrigin = "anonymous";
				cssElement.href = url;

				document.head.appendChild(cssElement);
			}));

			return Promise.all(promises);
		};

		µ.freezeAssign(µ, {
			loadJS,
			loadCSS,
		});
	})();

})(self);
