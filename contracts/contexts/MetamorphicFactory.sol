// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
    Metamorphic Factory which can be used by any facet to deploy upgradeable contracts while keeping
    the same address.
    "Metamorphic Contract" refers to the instance, i.e. the storage and code currently at the address/
    "Implementation" refers to the logic contract's code which is copied by the metamorphic contract
    at its construction.
    "Creation Code" refers to the "bytecode" section of a compiled contract. This is the code which is
    executed at construction. This code is used when calculating the address of a CREATE2 contract.
    "Runtime Code" is the actual code at an address after it has been deployed. You can find an outline
    for it in the "deployedBytecode" section of a compiled contract. The runtime code is the literal
    `bytes memory` returned by the creation code at the end of the constructor. This code can't change. 
    A metamorphic contract's address is calculated using the CREATE2 formula.

    CREATE2 address calculation:
      creation code + the deployer contract's address + arbitrary salt.
    CREATE1 address calculation:
      deployer account's address + deployer account's number of contracts deployed.
 */
library MetamorphicFactory {
    bytes32 internal constant STORAGE_SLOT =
        keccak256("Teller/MetamorphicFactory#storage");

    struct Status {
        bool deployed;
        address implementation;
        uint256 version;
    }

    struct Storage {
        mapping(bytes32 => Status) morphs;
    }

    /**
        @dev See [0age's implementation](https://github.com/0age/metamorphic),
        featuring the best documentation I've ever seen.
     */
    bytes32 internal constant METAMORPHIC_CREATION_CODE =
        hex"5860208158601c335a63aaf10f428752fa158151803b80938091923cf3";

    bytes32 internal constant METAMORPHIC_CREATION_CODE_HASH =
        keccak256(abi.encodePacked(METAMORPHIC_CREATION_CODE));

    // bytes internal constant PRELUDE =
    // abi.encodePacked(
    // PUSH15 <this> CALLER XOR PUSH1 43 JUMPI PUSH20
    // bytes22(0x6e03212eb796dee588acdbbbd777d4e73318602b5773),
    // address(this), // <SELFDESTRUCT recipient>
    // bytes2(0xff5b) // SELFDESTRUCT JUMPDEST
    // );

    function s() internal pure returns (Storage storage s_) {
        bytes32 storageSlot = STORAGE_SLOT;
        assembly {
            s_.slot := storageSlot
        }
    }

    function getSalt(address self, bytes32 identifier)
        internal
        pure
        returns (bytes32 salt)
    {
        return identifier | bytes20(self);
    }

    function getAddress(address self, bytes32 salt)
        internal
        pure
        returns (address)
    {
        return
            address(
                uint160( // downcast to match the address type.
                    uint256( // convert to uint to truncate upper digits.
                        keccak256( // compute the CREATE2 hash using 4 inputs.
                            abi.encodePacked( // pack all inputs to the hash together.
                                hex"ff", // start with 0xff to distinguish from RLP.
                                self, // this contract will be the caller.
                                salt, // pass in the supplied salt value.
                                METAMORPHIC_CREATION_CODE_HASH // supply init code hash.
                            )
                        )
                    )
                )
            );
    }

    function getAddy(address self, bytes32 identifier)
        internal
        pure
        returns (address)
    {
        return getAddress(self, identifier);
    }

    /**
        A constructed metamorphic contract is deployed by a transient contract.
        In 0age's implementation he seems to use CREATE for the metamorphic contract and leave the
        CREATE2 to be used by the transient contract. Since the transient contract SELFDESTRUCT's
        after deploying the metamorphic one, the "contract deployment nonce" of the transient contract
        gets reset to 0 when they go for the next upgrade; this makes the address the same for both.
        The reasoning behind this is that creation code affects the final address when using CREATE2,
        so we need to use the transient contract's contract deployment statistics to ensure the same
        address is used.
        Immutable variables are only part of the runtime code of a contract. This means that only the
        final constructor's code is meaningful in a scenario where we are creating any sort of proxy
        for the metamorphic contract. I don't think it's pheasible to use immutable variables when
        proxying but there is an optimal model for proxying metamorphic contracts.
        The solution seems to be to forward the immutable variables from the proxy to the metamorphic
        contract as standardized calldata, which is relatively cheap.
     */
    function deployInitialized(
        bytes32 identifier,
        address implementation,
        uint256 value
    ) internal returns (address deployment) {
        Status storage morph = s().morphs[identifier];
        require(morph.implementation == address(0), "1");
        morph.implementation = implementation;
        address expected = getAddress(address(this), identifier);
        bytes32 salt = getSalt(address(this), identifier);

        assembly {
            deployment := create2(
                value,
                mload(METAMORPHIC_CREATION_CODE),
                add(METAMORPHIC_CREATION_CODE, 0x20),
                salt
            )
        }

        assert(expected == deployment);

        // _verifyPrelude(deployment);
    }

    // function _verifyPrelude(address deployment) private view {
    //     bytes memory runtimeHeader;

    //     assembly {
    //         /* solhint-disable no-inline-assembly */
    //         // set and update the pointer based on the size of the runtime header.
    //         runtimeHeader := mload(0x40)
    //         mstore(0x40, add(runtimeHeader, 0x60))

    //         // store the runtime code and length in memory.
    //         mstore(runtimeHeader, 44)
    //         extcodecopy(metamorphicContract, add(runtimeHeader, 0x20), 0, 44)
    //     } /* solhint-enable no-inline-assembly */

    //     // ensure that the contract's runtime code has the correct initial sequence.
    //     require(
    //         keccak256(abi.encodePacked(PRELUDE)) ==
    //             keccak256(abi.encodePacked(runtimeHeader)),
    //         "Deployed runtime code does not have the required prelude."
    //     );
    // }
}
