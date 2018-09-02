"use strict";

import { deepFreeze } from "./utils.js";

export const minInt8 = (-(2 ** 7)) | 0;
export const maxInt8 = ((2 ** 7) - 1) | 0;
export const minUInt8 = 0 >>> 0;
export const maxUInt8 = ((2 ** 8) - 1) >>> 0;

export const minInt16 = (-(2 ** 15)) | 0;
export const maxInt16 = ((2 ** 15) - 1) | 0;
export const minUInt16 = 0 >>> 0;
export const maxUInt16 = ((2 ** 16) - 1) >>> 0;

export const minInt32 = (-(2 ** 31)) | 0;
export const maxInt32 = ((2 ** 31) - 1) | 0;
export const minUInt32 = 0 >>> 0;
export const maxUInt32 = ((2 ** 32) - 1) >>> 0;

/**
 * Similar to the first method shown on https://randomascii.wordpress.com/2012/02/25/comparing-floating-point-numbers-2012-edition/
 * @returns false if at least one parameter is not a finite number
 */
const floatEquals = (a, b) => {
	if (Number.isFinite(a) && Number.isFinite(b)) {
		const max = Math.max(Math.abs(a), Math.abs(b));
		return Math.abs(a - b) <= (max * Number.EPSILON);
	}

	return false;
};

deepFreeze(floatEquals);

export { floatEquals };