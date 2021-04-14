// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../shared/libraries/AddressArrayLib.sol";
import { MarketStorageLib, MarketStorage } from "../../storage/market.sol";
import { AppStorageLib } from "../../storage/app.sol";
import { IAToken } from "../interfaces/IAToken.sol";
import { IAaveLendingPool } from "../interfaces/IAaveLendingPool.sol";
import {
    IAaveLendingPoolAddressesProvider
} from "../interfaces/IAaveLendingPoolAddressesProvider.sol";
import { PrizePoolInterface } from "../interfaces/PrizePoolInterface.sol";
import "../../storage/app.sol";

library LibDapps {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    function marketStore() private pure returns (MarketStorage storage) {
        return MarketStorageLib.marketStore();
    }

    /**
     * @notice Adds or removes tokens held by the Escrow contract
     * @param tokenAddress The token address to be added or removed
     */
    function tokenUpdated(uint256 loanID, address tokenAddress) internal {
        require(marketStore().escrows[loanID] != address(0), "NO_ESCROW");
        address escrow = marketStore().escrows[loanID];
        (bool found, uint256 index) =
            marketStore().escrowTokens[escrow].getIndex(tokenAddress);
        if (balanceOf(loanID, tokenAddress) > 0) {
            if (!found) {
                marketStore().escrowTokens[escrow].add(tokenAddress);
            }
        } else if (found) {
            marketStore().escrowTokens[escrow].remove(index);
        }
    }

    function balanceOf(uint256 loanID, address token)
        internal
        view
        returns (uint256)
    {
        address escrow = marketStore().escrows[loanID];
        return IERC20(token).balanceOf(escrow);
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
        @notice Grabs the Pool Together Prize Pool address for an token from the asset settings.
        @notice The pool underlying address must match the supplied token address.
        @param tokenAddress The token address to get the cToken for.
        @return PrizePool instance.
     */
    function getPrizePool(address tokenAddress)
        internal
        view
        returns (PrizePoolInterface)
    {
        return
            PrizePoolInterface(
                AppStorageLib.store().assetSettings[tokenAddress].addresses[
                    keccak256("PrizePoolTogether")
                ]
            );
    }

    /**
        @notice Grabs the controlled ticket token address for the prize pool
        @notice The pool underlying address must match the supplied token address.
        @param tokenAddress The token address to get the cToken for.
        @return The address of the ticket token contract.
    */
    function getTicketAddress(address tokenAddress)
        internal
        view
        returns (address)
    {
        return getPrizePool(tokenAddress).tokens()[1];
    }
}
