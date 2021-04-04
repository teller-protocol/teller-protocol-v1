// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./accrue-interest.sol";
import "../interfaces/ITToken.sol";
import "../storage/lending-pool.sol";
import "../data/lending-pool.sol";
import "../../../providers/compound/CErc20Interface.sol";
import "../../../providers/compound/CompoundRatesLib.sol";

abstract contract int_exchangeRates_LendingPool_v1 is
    int_accrueInterest_LendingPool_v1,
    dat_LendingPool_v1
{
    using CompoundRatesLib for CErc20Interface;

    function _exchangeRate() internal view returns (uint256) {
        IERC20 tToken = IERC20(address(getLendingPool().tToken));
        uint256 supply = _getTotalSupplied();

        if (tToken.totalSupply() == 0) {
            return uint256(10)**uint256(EXCHANGE_RATE_DECIMALS);
        }

        return
            (supply * (uint256(10)**uint256(EXCHANGE_RATE_DECIMALS))) /
            tToken.totalSupply();
    }

    /**
        @notice It calculates the market state values across all markets.
        @notice Returns values that represent the global state across all markets.
        @return totalSupplied
        @return totalBorrowed
        @return totalRepaid
     */
    function _getMarketState()
        internal
        view
        returns (
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 totalRepaid
        )
    {
        totalSupplied = _getTotalSupplied();
        totalBorrowed = getLendingPool().totalBorrowed;
        totalRepaid = getLendingPool().totalRepaid;
    }

    /**
        @notice It calculates the total supply of the lending token across all markets.
        @return totalSupplied the total supply denoted in the lending token.
     */
    function _getTotalSupplied() internal view returns (uint256 totalSupplied) {
        ERC20 lendingToken = getLendingPool().lendingToken;
        totalSupplied =
            lendingToken.balanceOf(address(this)) +
            getLendingPool().totalBorrowed -
            getLendingPool().totalRepaid;

        CErc20Interface cToken = CErc20Interface(getLendingPool().cToken);

        if (address(cToken) != address(0)) {
            totalSupplied = totalSupplied.add(
                cToken.valueInUnderlying(cToken.balanceOf(address(this)))
            );
        }
    }
}
