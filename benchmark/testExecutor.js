"use strict";
(() => {
	const testController = self.parent;
	const display = document.getElementById("display");

	self.onmessage = msg => {
		if (msg.source === testController) {
			// TODO test using queuetask

			try {
				const before = new Function("'use strict';\n" + msg.data);
				display.textContent = before();
			} catch (error) {
				if (error instanceof Error) {
					console.dir(error);
					testController.postMessage(error.name + " in 'Before': " + error.message + "\nStack:\n" + error.stack, "*");
				} else {
					testController.postMessage("Unknown error in 'Before'", "*");
				}
			}
		}
	};
})();