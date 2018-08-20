### Security requirements and measures

Since tests from others can be shared using just the URLs, this webpage needs to balance the two contradictory goals

1. Let the developer test as many features and aspects of javascript as possible
2. Minimize the harm malicious code can do to unsuspecting users, who doesn't really understand what the test is doing

Target:

- Worst case scenario that a potential attacker can create should be equivalent to an infinite loop
- The most drastic action the user must take is to close the tab where the benchmark is running
- The code shouldn't be able to influence other tabs
- Test code shouldn't be able to read information from other domains
- If possible, minimize the ways a user can be tricked into interacting with something that comes from the test code, believing that it came from somewhere else
- Don't allow code to submit any information to unknown hosts


Out of scope / unsolvable:

- since javascript can be obfuscated, a simple request can be expressed in near infinitely many ways. a pattern recognition (that i can build on my own) to filter out "bad" code can't possibly cover all possible variations of obfuscated way of doing things
  - deobfuscation doesn't seem like a good idea either, most deobfuscators for other things that i know can't completely deobfuscate the code. i doubt it'll be different in js
- the tests should be able to test dom related operations and display things in the iframe. it would be difficult to control what exactly the test code will show to the user and stop it from displaying obscene or misleading things.
  - limit what the code can achieve (transferring money from user's paypal account), not what the code can show (a paypal lookalike)
- since the test webpage could be hosted anywhere (currently on github pages) and i usually don't have control over the http headers, the counter measures must be defined in the html itself


Features used to limit the things test code can do:

- iframe sandbox one of the two main tools used to contain and limit test code's ability `sandbox="allow-scripts"`
  - restricted to a unique origin that is different than any other website. the browser will treat the iframe as cross domain
    - doesn't inherit any information storage like cookies from other domains
    - very limited access to the parent page
    - cors requests will fail unless Access-Control-Allow-Origin specifically allows any origin
  - plugins are disabled in the iframe
  - the sandbox effectively limits the area the test code can "draw on" to the iframe itself
- content security policy is used to control which hosts the webpage, including all of the test code, can connect to `default-src https://cdnjs.cloudflare.com https://cdn.jsdelivr.net data: blob: 'self' 'unsafe-inline' 'unsafe-eval'`
  - only allow external connections to 'self' and the two CDNs cdnjs and jsDelivr
    - i have to trust the CDNs to not allow anyone to submit random data to their cdn hosts
    - as a result, even if the test tricked the user to enter any personal information, it wouldn't be able to send the data any where
  - data: and blob: is local to the page. you can't submit anything to external hosts using these schemas
  - 'unsafe-inline' 'unsafe-eval' has to be enabled, since that's how the code is executed
  - even if scripts change the meta tag afterwards, it'll have no effect and the original rules will still be enforced
- combining the sandbox with csp, the test code also can't store the data locally in any conventional way. localstorage and sessionstorage are disabled in the sandbox. because of the unique domain, things like cookies created by test code can't be accessed from any other website
- use a dedicated messagechannel to communicate to the test executor in the iframe. the test code shouldn't have access to the messagechannel so it has no way to communicate with the parent page


i'm sure there are probably some very niche ways to store or send data despite csp and sandbox. but csp + sandbox removes most of the risk of executing potentially malicious code in a user's browser
