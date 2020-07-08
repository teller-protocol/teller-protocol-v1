pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/AssetSettingsLib.sol";


interface SettingsInterface {
    event SettingUpdated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 oldValue,
        uint256 newValue
    );

    event AssetSettingsCreated(
        address indexed sender,
        address indexed lendingToken,
        address indexed cToken,
        uint256 maxLendingAmount,
        uint256 rateProcessFrequency
    );

    event AssetSettingsUpdated(
        address indexed sender,
        address indexed lendingToken,
        address indexed cToken,
        uint256 newMaxLendingAmount,
        uint256 newRateProcessFrequency
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

    function updateAssetSettings(
        address lendingTokenAddress,
        address cTokenAddress,
        uint256 newMaxLendingAmount,
        uint256 newRateProcessFrequency
    ) external;

    function getAssetSettings(address lendingTokenAddress)
        external
        view
        returns (AssetSettingsLib.AssetSettings memory);

    function createAssetSettings(
        address lendingTokenAddress,
        address cTokenAddress,
        uint256 newMaxLendingAmount,
        uint256 newRateProcessFrequency
    ) external;

    function hasAssetSettings(address lendingTokenAddress) external view returns (bool);

    function exceedsMaxLendingAmount(address lendingTokenAddress, uint256 amount)
        external
        view
        returns (bool);

    function getAssets() external view returns (address[] memory);
}
