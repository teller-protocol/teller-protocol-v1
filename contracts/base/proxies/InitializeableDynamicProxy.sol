// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "./BaseDynamicProxy.sol";

// Interfaces
import "../../interfaces/IInitializeableDynamicProxy.sol";

import "hardhat/console.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract InitializeableDynamicProxy is
    IInitializeableDynamicProxy,
    BaseDynamicProxy
{
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
    ) public override {
        require(address(logicRegistry) == address(0), "PROXY_ALREADY_INIT");
        logicRegistry = LogicVersionsRegistryInterface(aLogicRegistryAddress);
        logicName = aLogicName;
        strictDynamic = isStrictDynamic;
        _updateImplementationStored();
    }
}
