# Storage

State variables are retrieved by referencing a struct containing the state at a specific location in storage.

Each storage context uses its own library to define:

- The storage position
- The state
- A function to get a pointer to the struct containing the state

See ./contracts/storage/\*

The BEST medium article is this one:

https://medium.com/1milliondevs/solidity-storage-layout-for-proxy-contracts-and-diamonds-c4f009b6903

https://medium.com/1milliondevs/new-storage-layout-for-proxy-contracts-and-diamonds-98d01d0eadb

TODO: NO COLISIONS TESTS I MAKE ERRORS

NOMENCLATURE:
Here, the word <Domain> can also mean <Context>
A <Domain> is a Diamond contract with some defaults and a bit of added functionality.
A <Context> is very similar to a domain (it also provides external/internal functions and Storage objects); but <Context>'s are more like tools for a <Domain> and its other contexts to function well together.

Basically a <Domain> == Diamond & a <Context> == Facet.

A <Domain> can choose not to use <Context>'s to provide entries into it, and can even choose to auto-upgrade if some of its contexts, internal functions or Storage objects are updated.

sto\_<Domain>\_vX - Versioned storage contract for <Domain>
sto\_<Domain> - Latest release of the storage contract for <Domain>
int\_...\_<Domain>\_vX - Versioned internal helper available in <Domain>
int\_...\_<Domain> - Points to latest release of internal helper
ext\_...\_<Domain>\_vX - Versioned release of external function callable on <Domain>
ext\_...\_<Domain> - Currently callable function on the context (points to latest)
dom\_<Domain>??vX - Not sure whether we want versioned domains, my guess is no (they are diamonds)
ctx\_<Context>
ent\_...\_<Domain>\_vX - Versioned release of entry function callable on <Domain> or on the one a <Context> is attached to.
ent\_...\_<Domain> - Currently callable function on the context (points to latest)

OPERATION:
Any resource, i.e. an ext\_ call in an abstract contract, can choose to inherit from a static versioned abstract contract or the latest for that resource.
If a contract is not compiled using a static version, it is subject to automatically propagate changes by its dependencies to its dependents. This behavior can be configured prior to deployment to yield the best results.
