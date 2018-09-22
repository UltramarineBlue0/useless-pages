"use strict";

import { deepFreeze, isObject, isEmpty, isFunction } from "./utils.js";

const alertError = (error, messagePrefix = "An error was thrown: ") => {
	alert(`${messagePrefix}\n${error}`);
};

const assertNotEmpty = (obj, message = "Parameter cannot be empty or absent") => {
	if (isEmpty(obj)) {
		throw new Error(message);
	}
	return obj;
};

const assertIsFunction = (func, message = "Parameter is not a function") => {
	if (isFunction(func)) {
		return func;
	}
	throw new Error(message);
};

const assertIsObject = (obj, message = "Parameter is not an object") => {
	if (isObject(obj)) {
		return obj;
	}
	throw new Error(message);
};

deepFreeze(alertError);
deepFreeze(assertNotEmpty);
deepFreeze(assertIsFunction);
deepFreeze(assertIsObject);

export { alertError, assertNotEmpty, assertIsFunction, assertIsObject };