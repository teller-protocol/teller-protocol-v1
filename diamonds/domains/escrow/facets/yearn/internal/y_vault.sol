// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../../interfaces/IVault.sol";
import "../../../data/escrow.sol";

abstract contract int_y_vault is int_y_vault_v1 {}

abstract contract int_y_vault_v1 is dat_Escrow {
    /**
        @notice Grabs the yVault address for a token from the asset settings
        @param tokenAddress The underlying token address for the associated yVault
        @return yVault instance
     */
    function _getYVault(address tokenAddress) internal view returns (IVault) {
        return
            IVault(
                IProtocol(PROTOCOL).assetSettings().getYVaultAddress(
                    tokenAddress
                )
            );
    }
}
