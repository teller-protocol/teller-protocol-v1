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
