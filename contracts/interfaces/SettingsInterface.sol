pragma solidity 0.5.17;


/**
    @notice This interface defines all function to manage the platform configuration.

    @author develop@teller.finance
 */
interface SettingsInterface {
    /**
        @notice This event is emitted when a setting is updated.
        @param settingName setting name updated.
        @param sender address that updated it.
        @param oldValue old value for the setting.
        @param newValue new value for the setting.
     */
    event SettingUpdated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 oldValue,
        uint256 newValue
    );

    /**
        @notice This event is emitted when a lending pool is paused.
        @param account address that paused the lending pool.
        @param lendingPoolAddress lending pool address which was paused.
     */
    event LendingPoolPaused(address indexed account, address indexed lendingPoolAddress);

    /**
        @notice This event is emitted when a lending pool is unpaused.
        @param account address that paused the lending pool.
        @param lendingPoolAddress lending pool address which was unpaused.
     */
    event LendingPoolUnpaused(
        address indexed account,
        address indexed lendingPoolAddress
    );

    /**
        @notice Gets the required responses to process consensus values.
        @return the required submissions value.
     */
    function requiredSubmissions() external view returns (uint256);

    /**
        @notice Sets the required responses to process consensus values.
        @param newRequiredSubmissions the new required submissions value.
     */
    function setRequiredSubmissions(uint256 newRequiredSubmissions) external;

    /**
        @notice This is the maximum tolerance for the values submitted (by nodes) when they are aggregated (average). It is used in the consensus mechanisms.
        @notice This is a percentage value with 2 decimal places.
            i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
            i.e. maximumTolerance of 0 => It means all the values submitted must be equals.        
        @dev The max value is 100% => 10000
        @return the current maximum tolerance value.
     */
    function maximumTolerance() external view returns (uint256);

    /**
        @notice Sets a new value for maximum tolerance setting.
        @param newMaximumTolerance new maximum tolerance value.
     */
    function setMaximumTolerance(uint256 newMaximumTolerance) external;

    /**
        @notice This is the maximum time (in seconds) a node has to submit a response. After that time, the response is considered expired.
        @return the current expiry length value.
     */
    function responseExpiryLength() external view returns (uint256);

    /**
        @notice Sets a new value for the response expiry length setting.
        @param newResponseExpiryLength new response expiry length value.
     */
    function setResponseExpiryLength(uint256 newResponseExpiryLength) external;

    /**
        @notice This is the minimum time you need to wait (in seconds) between the last time you deposit collateral and you take out the loan.
        @notice It is used to avoid potential attacks using Flash Loans (AAVE) or Flash Swaps (Uniswap V2).
        @return the current safety interval value.
     */
    function safetyInterval() external view returns (uint256);

    /**
        @notice Sets a new value for the safety interval setting.
        @param newSafetyInterval new safety interval value.
    */
    function setSafetyInterval(uint256 newSafetyInterval) external;

    /**
        @notice This represents the time (in seconds) that loan terms will be available after requesting them.
        @notice After this time, the loan terms will expire and the borrower will need to request it again.
        @return the current terms expiry time.
     */
    function termsExpiryTime() external view returns (uint256);

    /**
        @notice Sets a new value for the terms expiry time setting.
        @param newTermsExpiryTime new terms expiry time value.
    */
    function setTermsExpiryTime(uint256 newTermsExpiryTime) external;

    /**
        @notice It represents the percentage value (with 2 decimal places) to liquidate loans.
            i.e. an ETH liquidation price at 95% is stored as 9500
        @return the current liquidate ETH price.
     */
    function liquidateEthPrice() external view returns (uint256);

    /**
        @notice Gets current maximum loan duration setting (in seconds).
        @return the current maximum loan duration value.
     */
    function maximumLoanDuration() external view returns (uint256);

    /**
        @notice Sets a new value for maximum loan duration setting (in seconds).
        @param newMaximumLoanDuration new maximum loan duration value.
     */
    function setMaximumLoanDuration(uint256 newMaximumLoanDuration) external;

    /**
        @notice Sets a new value for the liquidate ETH price setting.
        @param newLiquidateEthPrice new terms expiry time value.
    */
    function setLiquidateEthPrice(uint256 newLiquidateEthPrice) external;

    /**
        @notice It gets whether the platform is paused or not.
        @return true if platform is paused. Otherwise it returns false.
     */
    function isPaused() external view returns (bool);

    /**
        @notice It gets whether a lending pool is paused or not.
        @param lendingPoolAddress lending pool address to test.
        @return true if the lending pool is paused. Otherwise it returns false.
     */
    function lendingPoolPaused(address lendingPoolAddress) external view returns (bool);

    /**
        @notice It pauses a specific lending pool.
        @param lendingPoolAddress lending pool address to pause.
     */
    function pauseLendingPool(address lendingPoolAddress) external;

    /**
        @notice It unpauses a specific lending pool.
        @param lendingPoolAddress lending pool address to unpause.
     */
    function unpauseLendingPool(address lendingPoolAddress) external;
}
