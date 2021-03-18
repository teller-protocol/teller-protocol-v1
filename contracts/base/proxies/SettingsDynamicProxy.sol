pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

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
    ) public {
        logicRegistry = new LogicVersionsRegistry();
        logicRegistry.initialize(msg.sender, initialLogicVersions);

        logicName = logicRegistry.consts().SETTINGS_LOGIC_NAME();
        strictDynamic = false;
        _updateImplementationStored();
    }
}
