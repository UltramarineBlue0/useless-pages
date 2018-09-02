"use strict";

import { isObject, deepFreeze } from "../common/utils.js";

class InvalidParamError extends Error {
	constructor(param) {
		super(`${param} is not a valid parameter for this function`);
		this.param = param;
	}
}

const assertIsObject = obj => {
	if (isObject(obj)) {
		return obj;
	}
	throw new InvalidParamError(obj);
};
