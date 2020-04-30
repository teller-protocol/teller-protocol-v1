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
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

// Commons

// Interfaces
import "../interfaces/SettingsInterface.sol";


contract Base is ReentrancyGuard {
    /* State Variables */

    SettingsInterface public settings;

    /** Modifiers */

    modifier whenNotPaused(address lendingPoolAddress) {
        require(
            !_isPaused() && !_isPoolPaused(lendingPoolAddress),
            "PLATFORM_OR_POOL_IS_PAUSED"
        );
        //require(, "LENDING_IS_PAUSED");
        _;
    }

    modifier whenPaused(address lendingPoolAddress) {
        require(
            _isPaused() || _isPoolPaused(lendingPoolAddress),
            "PLATFORM_OR_POOL_IS_NOT_PAUSED"
        );
        _;
    }

    /* Constructor */

    constructor(address settingsAddress) public {
        require(settingsAddress != address(0x0), "SETTIGNS_MUST_BE_PROVIDED");
        settings = SettingsInterface(settingsAddress);
    }

    /** External Functions */

    /** Internal functions */

    function _isPoolPaused(address poolAddress) internal view returns (bool) {
        return settings.lendingPoolPaused(poolAddress);
    }

    function _isPaused() internal view returns (bool) {
        return settings.isPaused();
    }

    /** Private functions */
}
