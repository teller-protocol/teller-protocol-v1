pragma solidity 0.5.17;


interface SettingsInterface {
    event SettingUpdated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 oldValue,
        uint256 newValue
    );

    event MaxLendingAmountUpdated(
        address indexed sender,
        address indexed lendingToken,
        uint256 oldValue,
        uint256 newValue
    );

    event LendingPoolPaused(address indexed account, address indexed lendingPoolAddress);

    event LendingPoolUnpaused(
        address indexed account,
        address indexed lendingPoolAddress
    );

    function requiredSubmissions() external view returns (uint256);

    function setRequiredSubmissions(uint256 newRequiredSubmissions) external;

    function maximumTolerance() external view returns (uint256);

    function setMaximumTolerance(uint256 newMaximumTolerance) external;

    function responseExpiryLength() external view returns (uint256);

    function setResponseExpiryLength(uint256 newResponseExpiryLength) external;

    function safetyInterval() external view returns (uint256);

    function setSafetyInterval(uint256 newSafetyInterval) external;

    function termsExpiryTime() external view returns (uint256);

    function setTermsExpiryTime(uint256 newTermsExpiryTime) external;

    function liquidateEthPrice() external view returns (uint256);

    function setLiquidateEthPrice(uint256 newLiquidateEthPrice) external;

    function isPaused() external view returns (bool);

    function lendingPoolPaused(address lendingPoolAddress) external view returns (bool);

    function pauseLendingPool(address lendingPoolAddress) external;

    function unpauseLendingPool(address lendingPoolAddress) external;

    function setMaxLendingAmount(address lendingTokenAddress, uint256 newMaxLendingAmount)
        external;

    function getMaxLendingAmount(address lendingTokenAddress)
        external
        view
        returns (uint256);

    function exceedsMaxLendingAmount(address lendingTokenAddress, uint256 amount)
        external
        view
        returns (bool);
}
