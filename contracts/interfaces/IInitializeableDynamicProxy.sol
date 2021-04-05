// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IInitializeableDynamicProxy {
    /**
        @notice It initializes a new dynamic proxy given a logic registry contract and a logic name.
        @param aLogicRegistryAddress the settings contract address.
        @param aLogicName the settings contract address.
        @param isStrictDynamic Boolean indicating if the proxy must check the registry for a new implementation.
     */
    function initialize(
        address aLogicRegistryAddress,
        bytes32 aLogicName,
        bool isStrictDynamic
    ) external;
}
