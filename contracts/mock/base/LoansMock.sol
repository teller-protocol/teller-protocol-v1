// This is just to be used as a DAIPool template for the gnosis Mock Contracts, until the DAIPool contract
// is completed. At that point we can use that as the template
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Loans.sol";

contract LoansMock is Loans {

    constructor(address priceOracleAddress, address daiPoolAddress)
        public
        Loans(priceOracleAddress, daiPoolAddress) { }

    function setLoanIDCounter(uint256 newLoanIdCounter)
        external
    {
        loanIDCounter = newLoanIdCounter;
    }
}