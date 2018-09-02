"use strict";

const globalScope = (global === undefined) ? self : global;

const isFunction = func => {
	return ((typeof func) === "function");
};

/**
 * true if non null and type is object
 */
const isObject = obj => {
	if (obj instanceof Object) {
		return true;
	}

	if (obj !== null) {
		const type = typeof obj;
		if (type === "object" || type === "function") {
			return true;
		}
	}

	return false;
};

/**
 * "Depth first" Freezes innermost element first
 * @param visited a set of already visited objects. used to break circular references 
 */
const recursiveFreeze = (obj, visited) => {
	if (!isObject(obj)) {
		// primitive types are already immutable
		return;
	}

	if (visited.has(obj)) {
		// either in the process of freeze or already frozen, abort
		return;
	}

	// mark current object that it entered the process to be frozen
	visited.add(obj)

	const descriptors = Object.getOwnPropertyDescriptors(obj);

	Object.values(descriptors).forEach(valueDescription => {
		// recursively freeze any non primitive elements
		if ("value" in valueDescription) {
			recursiveFreeze(valueDescription.value, visited);
		}
		if ("get" in valueDescription) {
			recursiveFreeze(valueDescription.get, visited);
		}
		if ("set" in valueDescription) {
			recursiveFreeze(valueDescription.set, visited);
		}
	});

	Object.freeze(obj);

	if (!Object.isFrozen(obj)) {
		throw new Error(`Couldn't freeze ${obj}`);
	}
};

/**
 * Naive implementation to freeze existing objects
 * Warning, using this on anything other than plain objects or plain arrays could have unexpected results
 * Leaves primitive values as is, compatible with objects with null prototype and objects from other global scopes
 * Doesn't change any element's prototype, structure or type, can't freeze the new collection types in ES6 or proxies
 * Also doesn't freeze the prototype chain of the object and any of its elements
 */
const deepFreeze = obj => {
	const visited = new WeakSet();
	recursiveFreeze(obj, visited);
	return obj;
};

const AsyncFunc = Object.getPrototypeOf(async () => { }).constructor;

/**
 * @param args same signature as new Function()
 */
const newAsyncFunc = (...args) => {
	return new AsyncFunc(...args);
};

// it's difficult to write a comprehensive immutable copy in just two or three short methods. it would have to deal with many different cases
// things like typedarrays, maps, sets, proxies, and things from DOM all need individual treatment
// a naive approach would be to copy everything in to objects. while this copies information, the behavior would be lost
// some special case would need custom classes to simulate read only access

deepFreeze(isFunction);
deepFreeze(isObject);
deepFreeze(deepFreeze);
deepFreeze(newAsyncFunc);

export { globalScope as global, isFunction, isObject, deepFreeze, newAsyncFunc };
