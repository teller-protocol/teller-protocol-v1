// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20DynamicProxy {
    /**
     * @notice It creates a new dynamic proxy specific for the TToken given a logic registry contract and a logic name.
     * @param logicRegistryAddress the settings contract address.
     * @param aLogicName the settings contract address.
     */
    function initialize(address logicRegistryAddress, bytes32 aLogicName)
        external;
}
