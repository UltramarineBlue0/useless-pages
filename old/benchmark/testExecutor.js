"use strict";
(() => {
	let executorPort;

	const notifyError = (testName, error) => {
		if (error instanceof Error) {
			console.error(error);
			executorPort.postMessage(`${error.constructor.name} in ${testName}`);
		} else {
			executorPort.postMessage(`Unknown error in ${testName}`);
		}
	};

	const executeTests = (testsArray, index) => {
		const test = testsArray[index];
		const testName = test.name;
		try {
			const testFunc = new Function("'use strict';\n" + test.func);
			testFunc();
			executorPort.postMessage(testName + " done");

			const nextIndex = index + 1;
			if (nextIndex < testsArray.length) {
				µ.queueTask(() => executeTests(testsArray, nextIndex));
			} else {
				executorPort.postMessage("finished");
			}
		} catch (error) {
			notifyError(testName, error);
		}
	};

	const run = (before, tests) => {
		try {
			const beforeFunc = µ.newAsyncFunc("'use strict';\n" + before);
			beforeFunc()
				.then(() => {
					executorPort.postMessage("Before done");
					µ.queueTask(() => executeTests(tests, 0));
				})
				.catch(error => {
					notifyError("Before", error);
				});
		} catch (error) {
			notifyError("Before", error);
		}
	};

	// start a test run
	const listener = msg => {
		const before = msg.data.before;
		const tests = msg.data.tests;
		µ.queueTask(() => run(before, tests));
	};

	// Expect at most 1 message from test controller window to the test iframe and it must contain a MessagePort
	self.addEventListener("message", msg => {
		msg.preventDefault();
		msg.stopImmediatePropagation();

		if (msg.source === self.parent && msg.ports.length === 1 && msg.ports[0] instanceof MessagePort) {
			executorPort = msg.ports[0];
			executorPort.onmessage = listener;
			executorPort.postMessage("ready");
		} else {
			self.display = document.getElementById("display");
			console.error("Unexpected message: %o", msg);
			display.textContent = "ERROR: Unexpected message";
		}
	}, {
			capture: true,
			once: true,
		});
})();