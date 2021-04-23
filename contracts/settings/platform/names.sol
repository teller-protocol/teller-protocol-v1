// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
        @dev The setting name for the required subsmission settings.
        @dev This is the minimum percentage of node responses that will be required by the platform to either take out a loan, and to claim accrued interest. If the number of node responses are less than the ones specified here, the loan or accrued interest claim request will be rejected by the platform
     */
bytes32 constant REQUIRED_SUBMISSIONS_PERCENTAGE = keccak256(
    "RequiredSubmissionsPercentage"
);

/**
        @dev The setting name for the maximum tolerance settings.
        @dev This is the maximum tolerance for the values submitted (by nodes) when they are aggregated (average). It is used in the consensus mechanisms.
        @dev This is a percentage value with 2 decimal places.
            i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
            i.e. maximumTolerance of 0 => It means all the values submitted must be equals.
        @dev The max value is 100% => 10000
     */
bytes32 constant MAXIMUM_TOLERANCE = keccak256("MaximumTolerance");
/**
        @dev The setting name for the response expiry length settings.
        @dev This is the maximum time (in seconds) a node has to submit a response. After that time, the response is considered expired and will not be accepted by the protocol.
     */

bytes32 constant RESPONSE_EXPIRY_LENGTH = keccak256("ResponseExpiryLength");

/**
        @dev The setting name for the safety interval settings.
        @dev This is the minimum time you need to wait (in seconds) between the last time you deposit collateral and you take out the loan.
        @dev It is used to avoid potential attacks using Flash Loans (AAVE) or Flash Swaps (Uniswap V2).
     */
bytes32 constant SAFETY_INTERVAL = keccak256("SafetyInterval");

/**
        @dev The setting name for the term expiry time settings.
        @dev This represents the time (in seconds) that loan terms will be available after requesting them.
        @dev After this time, the loan terms will expire and the borrower will need to request it again.
     */
bytes32 constant TERMS_EXPIRY_TIME = keccak256("TermsExpiryTime");

/**
        @dev The setting name for the liquidation reward percent setting.
        @dev It represents the percentage value (with 2 decimal places) for the MAX liquidation reward.
            i.e. an ETH liquidation price at 5% is stored as 500
     */
bytes32 constant LIQUIDATE_REWARD_PERCENT = keccak256("LiquidateRewardPercent");

/**
        @dev The setting name for the maximum loan duration settings.
        @dev The maximum loan duration setting is defined in seconds. Loans will not be given for timespans larger than the one specified here.
     */
bytes32 constant MAXIMUM_LOAN_DURATION = keccak256("MaximumLoanDuration");

/**
        @dev The setting name for the request loan terms rate limit settings.
        @dev The request loan terms rate limit setting is defined in seconds.
     */
bytes32 constant REQUEST_LOAN_TERMS_RATE_LIMIT = keccak256(
    "RequestLoanTermsRateLimit"
);

/**
        @dev The setting name for the collateral buffer.
        @dev The collateral buffer is a safety buffer above the required collateral amount to liquidate a loan. It is required to ensure the loan does not get liquidated immediately after the loan is taken out if the value of the collateral asset deposited drops drastically.
        @dev It represents the percentage value (with 2 decimal places) of a collateral buffer.
            e.g.: collateral buffer at 100% is stored as 10000.
     */
bytes32 constant COLLATERAL_BUFFER = keccak256("CollateralBuffer");

/**
        @dev The setting name for the over collateralized buffer.
        @dev The over collateralized buffer is the minimum required collateral ratio in order for a loan to be taken out without an Escrow contract and for the funds to go to the borrower's EOA (external overridely owned account).
        @dev It represents the percentage value (with 2 decimal places) of a over collateralized buffer.
            e.g.: over collateralized buffer at 130% is stored as 13000.
     */
bytes32 constant OVER_COLLATERALIZED_BUFFER = keccak256(
    "OverCollateralizedBuffer"
);
