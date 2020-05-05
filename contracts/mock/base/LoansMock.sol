// This is just to be used as a LendingPool template for the gnosis Mock Contracts, until the LendingPool contract
// is completed. At that point we can use that as the template
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Loans.sol";

contract LoansMock is Loans {

    constructor(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        uint256 safetyInterval
    ) public Loans(
        priceOracleAddress,
        lendingPoolAddress,
        loanTermsConsensusAddress,
        safetyInterval
    ) { }

    function setLoanIDCounter(uint256 newLoanIdCounter)
        external
    {
        loanIDCounter = newLoanIdCounter;
    }
}