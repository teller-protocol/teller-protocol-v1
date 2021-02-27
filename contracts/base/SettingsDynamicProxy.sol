pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./InitializeableDynamicProxy.sol";
import "./LogicVersionsRegistry.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract SettingsDynamicProxy is InitializeableDynamicProxy {
    /**
        @notice It creates the proxy used for the protocol settings.
        @dev Cannot be called twice due to the logic registry address check in InitializeableDynamicProxy.
        @param initialLogicVersions list of the logic versions to create.
     */
    function initializeLogicVersions(
        TellerCommon.LogicVersionRequest[] memory initialLogicVersions
    ) public {
        LogicVersionsRegistry logicRegistry = new LogicVersionsRegistry();
        logicRegistry.initialize(msg.sender, initialLogicVersions);

        _initialize(
            address(logicRegistry),
            logicRegistry.consts().SETTINGS_LOGIC_NAME()
        );
    }
}
