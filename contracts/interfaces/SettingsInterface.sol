pragma solidity 0.5.17;


interface SettingsInterface {
    event SettingUpdated(
        bytes32 indexed settingName,
        address indexed sender,
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

    function isPaused() external view returns (bool);

    function lendingPoolPaused(address lendingPoolAddress) external view returns (bool);

    function pauseLendingPool(address lendingPoolAddress) external;

    function unpauseLendingPool(address lendingPoolAddress) external;
}
