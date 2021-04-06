// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../../interfaces/PrizePoolInterface.sol";
import "../../../data/escrow.sol";

abstract contract int_p_pool_v1 is dat_Escrow {
    /** Internal Functions */
    /**
        @notice Grabs the Pool Together Prize Pool address for an token from the asset settings.
        @notice The pool underlying address must match the supplied token address.
        @param tokenAddress The token address to get the cToken for.
        @return PrizePool instance.
     */
    function _getPrizePool(address tokenAddress)
        internal
        view
        returns (PrizePoolInterface)
    {
        return
            PrizePoolInterface(
                IProtocol(PROTOCOL).assetSettings().getPrizePoolAddress(
                    tokenAddress
                )
            );
    }
}

abstract contract int_p_pool is int_p_pool_v1 {}
