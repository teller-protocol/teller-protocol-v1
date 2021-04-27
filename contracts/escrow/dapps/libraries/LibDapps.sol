// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAToken } from "../interfaces/IAToken.sol";
import { IAaveLendingPool } from "../interfaces/IAaveLendingPool.sol";
import {
    IAaveLendingPoolAddressesProvider
} from "../interfaces/IAaveLendingPoolAddressesProvider.sol";
import {
    IUniswapV2Router
} from "../../../shared/interfaces/IUniswapV2Router.sol";
import { IVault } from "../interfaces/IVault.sol";

// Libraries
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { MarketStorageLib, MarketStorage } from "../../../storage/market.sol";
import { AppStorageLib } from "../../../storage/app.sol";

library LibDapps {
    function s() internal pure returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    /**
        @notice Grabs the Aave lending pool instance from the Aave lending pool address provider
        @return IAaveLendingPool instance address
     */
    function getAaveLendingPool() internal view returns (IAaveLendingPool) {
        return
            IAaveLendingPool(
                IAaveLendingPoolAddressesProvider(
                    0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
                )
                    .getLendingPool()
            ); // LP address provider contract is immutable and the address will never change
    }

    /**
        @notice Grabs the aToken instance from the lending pool
        @param tokenAddress The underlying asset address to get the aToken for
        @return IAToken instance
     */
    function getAToken(address tokenAddress) internal view returns (IAToken) {
        return
            IAToken(
                getAaveLendingPool().getReserveData(tokenAddress).aTokenAddress
            );
    }

    /**
        @notice Grabs the yVault address for a token from the asset settings
        @param tokenAddress The underlying token address for the associated yVault
        @return yVault instance
     */
    function getYVault(address tokenAddress) internal view returns (IVault) {
        return
            IVault(
                AppStorageLib.store().assetSettings[tokenAddress].addresses[
                    keccak256("yVaultAddress")
                ]
            );
    }
}
