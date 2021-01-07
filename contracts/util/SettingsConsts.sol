pragma solidity 0.5.17;

// Libraries

// Commons

/**
    @notice This contract centralizes all the required constants for the settings.

    @author develop@teller.finance
 */
contract SettingsConsts {
    /** Constants */

    // It represents 100% with 2 decimal places.
    uint256 public constant ONE_HUNDRED_PERCENT = 10000;

    /**
        @notice The setting name for the required subsmission settings.
        @notice This is the minimum number of node responses that will be required by the platform to either take out a loan, and to claim accrued interest. If the number of node responses are less than the ones specified here, the loan or accrued interest claim request will be rejected by the platform
     */
    bytes32 public constant REQUIRED_SUBMISSIONS_SETTING = "RequiredSubmissions";
    /**
        @notice The setting name for the maximum tolerance settings.
        @notice This is the maximum tolerance for the values submitted (by nodes) when they are aggregated (average). It is used in the consensus mechanisms.
        @notice This is a percentage value with 2 decimal places.
            i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
            i.e. maximumTolerance of 0 => It means all the values submitted must be equals.        
        @dev The max value is 100% => 10000
     */
    bytes32 public constant MAXIMUM_TOLERANCE_SETTING = "MaximumTolerance";
    /**
        @notice The setting name for the response expiry length settings.
        @notice This is the maximum time (in seconds) a node has to submit a response. After that time, the response is considered expired and will not be accepted by the protocol.
     */
    bytes32 public constant RESPONSE_EXPIRY_LENGTH_SETTING = "ResponseExpiryLength";
    /**
        @notice The setting name for the safety interval settings.
        @notice This is the minimum time you need to wait (in seconds) between the last time you deposit collateral and you take out the loan.
        @notice It is used to avoid potential attacks using Flash Loans (AAVE) or Flash Swaps (Uniswap V2).
     */
    bytes32 public constant SAFETY_INTERVAL_SETTING = "SafetyInterval";
    /**
        @notice The setting name for the term expiry time settings.
        @notice This represents the time (in seconds) that loan terms will be available after requesting them.
        @notice After this time, the loan terms will expire and the borrower will need to request it again.
     */
    bytes32 public constant TERMS_EXPIRY_TIME_SETTING = "TermsExpiryTime";
    /**
        @notice The setting name for the liquidate ETH price settings.
        @notice It represents the percentage value (with 2 decimal places) to liquidate loans.
            i.e. an ETH liquidation price at 95% is stored as 9500
     */
    bytes32 public constant LIQUIDATE_ETH_PRICE_SETTING = "LiquidateEthPrice";
    /**
        @notice The setting name for the maximum loan duration settings.
        @notice The maximum loan duration setting is defined in seconds. Loans will not be given for timespans larger than the one specified here.
     */
    bytes32 public constant MAXIMUM_LOAN_DURATION_SETTING = "MaximumLoanDuration";
    /**
        @notice The setting name for the request loan terms rate limit settings.
        @notice The request loan terms rate limit setting is defined in seconds.
     */
    bytes32
        public constant REQUEST_LOAN_TERMS_RATE_LIMIT_SETTING = "RequestLoanTermsRateLimit";
    /**
        @notice The setting name for the collateral buffer.
        @notice The collateral buffer is a safety buffer above the required collateral amount to liquidate a loan. It is required to ensure the loan does not get liquidated immediately after the loan is taken out if the value of the collateral asset deposited drops drastically.
        @notice It represents the percentage value (with 2 decimal places) of a collateral buffer.
            e.g.: collateral buffer at 100% is stored as 10000.
     */
    bytes32 public constant COLLATERAL_BUFFER_SETTING = "CollateralBuffer";
    /**
        @notice The setting name for the over collateralized buffer.
        @notice The over collateralized buffer is the minimum required collateral ratio in order for a loan to be taken out without an Escrow contract and for the funds to go to the borrower's EOA (externally owned account).
        @notice It represents the percentage value (with 2 decimal places) of a over collateralized buffer.
            e.g.: over collateralized buffer at 130% is stored as 13000.
     */
    bytes32
        public constant OVER_COLLATERALIZED_BUFFER_SETTING = "OverCollateralizedBuffer";
    /**
        @notice The setting name for timelocking a platform setting value.
        @notice When a platform setting is updated, the timestamp is recorded and further modification of the setting value may only happen after the amount of time (denoted in seconds) passes specified by this setting value.
     */
    bytes32 public constant TIMELOCK_DURATION = "TimelockDuration";
}
