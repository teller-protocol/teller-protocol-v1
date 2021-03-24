pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./BaseProxy.sol";
import "../upgradeable/DynamicUpgradeable.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract BaseDynamicProxy is BaseProxy, DynamicUpgradeable {

}
