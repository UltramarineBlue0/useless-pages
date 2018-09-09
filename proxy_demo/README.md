### Abuse Proxy for questionable js code

Initially I just wanted to see what Proxy can do to make debugging more difficult, but fairly soon it became clear that Proxy is a much more powerful than I originally thought. Reading through blogs and documentation, a few interesting things stood out:

- Proxy is the first and currently the only way to implement operator overloading in js. Though it is limited to only objects and only certain operators can be "enhanced"
- Even though there are invariants which the handler must conform to, they aren't very restricting. Also, by using a "placeholder" object / function in the Proxy constructor, many of the invariants can be "broken". That is, a helper function that creates Proxies from the passed objects don't have to use given objects in the Proxy constructor
- Operator overloading can enable seemingly new, unfamiliar and ver weird syntax in js. This can confuse readers of the code

For most software development, easy to understand and well structured code is usually easy to maintain and easy to debug. I personally think this boils down to a few characteristics:

- Cause and effect must be easy to see and follow
  - Idempotent operations are easy to follow since "they always give the same result"
  - Side effect free operations are easy to follow since "they don't change anything else"
- As few as possible states must be "tracked" to understand the code
- A interface hides implementation details but not complexities required to solve the problem / do a task


"less code is better / code as a liability" "uncontrollably escalating complexity" "communication between team members" "expressive code, convey both what and why"

Proxy can be used to add ........
