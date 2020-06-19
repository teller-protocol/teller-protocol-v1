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
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

// Commons
import "../util/AddressLib.sol";

// Interfaces

import "../interfaces/SettingsInterface.sol";


contract Settings is Pausable, SettingsInterface {
    using AddressLib for address;

    /** Constants */
    bytes32 public constant REQUIRED_SUBMISSIONS_SETTING = "RequiredSubmissions";
    bytes32 public constant MAXIMUM_TOLERANCE_SETTING = "MaximumTolerance";
    bytes32 public constant RESPONSE_EXPIRY_LENGTH_SETTING = "ResponseExpiryLength";
    bytes32 public constant SAFETY_INTERVAL_SETTING = "SafetyInterval";
    bytes32 public constant TERMS_EXPIRY_TIME_SETTING = "TermsExpiryTime";
    bytes32 public constant LIQUIDATE_ETH_PRICE_SETTING = "LiquidateEthPrice";

    /* State Variables */

    mapping(address => bool) public lendingPoolPaused;

    /**
        It represents the total number of submissions required for consensus on a value.
     */
    uint256 public requiredSubmissions;

    /**
        This is the maximum tolerance (a percentage) when the values submitted for the nodes are aggregated.
        It is used to calculate the collateral ratio, interest rate, and others.
 
        This is a percentage with 2 decimal places.
        i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
        i.e. maximumTolerance of 0 => It means all the values submitted must be equals.
     */
    uint256 public maximumTolerance;

    /**
        This is the maximum time (in seconds) a node has to submit a response. After that time, the response is considered expired.
     */
    uint256 public responseExpiryLength;

    /**
        This is the minimum time you need to wait (in seconds) between the last time you deposit collateral and you take out the loan.
        It is used to avoid potential attacks using Flash Loans (AAVE) or Flash Swaps (Uniswap V2).
     */
    uint256 public safetyInterval;

    /**
        This represents the time (in seconds) that loan terms will be available after requesting them.
        After this time, the loan terms will expire and the borrower will need to request it again. 
     */
    uint256 public termsExpiryTime;

    /**
        It represents the percentage value (with 2 decimal places) to liquidate loans.
        
        i.e. an ETH liquidation price at 95% is stored as 9500
     */
    uint256 public liquidateEthPrice;

    /** Modifiers */

    /* Constructor */

    constructor(
        uint256 aRequiredSubmissions,
        uint256 aMaximumTolerance,
        uint256 aResponseExpiryLength,
        uint256 aSafetyInterval,
        uint256 aTermsExpiryTime,
        uint256 aLiquidateEthPrice
    ) public {
        require(aRequiredSubmissions > 0, "MUST_PROVIDE_REQUIRED_SUBS");
        require(aResponseExpiryLength > 0, "MUST_PROVIDE_RESPONSE_EXP");
        require(aSafetyInterval > 0, "MUST_PROVIDE_SAFETY_INTERVAL");
        require(aTermsExpiryTime > 0, "MUST_PROVIDE_TERMS_EXPIRY");
        require(aLiquidateEthPrice > 0, "MUST_PROVIDE_ETH_PRICE");

        requiredSubmissions = aRequiredSubmissions;
        maximumTolerance = aMaximumTolerance;
        responseExpiryLength = aResponseExpiryLength;
        safetyInterval = aSafetyInterval;
        termsExpiryTime = aTermsExpiryTime;
        liquidateEthPrice = aLiquidateEthPrice;
    }

    /** External Functions */

    function setRequiredSubmissions(uint256 newRequiredSubmissions)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(requiredSubmissions != newRequiredSubmissions, "NEW_VALUE_REQUIRED");
        require(newRequiredSubmissions > 0, "MUST_PROVIDE_REQUIRED_SUBS");
        uint256 oldRequiredSubmissions = requiredSubmissions;
        requiredSubmissions = newRequiredSubmissions;

        emit SettingUpdated(
            REQUIRED_SUBMISSIONS_SETTING,
            msg.sender,
            oldRequiredSubmissions,
            newRequiredSubmissions
        );
    }

    function setMaximumTolerance(uint256 newMaximumTolerance)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(maximumTolerance != newMaximumTolerance, "NEW_VALUE_REQUIRED");
        uint256 oldMaximumTolerance = maximumTolerance;
        maximumTolerance = newMaximumTolerance;

        emit SettingUpdated(
            MAXIMUM_TOLERANCE_SETTING,
            msg.sender,
            oldMaximumTolerance,
            newMaximumTolerance
        );
    }

    function setResponseExpiryLength(uint256 newResponseExpiryLength)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(responseExpiryLength != newResponseExpiryLength, "NEW_VALUE_REQUIRED");
        require(newResponseExpiryLength > 0, "MUST_PROVIDE_RESPONSE_EXP");
        uint256 oldResponseExpiryLength = responseExpiryLength;
        responseExpiryLength = newResponseExpiryLength;

        emit SettingUpdated(
            RESPONSE_EXPIRY_LENGTH_SETTING,
            msg.sender,
            oldResponseExpiryLength,
            newResponseExpiryLength
        );
    }

    function setSafetyInterval(uint256 newSafetyInterval)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(safetyInterval != newSafetyInterval, "NEW_VALUE_REQUIRED");
        require(newSafetyInterval > 0, "MUST_PROVIDE_SAFETY_INTERVAL");
        uint256 oldSafetyInterval = safetyInterval;
        safetyInterval = newSafetyInterval;

        emit SettingUpdated(
            SAFETY_INTERVAL_SETTING,
            msg.sender,
            oldSafetyInterval,
            newSafetyInterval
        );
    }

    function setTermsExpiryTime(uint256 newTermsExpiryTime)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(termsExpiryTime != newTermsExpiryTime, "NEW_VALUE_REQUIRED");
        require(newTermsExpiryTime > 0, "MUST_PROVIDE_TERMS_EXPIRY");
        uint256 oldTermsExpiryTime = termsExpiryTime;
        termsExpiryTime = newTermsExpiryTime;

        emit SettingUpdated(
            TERMS_EXPIRY_TIME_SETTING,
            msg.sender,
            oldTermsExpiryTime,
            newTermsExpiryTime
        );
    }

    function setLiquidateEthPrice(uint256 newLiquidateEthPrice)
        external
        onlyPauser()
        whenNotPaused()
    {
        require(liquidateEthPrice != newLiquidateEthPrice, "NEW_VALUE_REQUIRED");
        require(newLiquidateEthPrice > 0, "MUST_PROVIDE_ETH_PRICE");
        uint256 oldLiquidateEthPrice = liquidateEthPrice;
        liquidateEthPrice = newLiquidateEthPrice;

        emit SettingUpdated(
            LIQUIDATE_ETH_PRICE_SETTING,
            msg.sender,
            oldLiquidateEthPrice,
            newLiquidateEthPrice
        );
    }

    function pauseLendingPool(address lendingPoolAddress)
        external
        onlyPauser()
        whenNotPaused()
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(!lendingPoolPaused[lendingPoolAddress], "LENDING_POOL_ALREADY_PAUSED");

        lendingPoolPaused[lendingPoolAddress] = true;

        emit LendingPoolPaused(msg.sender, lendingPoolAddress);
    }

    function unpauseLendingPool(address lendingPoolAddress)
        external
        onlyPauser()
        whenNotPaused()
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(lendingPoolPaused[lendingPoolAddress], "LENDING_POOL_IS_NOT_PAUSED");

        lendingPoolPaused[lendingPoolAddress] = false;

        emit LendingPoolUnpaused(msg.sender, lendingPoolAddress);
    }

    function isPaused() external view returns (bool) {
        return paused();
    }

    /** Internal functions */

    /** Private functions */
}
