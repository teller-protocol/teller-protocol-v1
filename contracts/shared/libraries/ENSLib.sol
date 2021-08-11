// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    ENSRegistry
} from "@ensdomains/ens-contracts/contracts/registry/ENSRegistry.sol";
import {
    PublicResolver
} from "@ensdomains/ens-contracts/contracts/resolvers/PublicResolver.sol";

library ENS {
    bytes32 public constant ETH_NAMEHASH =
        0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;

    function registryResolve(address registry, bytes32 node)
        internal
        view
        returns (address)
    {
        return resolve(resolver(registry, node), node);
    }

    function resolve(address resolver, bytes32 node)
        internal
        view
        returns (address)
    {
        return PublicResolver(resolver).addr(node);
    }

    function resolver(address registry, bytes32 node)
        internal
        view
        returns (address)
    {
        return ENSRegistry(registry).resolver(node);
    }

    function subnode(string memory name, bytes32 node)
        internal
        pure
        returns (bytes32 namehash_)
    {
        namehash_ = subnode(keccak256(abi.encodePacked(name)), node);
    }

    function subnode(bytes32 label, bytes32 node)
        internal
        pure
        returns (bytes32 namehash_)
    {
        namehash_ = keccak256(abi.encodePacked(node, label));
    }
}
