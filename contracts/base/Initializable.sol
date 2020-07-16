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

// Commons

// Interfaces

contract Initializable {
    /* State Variables */

    bool private _isInitialized;

    /** Modifiers */

    modifier isNotInitialized() {
        require(!_isInitialized, "CONTRACT_ALREADY_INITIALIZED");
        _;
    }

    modifier isInitialized() {
        require(_isInitialized, "CONTRACT_NOT_INITIALIZED");
        _;
    }

    /* Constructor */

    /** External Functions */

    function initialized() external view returns (bool) {
        return _isInitialized;
    }

    /** Internal functions */

    function _initialize() internal {
        _isInitialized = true;
    }

    /** Private functions */
}
