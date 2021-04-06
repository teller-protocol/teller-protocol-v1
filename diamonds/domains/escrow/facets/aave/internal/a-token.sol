// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../../interfaces/IAToken.sol";
import "./aave-lending-pool.sol";

abstract contract int_a_token_v1 is int_aave_lending_pool {
    /**
        @notice Grabs the aToken instance from the lending pool
        @param tokenAddress The underlying asset address to get the aToken for
        @return IAToken instance
     */
    function _getAToken(address tokenAddress) internal view returns (IAToken) {
        return
            IAToken(
                _getAaveLendingPool().getReserveData(tokenAddress).aTokenAddress
            );
    }
}

abstract contract int_a_token is int_a_token_v1 {}
