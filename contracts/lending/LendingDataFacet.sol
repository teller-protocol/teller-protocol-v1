// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { LendingLib } from "./libraries/LendingLib.sol";

contract LendingDataFacet {
    /**
     * @notice Gets the address for the {asset} Teller token.
     * @param asset Lending asset address.
     * @return value_ Current Teller token value for the {asset} lending pool.
     */
    function getTToken(address asset) external returns (address tToken_) {
        tToken_ = LendingLib.s(asset).tToken;
    }

    /**
     * @notice Calculates the Teller token value for the {asset} lending pool _current_ exchange rate.
     * @dev This is NOT a view function because interest is accrued.
     * @param asset Lending asset address.
     * @param assetAmount Amount of {asset}.
     * @return value_ Current Teller token value for the {asset} lending pool.
     */
    function getTTokenValue(address asset, uint256 assetAmount)
        external
        returns (uint256 value_)
    {
        value_ = LendingLib.tTokenValue(
            assetAmount,
            LendingLib.exchangeRateCurrent(asset)
        );
    }

    /**
     * @notice Calculates the lending {asset} amount for it's lending pool's Teller token _current_ exchange rate.
     * @dev This is NOT a view function because interest is accrued.
     * @param asset Lending asset address.
     * @param tTokenAmount Amount of {asset}.
     * @return value_ Current Teller token value for the {asset} lending pool.
     */
    function getLendingAssetValue(address asset, uint256 tTokenAmount)
        external
        returns (uint256 value_)
    {
        value_ = LendingLib.assetValue(
            tTokenAmount,
            LendingLib.exchangeRateCurrent(asset)
        );
    }

    /**
     * @notice Calculates the lending exchange rate of Teller tokens to lending {asset}.
     * @dev This is may be a costly on-chain view function. See {LendingLib.exchangeRate}
     * @param asset Lending asset address.
     * @return rate_ Exchange rate for the {asset} Teller token.
     */
    function getLendingExchangeRate(address asset)
        external
        view
        returns (uint256 rate_)
    {
        rate_ = LendingLib.exchangeRate(asset);
    }

    /**
     * @notice Calculates the _current_ lending exchange rate of Teller tokens to lending {asset}.
     * @dev This is NOT a view function because interest is accrued.
     * @param asset Lending asset address.
     * @return rate_ Current exchange rate after interest is accrued for the {asset} Teller token.
     */
    function getLendingExchangeRateCurrent(address asset)
        external
        returns (uint256 rate_)
    {
        rate_ = LendingLib.exchangeRateCurrent(asset);
    }

    /**
     * @notice Calculates the total supplied value for the {asset} lending pool.
     * @dev This is may be a costly on-chain view function. See {LendingLib.totalSupplied}
     * @param asset Lending asset address.
     * @return supplied_ Total value in {asset} held by the lending pool.
     */
    function getLendingTotalSupplied(address asset)
        external
        view
        returns (uint256 supplied_)
    {
        supplied_ = LendingLib.totalSupplied(asset);
    }

    /**
     * @notice Calculates the _current_ interest earned for a {lender} in the {asset} lending pool.
     * @param asset Lending asset address.
     * @param lender Lender address.
     * @return interest_ Current interest earned after it has been accrued.
     */
    function getLenderInterestEarned(address asset, address lender)
        external
        returns (uint256 interest_)
    {
        interest_ = LendingLib.lenderInterestEarned(
            asset,
            LendingLib.exchangeRateCurrent(asset),
            lender
        );
    }

    /**
     * @notice Returns the total amount borrowed since the beginning.
     * @param asset Lending asset address.
     * @return borrowed_ Total amount borrowed.
     */
    function getTotalBorrowed(address asset)
        external
        returns (uint256 borrowed_)
    {
        borrowed_ = LendingLib.s(asset).totalBorrowed;
    }

    /**
     * @notice Returns the total amount repaid since the beginning.
     * @param asset Lending asset address.
     * @return repaid_ Total amount repaid.
     */
    function getTotalRepaid(address asset) external returns (uint256 repaid_) {
        repaid_ = LendingLib.s(asset).totalRepaid;
    }

    /**
     * @notice Returns the total interest earned since the beginning.
     * @param asset Lending asset address.
     * @return interest_ Current interest earned after it has been accrued.
     */
    function getTotalInterestEarned(address asset)
        external
        returns (uint256 interest_)
    {
        interest_ = LendingLib.s(asset).totalInterestEarned;
    }
}
