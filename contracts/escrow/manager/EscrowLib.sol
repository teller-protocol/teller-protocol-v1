// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./TransientContract.sol";

library EscrowLib {
    bytes public constant INIT_CODE = type(TransientContract).creationCode;
    bytes32 public constant INIT_CODE_HASH =
        keccak256(abi.encodePacked(INIT_CODE));

    struct Store {
        address asset;
    }

    function store() internal pure returns (Store storage s_) {
        bytes32 position = keccak256("EscrowStorage");
        assembly {
            s_.slot := position
        }
    }

    function getSalt(address manager, bool isPrimary)
        internal
        pure
        returns (bytes32)
    {
        bytes32 salt = bytes32(bytes20(manager));
        assembly {
            salt := or(salt, isPrimary)
        }
        return salt;
    }

    function getAssetEscrow(address manager, address asset)
        internal
        pure
        returns (address)
    {
        bytes32 salt;
        assembly {
            salt := or(shl(manager, 96), shr(asset, 64))
        }

        return getAddress(manager, salt);
    }

    function getMetamorphic(address manager, bool isPrimary)
        internal
        pure
        returns (address)
    {
        return getAddress(manager, getSalt(manager, isPrimary));
    }

    function getAddress(address manager, bytes32 salt)
        private
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
                                manager, // this contract will be the caller.
                                salt, // pass in the supplied salt value.
                                INIT_CODE_HASH // the init code hash.
                            )
                        )
                    )
                )
            );
    }
}
