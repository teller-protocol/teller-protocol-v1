pragma solidity 0.5.17;

// Libraries

// Commons

/**
    @notice This contract centralizes all the required constants for the settings.

    @author develop@teller.finance
 */
contract SettingsConsts {

    /** Constants */

    /**
        @notice The setting name for the required subsmission settings.
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
        @notice This is the maximum time (in seconds) a node has to submit a response. After that time, the response is considered expired.
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
        @notice The maximum loan duration setting is defined in seconds.
     */
    bytes32 public constant MAXIMUM_LOAN_DURATION_SETTING = "MaximumLoanDuration";

}
