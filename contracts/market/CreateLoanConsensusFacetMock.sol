// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { CreateLoanConsensusFacet } from "./CreateLoanConsensusFacet.sol";

// Storage
import { LoanRequest } from "../storage/market.sol";

contract CreateLoanConsensusFacetMock is CreateLoanConsensusFacet {
    
    /**
     * @notice it processes a loan terms by doing multiple checks on the LoanRequest request and LoanResponse[] responses
     * @param request LoanRequest is the borrower request object to take out a loan
     * @return interestRate the borrower needs to pay back
     * @return collateralRatio the ratio of collateral the borrower needs to put up for the loan with an underlying asset
     * @return maxLoanAmount the borrower is entitled for
     */
    function processLoanTerms(LoanRequest calldata request)
        internal
        virtual
        override
        returns (
            uint16 interestRate,
            uint16 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        interestRate = request.responses[0].interestRate;
        collateralRatio = request.responses[0].collateralRatio;
        maxLoanAmount = request.responses[0].maxLoanAmount;
    }
}
