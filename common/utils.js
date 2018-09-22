"use strict";

const globalScope = (() => {
	// handle ReferenceError
	try {
		if (global !== undefined) {
			return global;
		}
		throw "";
	} catch (e) {
		if (self !== undefined) {
			return self;
		}
		throw InternalError("wat");
	}
})();

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
const isEmpty = obj => {
	return (obj === null) || (obj === undefined) || (obj.length === 0) || (obj.size === 0);
};

/**
 * @param visited a set of already visited objects. used to break circular references 
 */
const recursiveFreeze = (obj, visited) => {
	// the "is object" and "not visited" check is hoisted into the previous iteration

	// abort early if obj can't be frozen
	Object.freeze(obj);
	if (!Object.isFrozen(obj)) {
		throw new Error(`Couldn't freeze ${obj}`);
	}

	// mark current object that it entered the process to be frozen
	visited.add(obj)

	const descriptors = Object.getOwnPropertyDescriptors(obj);

	Object.values(descriptors).forEach(valueDescription => {
		// recursively freeze any non primitive elements
		const value = valueDescription.value;
		if (isObject(value) && !visited.has(value)) {
			recursiveFreeze(value, visited);
		}
		const getter = valueDescription.get;
		if (isObject(getter) && !visited.has(getter)) {
			recursiveFreeze(getter, visited);
		}
		const setter = valueDescription.set;
		if (isObject(setter) && !visited.has(setter)) {
			recursiveFreeze(setter, visited);
		}
	});
};

/**
 * Naive implementation to freeze existing objects
 * Warning, using this on anything other than plain objects or plain arrays could have unexpected results
 * Leaves primitive values as is, compatible with objects with null prototype and objects from other global scopes
 * Doesn't change any element's prototype, structure or type, can't freeze the new collection types in ES6 or proxies
 * Also doesn't freeze the prototype chain of the object and any of its elements
 */
const deepFreeze = obj => {
	if (isObject(obj)) {
		const visited = new WeakSet();
		recursiveFreeze(obj, visited);
	}
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
deepFreeze(isEmpty);

deepFreeze(newAsyncFunc);
deepFreeze(recursiveFreeze);
deepFreeze(deepFreeze);

export { globalScope as global, isFunction, isObject, isEmpty, deepFreeze, newAsyncFunc };
