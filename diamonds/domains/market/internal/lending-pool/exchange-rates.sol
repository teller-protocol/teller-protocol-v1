// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./accrue-interest.sol";
import "../../interfaces/ITToken.sol";

abstract contract int_exchangeRates_LendingPool_v1 is
    int_accrueInterest_LendingPool_v1
{
    /**
        @notice It calculates the current exchange rate for the TToken based on the total supply of the lending token.
        @dev This will accrue interest for us before we calculate anything.
        @return the exchange rate for 1 TToken to the underlying token.
     */
    function _exchangeRateCurrent() internal returns (uint256) {
        _accrueInterest();
        return _exchangeRateStored();
    }

    /**
        @notice It calculates the exchange rate for the TToken based on the total supply of the lending token.
        @dev If the lending token is deposited into Compound the value calculated uses the exchangeRateStored value.
        @dev If the intended use case is for the current exchange rate, call the _exchangeRateCurrent function above.
        @return the exchange rate for 1 TToken to the underlying token.
     */
    function _exchangeRateStored() internal view returns (uint256) {
        return _exchangeRateForSupply(_getTotalSupplied());
    }

    function _exchangeRateForSupply(uint256 supply)
        internal
        view
        returns (uint256)
    {
        if (ITToken(address(tToken)).totalSupply() == 0) {
            return uint256(10)**uint256(EXCHANGE_RATE_DECIMALS);
        }

        return
            supply.mul(uint256(10)**uint256(EXCHANGE_RATE_DECIMALS)).div(
                IERC20(address(tToken)).totalSupply()
            );
    }

    /**
        @notice It calculates the market state values across all markets.
        @notice Returns values that represent the global state across all markets.
        @return totalSupplied
        @return totalBorrowed
        @return totalRepaid
        @return totalOnLoan
     */
    function _getMarketState()
        internal
        view
        returns (
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 totalRepaid,
            uint256 totalOnLoan
        )
    {
        totalSupplied = _getTotalSupplied();
        totalBorrowed = _totalBorrowed;
        totalRepaid = _totalRepaid;
        totalOnLoan = _totalBorrowed.sub(totalRepaid);
    }

    /**
        @notice It calculates the total supply of the lending token across all markets.
        @return totalSupplied the total supply denoted in the lending token.
     */
    function _getTotalSupplied() internal view returns (uint256 totalSupplied) {
        totalSupplied = lendingToken.balanceOf(address(this)).add(
            _totalBorrowed.sub(_totalRepaid)
        );

        if (address(cToken) != address(0)) {
            totalSupplied = totalSupplied.add(
                cToken.valueInUnderlying(cToken.balanceOf(address(this)))
            );
        }
    }
}
