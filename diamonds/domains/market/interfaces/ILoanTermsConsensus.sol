// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/TellerCommon.sol";

/**
    @notice This interface defines the function to process the loan terms through the Teller protocol

    @author develop@teller.finance
 */
interface ILoanTermsConsensus {
    /**
        @notice Processes the loan request
        @param request Struct of the protocol loan request
        @param responses List of structs of the protocol loan responses
        @return uint256 Interest rate
        @return uint256 Collateral ratio
        @return uint256 Maximum loan amount
     */
    function processLoanTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses
    )
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        );
}
