// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "./BaseDynamicProxy.sol";
import "../LogicVersionsRegistry.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract SettingsDynamicProxy is BaseDynamicProxy {
    /**
        @notice It creates the LogicVersionsRegistry that will be used for the platform and create initial logic versions.
        @param initialLogicVersions list of the logic versions to create.
     */
    constructor(
        TellerCommon.CreateLogicVersionRequest[] memory initialLogicVersions
    ) {
        logicRegistry = new LogicVersionsRegistry();
        logicRegistry.initialize(msg.sender, initialLogicVersions);

        logicName = keccak256("Settings");
        strictDynamic = false;
        _updateImplementationStored();
    }
}
