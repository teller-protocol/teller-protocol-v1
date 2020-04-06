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
contract LenderInfoMock is LenderInfo {
    
    /** State Variables */

    uint256 public currentBlockNumber;

    bool public addressesEqual;

    /** Connstructor */
    constructor(
        address zdaiAddress,
        address daiPoolAddress
    )
        public
        LenderInfo(zdaiAddress, daiPoolAddress)
    {
        addressesEqual = true;
    }

    function setAddressesEqual(bool value) external {
        addressesEqual = value;
    }

    function setCurrentBlockNumber(uint256 blockNumber) external {
        currentBlockNumber = blockNumber;
    }

    function areAddressesEqual(address, address)
        internal
        view
        returns (bool)
    {
        return addressesEqual;
    }

    function getCurrentBlockNumber()
        external
        view
        returns (uint256 blockNumber)
    {
        return currentBlockNumber;
    }

    function mockLenderInfo(address lender, uint256 lastBlockAccrued, uint256 totalAccruedInterest) external {
        lenderAccounts[lender].lastBlockAccrued = lastBlockAccrued;
        lenderAccounts[lender].totalAccruedInterest = totalAccruedInterest;
    }

    function externalUpdateAccruedInterestFor(address lender)
        external
        returns (uint256)
    {
        return super.updateAccruedInterestFor(lender);
    }

    /**
        It mocks borrow info for a specific borrower address / borrow id. It is used ONLY for testing purposes.
     */
    function externalCalculateNewAccruedInterestFor(
        uint256 currentAccruedInterest,
        uint256 previousBlockAccruedInterest,
        uint256 blockNumber,
        uint256 currentZDaiBalance
    )
        external 
        pure
        returns (uint256 newAccruedInterest)
    {
        return super.calculateNewAccruedInterestFor(
            currentAccruedInterest,
            previousBlockAccruedInterest,
            blockNumber,
            currentZDaiBalance
        );
    }
}
