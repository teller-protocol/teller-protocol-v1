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

import "../../base/Lenders.sol";

/**
    This contract is created ONLY for testing purposes.
 */
contract LendersMock is Lenders {
    
    /** State Variables */

    uint256 public currentBlockNumber;

    bool public addressesEqual;

    /** Constructor */
    constructor(
        address zTokenAddress,
        address lendingPoolAddress,
        address consensusAddress
    )
        public
        Lenders(zTokenAddress, lendingPoolAddress, consensusAddress)
    {
        addressesEqual = true;
    }

    function setAddressesEqual(bool value) external {
        addressesEqual = value;
    }

    function setCurrentBlockNumber(uint256 blockNumber) external {
        currentBlockNumber = blockNumber;
    }

    function _areAddressesEqual(address, address)
        internal
        view
        returns (bool)
    {
        return addressesEqual;
    }

    function externalGetCurrentBlockNumber()
        external
        view
        returns (uint256 blockNumber)
    {
        return currentBlockNumber;
    }

    function mockLenderInfo(
        address lender,
        uint256 blockLastAccrued,
        uint256 totalNotWithdrawn,
        uint256 totalAccruedInterest
    ) external {
        accruedInterest[lender].blockLastAccrued = blockLastAccrued;
        accruedInterest[lender].totalAccruedInterest = totalAccruedInterest;
        accruedInterest[lender].totalNotWithdrawn = totalNotWithdrawn;
    }

    function externalUpdateAccruedInterestFor(address lender)
        external
    {
        super._updateAccruedInterestFor(lender);
    }
}
