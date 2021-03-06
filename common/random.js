"use strict";

import { maxUInt32 } from "./numbers.js";

// Random number generator using xoshiro128** algorithm by David Blackman and Sebastiano Vigna
// http://xoshiro.di.unimi.it/xoshiro128starstar.c

// State for the random generator. Int32 because most bitwise operators convert numbers to 32-bit signed int
const rndState = new Int32Array(4);
// Cryptographically secure random numbers guarantees good seed
self.crypto.getRandomValues(rndState);

const rotl = (x, k) => (x << k) | (x >>> (32 - k));

const randInt32 = () => {
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

export const CAUTION_setSeed = array => {
	for (let i = 0; i < 4; ++i) {
		rndState[i] = array[i];
	}
};

export const randBool = () => {
	// Convert most significant bit to boolean
	return randInt32() < 0;
};

// Returns a generator which avoids bias by skipping over-represented candidates
// The rejection is similar to the one in pcg32_boundedrand_r() in https://github.com/imneme/pcg-c-basic/blob/bc39cd76ac3d541e618606bcc6e1e5ba5e5e6aa3/pcg_basic.c
// Also see "java.util.SplittableRandom.internalNextInt()" and "Random._randbelow_without_getrandbits()" in cpython/Lib/random.py
export const getRandomInt = (lowerBoundInclusive, upperBoundExclusive) => {
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
		return (randInt32() & m) + l; // Highest possible mask is 0x7F_FF_FF_FF
	} else {
		// 2. case: range is not a power of two
		// -> loop to reject over-represented values. expected number of iterations are between 1 and 2, depending on the range
		const max = maxUInt32 + 1; // The amount of distinct integers that can be generated by randInt
		const threshold = (max % d) >>> 0; // numbers below this threshold are over-represented. threshold === 0 is handled in the 1. case

		let nextValue = randInt32() >>> 0; // reinterpret as 32-bit unsigned int
		while (nextValue < threshold) {
			nextValue = randInt32() >>> 0;
		}

		return (nextValue % d) + l;
	}
};

const lowerCase = "abcdefghijklmnopqrstuvwxyz";
const upperCase = lowerCase.toUpperCase();
const digits = "0123456789";
const chars = lowerCase + upperCase + digits;

/**
 * Random alphanumeric string
 */
export const randStr = length => {
	const result = [];
	for (let i = 0; i < length; i++) {
		const pos = getRandomInt(0, chars.length);
		result.push(chars.charAt(pos));
	}
	return result.join("");
};