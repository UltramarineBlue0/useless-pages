"use strict";

import { isObject } from "../common/utils.js";
import { deepFreeze } from "../common/misc.js";

const globalProxyRegister = new WeakMap();

/**
 * Never leak this to outside callers under any circumstances
 */
const empty = (() => {
	const func = function () {};
	const propNames = Reflect.ownKeys(func);
	propNames.forEach(name => {
		try {
			delete func[name];
		} catch (e) {
			func[name] = undefined;
		}
	});
	Object.setPrototypeOf(func, null);
	return func;
})();
const commonHandlers = {
	getPrototypeOf: () => null,
	setPrototypeOf: () => false,
	isExtensible: () => true,
	preventExtensions: () => false,
	getOwnPropertyDescriptor: () => undefined,
	defineProperty: () => false,
	has: () => false,
	set: () => false,
	deleteProperty: () => false,
	ownKeys: () => [],
	construct: () => Object.create(null),
};

/**
 * @param {Object} target the current target, that should be proxied
 * @param {(Proxy|undefined)} parent the proxy of the enclosing object, where the target is a part of. used as this parameter
 * @returns {Proxy} a proxy that prevents most introspection and write access
 */
const recursiveSnapshot = (target, parent) => {
	if (!isObject(target)) {
		// primitive values are already immutable
		return target;
	}
	if (globalProxyRegister.has(target)) {
		// already a proxy created by this method
		return target;
	}
	if (globalObjectRegister.has(target)) {
		// already has a proxy from that object
		return globalObjectRegister.get(target);
	}

	const prototype = Object.getPrototypeOf(target);
	const properties = new Map();

	// use an open empty function to circumvent the invariants of proxy. function to allow both function calls and property accesses
	const proxy = new Proxy(empty, {

	});

	globalProxyRegister.set(proxy, target);
	globalObjectRegister.set(target, proxy);

	return proxy;
};

/**
 * @param {Object} obj must be a object
 * @param {Object} companion a "companion" that acts like a second prototype
 * @returns {Proxy} redefines some operators for the object, makes code harder to read
 */
const trap = (obj, companion) => {
	if (!isObject(obj)) {
		throw new Error(`${obj} is not an object`);
	}
	return recursiveSnapshot(obj, undefined);
};

const protectedCreator = trap(deepFreeze(trap));

export { protectedCreator as neverUseThis };