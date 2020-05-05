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
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

// Commons
import "../util/AddressLib.sol";

// Interfaces

import "../interfaces/SettingsInterface.sol";


contract Settings is Pausable, Ownable, SettingsInterface {
    using AddressLib for address;

    /* State Variables */

    mapping(address => bool) public lendingPoolPaused;

    uint256 public requiredSubmissions;

    uint256 public maximumTolerance;

    /** Modifiers */

    /* Constructor */

    constructor(uint256 aRequiredSubmissions, uint256 aMaximumTolerance) public {
        requiredSubmissions = aRequiredSubmissions;
        maximumTolerance = aMaximumTolerance;
    }

    /** External Functions */

    function setRequiredSubmissions(uint256 newRequiredSubmissions)
        external
        onlyOwner()
        whenNotPaused()
    {
        require(requiredSubmissions != newRequiredSubmissions, "NEW_VALUE_REQUIRED");
        uint256 oldRequiredSubmissions = requiredSubmissions;
        requiredSubmissions = newRequiredSubmissions;

        emit RequiredSubmissionsUpdated(
            msg.sender,
            oldRequiredSubmissions,
            newRequiredSubmissions
        );
    }

    function setMaximumTolerance(uint256 newMaximumTolerance)
        external
        onlyOwner()
        whenNotPaused()
    {
        require(maximumTolerance != newMaximumTolerance, "NEW_VALUE_REQUIRED");
        uint256 oldMaximumTolerance = maximumTolerance;
        maximumTolerance = newMaximumTolerance;

        emit MaximumToleranceUpdated(
            msg.sender,
            oldMaximumTolerance,
            newMaximumTolerance
        );
    }

    function pauseLendingPool(address lendingPoolAddress)
        external
        onlyOwner()
        whenNotPaused()
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(!lendingPoolPaused[lendingPoolAddress], "LENDING_POOL_ALREADY_PAUSED");

        lendingPoolPaused[lendingPoolAddress] = true;

        emit LendingPoolPaused(msg.sender, lendingPoolAddress);
    }

    function unpauseLendingPool(address lendingPoolAddress)
        external
        onlyOwner()
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
