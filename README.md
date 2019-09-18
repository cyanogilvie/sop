State-Oriented Programming
==========================

As concurrency and network-distributed programming becomes more widely
used as a design technique, the traditional linear and simple event
driven paradigms begin to run into difficulties in realising optimal
parallelism in a robust and maintainable way.

SOP (State Oriented Programming) conceives of such systems as a
collection of state networks.  Program flow is implicit as code
handlers are dispatched as the result of state changes.

This package draws heavily on the metaphor of electronic digital
logic gates to provide a set of objects to assemble into dynamic
state networks and attach handlers to.

