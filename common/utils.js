"use strict";

export const isFunction = func => {
	return ((typeof func) === "function");
};

/**
 * true if non null and type is object
 */
export const isObject = obj => {
	if (obj instanceof Object) {
		return true;
	}

	if (obj !== null && obj !== undefined) {
		const type = typeof obj;
		if (type === "object" || type === "function") {
			return true;
		}
	}

	return false;
};

/**
 * Useful for string-like, array-like, set- or map-like objects
 */
export const isEmpty = obj => {
	return (obj === null) || (obj === undefined) || (obj.length === 0) || (obj.size === 0);
};

const AsyncFunc = Object.getPrototypeOf(async () => { }).constructor;

/**
 * @param args same signature as new Function()
 */
export const newAsyncFunc = (...args) => {
	return new AsyncFunc(...args);
};

const AsyncGenerator = Object.getPrototypeOf(async function* () { }).constructor;;

/**
 * @param args same signature as new Function()
 */
export const newAsyncGenerator = (...args) => {
	return new AsyncGenerator(...args);
};

export const alertError = (error, messagePrefix = "An error was thrown: ") => {
	alert(`${messagePrefix}\n${error}`);
};

export const assertNotEmpty = (obj, message = "Parameter cannot be empty or absent") => {
	if (isEmpty(obj)) {
		throw new Error(message);
	}
	return obj;
};

export const assertIsFunction = (func, message = "Parameter is not a function") => {
	if (isFunction(func)) {
		return func;
	}
	throw new Error(message);
};

export const assertIsObject = (obj, message = "Parameter is not an object") => {
	if (isObject(obj)) {
		return obj;
	}
	throw new Error(message);
};