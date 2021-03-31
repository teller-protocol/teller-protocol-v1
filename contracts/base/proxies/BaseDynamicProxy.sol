// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "./BaseProxy.sol";
import "../upgradeable/DynamicUpgradeable.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
abstract contract BaseDynamicProxy is BaseProxy, DynamicUpgradeable {
    function _implementation()
        internal
        view
        override(DynamicUpgradeable, Proxy)
        returns (address)
    {
        return DynamicUpgradeable._implementation();
    }

    /**
     * @notice It is called by the OZ proxy contract before calling the internal _implementation() function.
     */
    function _beforeFallback() internal override {
        if (strictDynamic && _implementationBlockUpdated + 50 <= block.number) {
            address(this).delegatecall(
                abi.encodeWithSignature("_updateImplementationStored()")
            );
        }
    }
}
