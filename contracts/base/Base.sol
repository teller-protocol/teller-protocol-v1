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
import "../util/AddressLib.sol";

// Commons
import "./Initializable.sol";

// Interfaces
import "../interfaces/SettingsInterface.sol";


contract Base is Initializable, ReentrancyGuard {
    using AddressLib for address;

    /* State Variables */

    SettingsInterface public settings;

    /** Modifiers */

    modifier whenNotPaused() {
        require(!_isPaused(), "PLATFORM_IS_PAUSED");
        _;
    }

    modifier whenLendingPoolNotPaused() {
        require(!_isPoolPaused(address(this)), "LENDING_POOL_IS_PAUSED");
        _;
    }

    modifier whenPaused() {
        require(_isPaused(), "PLATFORM_IS_NOT_PAUSED");
        _;
    }

    modifier whenLendingPoolPaused() {
        require(_isPoolPaused(address(this)), "LENDING_POOL_IS_NOT_PAUSED");
        _;
    }

    /* Constructor */

    /** External Functions */

    /** Internal functions */

    function _initialize(address settingsAddress) internal isNotInitialized() {
        settingsAddress.requireNotEmpty("SETTINGS_MUST_BE_PROVIDED");

        initialize();

        settings = SettingsInterface(settingsAddress);
    }

    function _isPoolPaused(address poolAddress) internal view returns (bool) {
        return settings.lendingPoolPaused(poolAddress);
    }

    function _isPaused() internal view returns (bool) {
        return settings.isPaused();
    }

    /** Private functions */
}
