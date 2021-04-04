// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../internal/y_vault.sol";

abstract contract ext_price_per_share is ext_price_per_share_v1 {}

abstract contract ext_price_per_share_v1 is int_y_vault {
    /**
        @notice Returns the price of the Vault's wrapped token, denominated in the unwrapped native token
        @notice Calculation is: nativeTokenBalance/yTokenTotalSupply,
            - nativeTokenBalance is the current balance of the native token (example DAI) in the Vault
            - yTokenTotalSupply is the total supply of the Vault's wrapped token (example yDAI)
        @param tokenAddress The address of the underlying token for the associated yVault
        @return The token price
     */
    function getPricePerFullShare(address tokenAddress)
        external
        view
        override
        returns (uint256)
    {
        IVault iVault = _getYVault(tokenAddress);
        return iVault.getPricePerFullShare();
    }
}
