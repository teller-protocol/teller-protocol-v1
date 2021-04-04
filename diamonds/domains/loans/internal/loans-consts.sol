// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract LoansConsts {
    // Loan length will be inputted in seconds.
    uint256 constant SECONDS_PER_YEAR = 31536000;

    /**
     * @notice Holds the logic name used for the LoanData contract.
     * @dev Is used to check the LogicVersionsRegistry for a new LoanData implementation.
     */
    bytes32 public constant LOAN_DATA_LOGIC_NAME = keccak256("LoanData");

    /**
     * @notice Holds the logic name used for the LoanTermsConsensus contract.
     * @dev Is used to check the LogicVersionsRegistry for a new LoanTermsConsensus implementation.
     */
    bytes32 public constant LOAN_TERMS_CONSENSUS_LOGIC_NAME =
        keccak256("LoanTermsConsensus");
}
