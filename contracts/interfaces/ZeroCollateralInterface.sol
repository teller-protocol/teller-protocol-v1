/*
    Copyright 2020 Fabrx Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";

/**
 * @title ZeroCollateralMain
 * @author Fabrx Labs Inc.
 *
 * Zero Collateral Main Contract
 *
 * Values of borrows are dictated in 2 decimals. All other values dictated in DAI (18 decimals).
 */

contract ZeroCollateralInterface {

    // event on redemption of interest
    event Redeemed(address indexed lenderAccount, uint256 amount);

    // collateral deposited by borrower
    event CollateralDeposited(address indexed borrower, uint256 amount);

    // collateral withdrawn by borrower
    event CollateralWithdrawn(address indexed borrower, uint256 amount);

    // borrow event initiated
    event BorrowInitiated(address indexed borrower, ZeroCollateralCommon.Borrow borrow);

    /**
        It sets info for a specific borrow (identified by id). It is used ONLY for testing purposes.
     */
    function setBorrowerAccountInfo(
        address borrower,
        uint256 maxLoan,
        uint8 interestRate,
        uint8 collateralNeeded
    ) external;

    function hasActiveBorrow(address borrower)
        external
        view
        returns(bool);

    // borrower deposit collateral
    // change to ETH - deposit ETH and keep track of how much ETH they have
    // if the current price changes and they're undercollateralised -> problem
    function depositCollateralBorrower() external payable;

    // NEW FUNCTION - get current state of collateral/loan - is it undercollateralised by x%?

    // borrower withdraw collateral
    // liquidate -> anything undercollateralised or expired gets liquidated
    // then checks there's a outstanding borrow live
    // can withdraw collateral down to a certain percentage if there's still outstanding borrow
    function withdrawCollateralBorrower(uint256 amount) external;

    // liquidate unpaid borrows
    // now to encorporate the actual price of ETH - is the loan undercollateralised or expired
    // currently it just checks if it is expired
    // remove nonredeemable collateral
    function liquidate(address borrower) external;

    // calculates whether they have enough collateral to withdraw amount of DAI
    // function createBorrow(uint256 amountBorrow, uint256 numberDays) external returns (bool);
    
    function getTotalCollateral(address borrower) external view returns (uint256);

    // paying back an amount of DAI - doesn't have to be all of it
    // updates the borrow itself
    function repayBorrow(uint256 amountRepay) external returns(uint256);
}