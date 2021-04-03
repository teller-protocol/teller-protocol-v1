# Teller Diamond Structure

## Storage

State variables are retrieved by referencing a struct containing the state at a specific location in storage.

Each storage context uses its own library to define:

- The storage position
- The state
- A function to get a pointer to the struct containing the state

See `/contracts/storage/*`

The BEST medium article is this one:

https://medium.com/1milliondevs/solidity-storage-layout-for-proxy-contracts-and-diamonds-c4f009b6903

https://medium.com/1milliondevs/new-storage-layout-for-proxy-contracts-and-diamonds-98d01d0eadb

TODO: NO COLLISIONS TESTS I MAKE ERRORS

## Nomenclature

- `Domain == Diamond`
- `Context == Facet`
- `Entry == External State Mutation Functions`

Here, the word `Domain` can also mean `Context`

- A `Domain` is a Diamond contract with some defaults and a bit of added functionality.
- A `Context` is very similar to a domain (it also provides external/internal functions and Storage objects)
  - More like tools for a `Domain` and its other contexts to function well together.

A `Domain` can choose not to use `Context`s to provide entries into it, and can even choose to auto-upgrade if some of its contexts, internal functions or Storage objects are updated.

### Domains (Diamonds)

- `dom_{Domain}_vX` - Not sure whether we want versioned domains, my guess is no (they are diamonds)

### Storage Contracts

- `sto_{Domain}` - The Latest release of the storage contract for `Domain`

- `sto_{Domain}_vX` - Versioned storage contract for `Domain`

### Context

- `ctx_{Context}`

### Entries

Entry contracts contain external functions that modify the state of a `Domain`.

These are the only _entry points_ for users into the protocol.

- `ent_{Domain}` - Currently callable functions on the context (points to latest)

- `ent_{Domain}_vX` - Versioned release of entry functions callable on a `Domain` or on the one a `Context` is attached to.

### Internal Functions

Functions prefixed with `int_` are shareable internal functions by any `Contex` within a `Domain`.

- `int_{Domain}` - Points to the latest release of the internal helper functions

- `int_{Domain}_vX` - Versioned internal helpers are available in `Domain`

### External View Functions

Contracts prefixed with `ext_` are designated only for external view functions for a `Domain`.

- `ext_{Domain}` - Currently callable functions on the context (points to latest)

- `ext_{Domain}_vX` - Versioned release of external functions callable on `Domain`

## OPERATION:

- Any resource, i.e. an `ext_` call in an abstract contract, can choose to inherit from a static versioned abstract contract or the latest for that resource.
- If a contract is not compiled using a static version, it is subject to automatically propagate changes by its dependencies to its dependents.
- This behavior can be configured prior to deployment to yield the best results.
