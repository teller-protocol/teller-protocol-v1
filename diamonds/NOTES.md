It seems that with the JuanBlanco classico extension we can use absolute path matching for importing solidity files.
This is a cool feature because importing a given class of files can be done trivially when compared to having to guess how many folders deep in the tree your CWD is.

As a preview of making DX more timely, you can try:

- import "diamonds/Roles.sol"; -> use bytes32 roles as you wish
- import "diamonds/providers/..." -> access to fave. contracts
- import "diamonds/domains/markets/storage/lending-pool.sol" -> already memorized vs. guessing how deep
- import "diamonds/Events.sol"; -> access to any event of your choice
