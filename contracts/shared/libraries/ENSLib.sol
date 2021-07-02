// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Registry {
    function resolver(bytes32 node) external view returns (Resolver);
}

interface Resolver {
    function addr(bytes32 node) external view returns (address);
}

library ENS {
    bytes32 public constant ETH_NAMEHASH =
        0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae;

    function registryResolve(address registry, bytes32 node)
        internal
        view
        returns (address)
    {
        return Registry(registry).resolver(node).addr(node);
    }

    function resolve(address resolver, bytes32 node)
        internal
        view
        returns (address)
    {
        return Resolver(resolver).addr(node);
    }

    function namehash(string memory name)
        internal
        pure
        returns (bytes32 namehash_)
    {
        namehash_ = keccak256(
            abi.encodePacked(ETH_NAMEHASH, keccak256(abi.encodePacked(name)))
        );
    }

    function namehash(string memory name, string memory domain)
        internal
        pure
        returns (bytes32 namehash_)
    {
        namehash_ = keccak256(
            abi.encodePacked(namehash_, keccak256(abi.encodePacked(domain)))
        );
        namehash_ = keccak256(
            abi.encodePacked(namehash_, keccak256(abi.encodePacked(name)))
        );
    }

    function subnamehash(string memory subname, string memory name)
        internal
        pure
        returns (bytes32 namehash_)
    {
        namehash_ = keccak256(
            abi.encodePacked(ETH_NAMEHASH, keccak256(abi.encodePacked(name)))
        );
        namehash_ = keccak256(
            abi.encodePacked(namehash_, keccak256(abi.encodePacked(subname)))
        );
    }

    function subnamehash(string memory subname, bytes32 node)
        internal
        pure
        returns (bytes32 namehash_)
    {
        namehash_ = keccak256(
            abi.encodePacked(node, keccak256(abi.encodePacked(subname)))
        );
    }
}
