pragma solidity 0.5.17;


interface SettingsInterface {
    event RequiredSubmissionsUpdated(
        address indexed sender,
        uint256 oldRequiredSubmissions,
        uint256 newRequiredSubmissions
    );

    event MaximumToleranceUpdated(
        address indexed sender,
        uint256 oldMaximumTolerance,
        uint256 newMaximumTolerance
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

    function isPaused() external view returns (bool);

    function lendingPoolPaused(address lendingPoolAddress) external view returns (bool);

    function pauseLendingPool(address lendingPoolAddress) external;

    function unpauseLendingPool(address lendingPoolAddress) external;
}
