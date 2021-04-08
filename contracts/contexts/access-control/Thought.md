Maybe we could split the logic as such:

- Internal getters of state
- External views exposing some state
- Internal state modifiers
- External calls modifying state

And the storage one or more source files with a versioned naming scheme.
