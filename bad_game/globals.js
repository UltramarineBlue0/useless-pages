"use strict";

// Not using exports, since this has to be usable from both the main window and web workers, where es6 modules
// isn't supported yet
// Explicitly define variable on "self", since this has to support both import './.js'; in es6 module and importScripts('.js'); in web worker

// Codes used in message events between the ui and the game logic in web worker
Object.defineProperty(self, "EventCodes", {
	enumerable: false,
	configurable: false,
	writable: false,
	value: Object.freeze({
		CLICK: 0,
		READY: 1,
	}),
});

// Defines the current game state. Only properties necessary for a reload should be saved here
Object.defineProperty(self, "GameState", {
	enumerable: false,
	configurable: false,
	writable: false,
	value: Object.seal({
		bits: 0,
		population: 0,

	}),
});
