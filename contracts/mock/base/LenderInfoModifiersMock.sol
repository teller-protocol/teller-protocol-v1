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

import "../../base/LenderInfo.sol";

/**
    This contract is created ONLY for testing purposes.
 */
contract LenderInfoModifiersMock is LenderInfo {
    
    /** State Variables */

    /** Connstructor */
    constructor(
        address zdaiAddress,
        address daiPoolAddress
    )
        public
        LenderInfo(zdaiAddress, daiPoolAddress)
    {}

    function _isZDai() isZDai(msg.sender) external {}

    function _isDaiPool() isDaiPool(msg.sender) external {}

    function _isValid(address anAddress) isValid(anAddress) external {}

}
