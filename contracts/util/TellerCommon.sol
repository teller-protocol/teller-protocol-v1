pragma solidity 0.5.17;

import "./NumbersList.sol";

/**
 * @dev Library of structs common across the Teller protocol
 *
 * @author develop@teller.finance
 */
library TellerCommon {
    enum LoanStatus {NonExistent, TermsSet, Active, Closed}

    /// @notice The amount of interest owed to a borrower
    struct AccruedInterest {
        /// @notice Total amount of accrued interest for a lender
        uint256 totalAccruedInterest;

        /// @notice The total amount of accrued interest claimed, but not yet withdrwan by the lender
        uint256 totalNotWithdrawn;

        /// @notice The timestamp at which accrued interest was last claimed by the lender
        uint256 timeLastAccrued;
    }

    /// @notice Represents a user signature
    struct Signature {
        /// @notice Nonce of the signer address used for authentication
        uint256 signerNonce;

        /// @notice The recovery identifier represented by the last byte of a ECDSA signature as an int
        uint8 v;

        /// @notice The random point x-coordinate of the signature respresented by the first 32 bytes of the generated ECDSA signature
        bytes32 r;

        /// @notice The signature proof represented by the second 32 bytes of the generated ECDSA signature
        bytes32 s;
    }

    /// @notice Consensus request object for accruing interest
    struct InterestRequest {
        /// @notice The wallet address of the associated lender
        address lender;

        /// @notice The address of the Teller consensus contract to which the request is being submitted
        address consensusAddress;

        /// @notice Nonce of the lender address used for authentication
        uint256 requestNonce;

        /// @notice The timestamp at which the interest accrual is being requested to start
        uint256 startTime;

        /// @notice The timestamp at which the interest accrual caluculation stops
        uint256 endTime;

        /// @notice The timestamp at which the request is submitted by the lender
        uint256 requestTime;
    }

    /// @notice Consensus response object for accruing interest
    struct InterestResponse {
        /// @notice The wallet address of the signer submitted the interest response of the submitted request
        address signer;

        
        address consensusAddress;
        uint256 responseTime;
        uint256 interest;
        Signature signature;
    }

    // Borrower request object to take out a loan
    struct LoanRequest {
        address payable borrower;
        address recipient;
        address consensusAddress;
        uint256 requestNonce;
        uint256 amount;
        uint256 duration;
        uint256 requestTime;
    }

    // Borrower response object to take out a loan
    struct LoanResponse {
        address signer;
        address consensusAddress;
        uint256 responseTime;
        uint256 interestRate;
        uint256 collateralRatio;
        uint256 maxLoanAmount;
        Signature signature;
    }

    // Represents loan terms based on consensus values
    struct AccruedLoanTerms {
        NumbersList.Values interestRate;
        NumbersList.Values collateralRatio;
        NumbersList.Values maxLoanAmount;
    }

    // Represents the terms of a loan based on the consensus of a LoanRequest
    struct LoanTerms {
        address payable borrower;
        address recipient;
        uint256 interestRate;
        uint256 collateralRatio;
        uint256 maxLoanAmount;
        uint256 duration;
    }

    // Data per borrow as struct
    struct Loan {
        uint256 id;
        LoanTerms loanTerms;
        uint256 termsExpiry;
        uint256 loanStartTime;
        uint256 collateral;
        uint256 lastCollateralIn;
        uint256 principalOwed;
        uint256 interestOwed;
        uint256 borrowedAmount;
        address escrow;
        LoanStatus status;
        bool liquidated;
    }

    /**
        @notice This struct represents the collateral information for a given loan.
        @param collateral the current collateral amount.
        @param neededInLendingTokens the collateral needed expressed in lending tokens.
        @param neededInCollateralTokens the collateral needed expressed in collateral tokens.
        @param moreCollateralRequired true if the given loan requires more collateral. Otherwise it is false.
     */
    struct LoanCollateralInfo {
        uint256 collateral;
        uint256 neededInLendingTokens;
        uint256 neededInCollateralTokens;
        bool moreCollateralRequired;
    }

    /**
        @notice This struct is used to get the current liquidation info for a given loan id.
        @param collateral the current collateral for the given loan.
        @param collateralInTokens the current collateral in lending tokenss.
        @param amountToLiquidate the needed amount to liquidate the loan (if the liquidable parameter is true).
        @param liquidable true if the loan is liquidable. Otherwise it is false.
     */
    struct LoanLiquidationInfo {
        uint256 collateral;
        uint256 collateralInTokens;
        uint256 amountToLiquidate;
        bool liquidable;
    }

    /**
        @notice This struct defines the dapp address and data to execute in the callDapp function.
        @dev It is executed using a delegatecall in the Escrow contract.
     */
    struct Dapp {
        bool exists;
        bool unsecured;
    }

    /**
        @notice This struct defines the dapp address and data to execute in the callDapp function.
        @dev It is executed using a delegatecall in the Escrow contract.
     */
    struct DappData {
        address location;
        bytes data;
    }

    /**
        @notice This struct defines a market in the platform.
        @dev It is used by the MarketFactory contract.
     */
    struct Market {
        address loans;
        address lenders;
        address lendingPool;
        address loanTermsConsensus;
        address interestConsensus;
        bool exists;
    }

    struct EscrowValue {
        uint256 valueInToken;
        uint256 valueInEth;
    }

    /**
        @notice This struct is used to register multiple logic versions in LogicVersionsRegistry contract.
     */
    struct LogicVersionRequest {
        address logic;
        bytes32 logicName;
    }
}
