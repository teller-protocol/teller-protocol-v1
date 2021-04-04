// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/AddressArrayLib.sol";

abstract contract sto_MarketRegistry {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    struct Layout {
        mapping(address => AddressArrayLib.AddressArray) markets;
        mapping(address => address) lendingPools;
        mapping(address => mapping(address => address)) loanManagers;
        mapping(address => mapping(address => bool)) loanManagerRegistry;
    }

    function getMarketRegistryStorage()
        internal
        pure
        returns (Layout storage l_)
    {
        bytes32 position = keccak256("teller_protocol.storage.market_registry");

        assembly {
            l_.slot := position
        }
    }
}
