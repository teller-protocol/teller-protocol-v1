// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../interfaces/IAaveLendingPool.sol";

abstract contract int_aave_lending_pool is int_aave_lending_pool_v1 {}

abstract contract int_aave_lending_pool_v1 {
    /**
        @notice Grabs the Aave lending pool instance from the Aave lending pool address provider
        @return IAaveLendingPool instance address
     */
    function _getAaveLendingPool() internal view returns (IAaveLendingPool) {
        return
            IAaveLendingPool(
                IAaveLendingPoolAddressesProvider(
                    0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
                )
                    .getLendingPool()
            ); // LP address provider contract is immutable and the address will never change
    }
}
