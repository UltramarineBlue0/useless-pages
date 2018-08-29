"use strict";

const placeholderMarker = Symbol("Marker for a placeholder in a tagged template string");

const createTemplate = (templateArray, ...objects) => {
	let result = templateArray[0];
	for (let i = 0; i < objects.length; i++) {
		result += String(objects[i]);
		result += templateArray[i + 1];
	}
	return result;
};

class Template {
	constructor() {
		
	}
}

export { placeholderMarker, createTemplate };