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

import "../../ZeroCollateral.sol";

/**
    This contract is created ONLY for testing purposes.
 */
contract ZeroCollateralMock is ZeroCollateralMain {
    
    constructor(
        address daiAddress,
        address zDaiAddress,
        address daoAddress
    )
        public
        ZeroCollateralMain(daiAddress, zDaiAddress, daoAddress) {
    }

    /**
        It mocks borrow info for a specific borrower address / borrow id. It is used ONLY for testing purposes.
     */
    function mockBorrowInfo(address borrower, uint256 borrowId) external {
        borrowerAccounts[borrower].lastBorrowId = borrowId;

        borrows[borrowId].active = true;
    }
}
