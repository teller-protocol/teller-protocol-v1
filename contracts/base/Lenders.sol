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

// Libraries
import "../util/AddressLib.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// Commons
import "../util/ZeroCollateralCommon.sol";

// Interfaces
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LendersInterface.sol";
import "../interfaces/ZDAIInterface.sol";


contract Lenders is LendersInterface {
    using AddressLib for address;
    using SafeMath for uint256;

    /* State Variables */

    // last block number of accrued interest
    uint256 public blockAccruedInterest;

    LendingPoolInterface public lendingPool;

    ZDAIInterface public zdai;

    // array of all lending accounts
    mapping(address => ZeroCollateralCommon.LendAccount) public lenderAccounts;

    /** Modifiers */

    modifier isZDai(address anAddress) {
        require(
            areAddressesEqual(address(zdai), anAddress),
            "Address has no permissions."
        );
        _;
    }

    modifier isLendingPool(address anAddress) {
        require(
            areAddressesEqual(address(lendingPool), anAddress),
            "Address has no permissions."
        );
        _;
    }

    modifier isValid(address anAddress) {
        anAddress.requireNotEmpty("Address is required.");
        _;
    }

    /* Constructor */

    constructor(address zdaiAddress, address lendingPoolAddress) public {
        require(zdaiAddress != address(0x0), "ZDai address is required.");
        require(lendingPoolAddress != address(0x0), "LendingPool address is required");
        zdai = ZDAIInterface(zdaiAddress);
        lendingPool = LendingPoolInterface(lendingPoolAddress);
        blockAccruedInterest = block.number;
    }

    /** External Functions */

    function zDaiTransfer(address sender, address recipient, uint256)
        external
        isZDai(msg.sender)
    {
        // Updating accrued interest for zDAI sender.
        updateAccruedInterestFor(sender);

        // Updating accrued interest for zDAI recipient.
        updateAccruedInterestFor(recipient);
    }

    function zDaiMinted(address recipient, uint256) external isLendingPool(msg.sender) {
        // Updating accrued interest for zDAI recipient.
        updateAccruedInterestFor(recipient);
    }

    function zDaiBurnt(address recipient, uint256) external isLendingPool(msg.sender) {
        // Updating accrued interest for zDAI recipient.
        updateAccruedInterestFor(recipient);
    }

    function withdrawInterest(address recipient, uint256 amount)
        external
        isLendingPool(msg.sender)
        isValid(recipient)
        returns (uint256)
    {
        // Updating accrued interest for recipient.
        updateAccruedInterestFor(recipient);

        uint256 amountToWithdraw = amount;
        uint256 accruedInterest = lenderAccounts[recipient].totalAccruedInterest;

        if (accruedInterest >= amountToWithdraw) {
            lenderAccounts[recipient].totalAccruedInterest = accruedInterest.sub(
                amountToWithdraw
            );
        } else {
            amountToWithdraw = lenderAccounts[recipient].totalAccruedInterest;
            lenderAccounts[recipient].totalAccruedInterest = 0;
        }

        emit AccruedInterestWithdrawn(recipient, amountToWithdraw);

        return amountToWithdraw;
    }

    function getCurrentBlockNumber() external view returns (uint256) {
        return block.number;
    }

    /** Internal Functions */

    /**
        @notice Updates the accrued interest for a specific lender.
        @param lender address.
        @return the updated accrued intereset for the lender address.
     */
    function updateAccruedInterestFor(address lender) internal returns (uint256) {
        // Get last block accrued
        uint256 previousBlockAccruedInterest = lenderAccounts[lender].lastBlockAccrued;
        uint256 currentBlockNumber = this.getCurrentBlockNumber();

        // Update last block accrued.
        lenderAccounts[lender].lastBlockAccrued = currentBlockNumber;

        // Update total accrued interest.
        lenderAccounts[lender].totalAccruedInterest = calculateNewAccruedInterestFor(
            lenderAccounts[lender].totalAccruedInterest,
            previousBlockAccruedInterest,
            currentBlockNumber,
            getZDaiBalanceOf(lender)
        );

        emit AccruedInterestUpdated(
            lender,
            lenderAccounts[lender].lastBlockAccrued,
            lenderAccounts[lender].totalAccruedInterest
        );

        return lenderAccounts[lender].totalAccruedInterest;
    }

    function calculateNewAccruedInterestFor(
        uint256 currentAccruedInterest,
        uint256 previousBlockAccruedInterest,
        uint256 currentBlockNumber,
        uint256 currentZDaiBalance
    ) internal pure returns (uint256) {
        uint256 blocksDifference = currentBlockNumber.sub(previousBlockAccruedInterest);
        return currentAccruedInterest.add(blocksDifference.mul(currentZDaiBalance));
    }

    function areAddressesEqual(address leftAddress, address rightAddress)
        internal
        view
        returns (bool)
    {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return leftAddress.isEqualTo(rightAddress);
    }

    /** Private Functions */

    function getZDaiBalanceOf(address anAddress) private view returns (uint256) {
        return zdai.balanceOf(anAddress);
    }
}
