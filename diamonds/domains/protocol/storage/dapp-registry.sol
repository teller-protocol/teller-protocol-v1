// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { Dapp } from "../interfaces/IDappRegistry.sol";

// Libraries
import "../../../libraries/AddressArrayLib.sol";

abstract contract sto_DappRegistry_v1 {
    struct DappRegistryStorage {
        mapping(address => Dapp) dapps;
        AddressArrayLib.AddressArray list;
    }

    function dappStore() pure returns (DappRegistryStorage storage s) {
        bytes32 position = keccak256("teller_protocol.storage.dapp_registry");

        assembly {
            s.slot := position
        }
    }
}
