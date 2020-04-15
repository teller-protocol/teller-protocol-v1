// This is just to be used as a LendingPool template for the gnosis Mock Contracts, until the LendingPool contract
// is completed. At that point we can use that as the template
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Loans.sol";

contract LoansMock is Loans {

    constructor(address priceOracleAddress, address lendingPoolAddress)
        public
        Loans(priceOracleAddress, lendingPoolAddress) { }

    function setLoanIDCounter(uint256 newLoanIdCounter)
        external
    {
        loanIDCounter = newLoanIdCounter;
    }
}