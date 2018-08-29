"use strict";

const globalScope = (global === undefined) ? self : global;

const marker = Symbol("Circular reference breaker");

/**
 * true if non null and type is object
 */
const isObject = obj => {
	if (obj instanceof Object) {
		return true;
	}

	const type = typeof obj;
	if (type === "object" || type === "function") {
		if (obj !== null) {
			return true;
		}
	}

	return false;
};

/**
 * Swallow any errors
 */
const freezeSilently = obj => {
	try {
		Object.preventExtensions(obj);
		Object.seal(obj);
		Object.freeze(obj);
	} catch (e) { }
};

/**
 * Need to be able to create new properties to detect cycles
 * Warning, using this on objects or arrays that are not pure data holders can have unexpected results
 * Ignores primitive values, compatible with objects with null prototype and objects from other global scopes
 * Does not freeze the [[Prototype]] of the object
 */
const deepFreeze = obj => { // TODO use set as Circular reference breaker and throw exception
	if (!isObject(obj)) {
		// primitive types are already immutable
		return;
	}

	if (obj[marker] === true) {
		// already in the process of deep freeze, abort
		return;
	}

	const descriptors = Object.getOwnPropertyDescriptors(obj);

	// mark current object that it entered the process to be deep frozen
	obj[marker] = true;

	if (obj[marker] !== true) {
		// no write access to the current object: cannot detect cycles
		freezeSilently(obj);
		return;
	}

	Object.values(descriptors).forEach(valueDescription => {
		// recursively freeze any non primitive elements
		if ("value" in valueDescription) {
			deepFreeze(valueDescription.value);
		}
		if ("get" in valueDescription) {
			deepFreeze(valueDescription.get);
		}
		if ("set" in valueDescription) {
			deepFreeze(valueDescription.set);
		}
	});

	delete obj[marker];

	freezeSilently(obj);
};

const immutableCopy = obj => {

};


export { globalScope as global, deepFreeze };
