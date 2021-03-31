// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Commons
import "../../util/TellerCommon.sol";

// Interfaces
import "../SettingsInterface.sol";
import "../LendingPoolInterface.sol";
import "./ILoanTermsConsensus.sol";
import "../../providers/compound/CErc20Interface.sol";

/**
    Getting stack too deep issues and cannot get the proper
    struct as a return value from calling loans() externally.
    So we are just providing helpers here to get individual
    fields on a storage pointer of the loan by loanId.
 */
abstract contract ALoanStorage {
    /**
     * @notice Holds the data of all loans for the lending token.
     */
    mapping(uint256 => TellerCommon.Loan) public loans;

    function loanTerms(uint256 loanId)
        public
        view
        returns (TellerCommon.LoanTerms memory)
    {
        return loan(loanId).loanTerms;
    }

    function termsExpiry(uint256 loanId) public view returns (uint256) {
        return loan(loanId).termsExpiry;
    }

    function loanStartTime(uint256 loanId) public view returns (uint256) {
        return loan(loanId).loanStartTime;
    }

    function collateral(uint256 loanId) public view returns (uint256) {
        return loan(loanId).collateral;
    }

    function lastCollateralIn(uint256 loanId) public view returns (uint256) {
        return loan(loanId).lastCollateralIn;
    }

    function principalOwed(uint256 loanId) public view returns (uint256) {
        return loan(loanId).principalOwed;
    }

    function interestOwed(uint256 loanId) public view returns (uint256) {
        return loan(loanId).interestOwed;
    }

    function borrowedAmount(uint256 loanId) public view returns (uint256) {
        return loan(loanId).borrowedAmount;
    }

    function escrow(uint256 loanId) public view returns (address) {
        return loan(loanId).escrow;
    }

    function status(uint256 loanId)
        public
        view
        returns (TellerCommon.LoanStatus)
    {
        return loan(loanId).status;
    }

    function liquidated(uint256 loanId) public view returns (bool) {
        return loan(loanId).liquidated;
    }

    function loan(uint256 loanId)
        internal
        view
        returns (TellerCommon.Loan storage loan_)
    {
        loan_ = loans[loanId];
    }
}

/**
 * @notice This interface defines the functions to get and calculate information about loan data.
 *
 * @author develop@teller.finance
 */
interface ILoanStorage {
    /**
     * @notice Holds the total amount of collateral held by the contract.
     */
    function totalCollateral() external view returns (uint256);

    /**
     * @notice Holds the instance of the LendingPool used by the LoanManager.
     */
    function lendingPool() external view returns (LendingPoolInterface);

    /**
     * @notice Holds the lending token used for creating loans by the LoanManager and LendingPool.
     */
    function lendingToken() external view returns (address);

    /**
     * @notice Holds the collateral token.
     */
    function collateralToken() external view returns (address);

    /**
     * @notice Holds the Compound cToken where the underlying token matches the lending token.
     */
    function cToken() external view returns (CErc20Interface);

    /**
     * @notice Holds the ID of loans taken out
     * @dev Also the next available loan ID
     */
    function loanIDCounter() external view returns (uint256);
}
