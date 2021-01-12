pragma solidity 0.5.17;

import "./IUniswapController.sol";

interface IAssetController {
    function initialize(address uniswapControllerAddress) external;

    function addAsset(address asset) external;

    function removeAsset(address asset) external;

    function uniswapController() external view returns (IUniswapController);

    function getAssets() external view returns (address[] memory);

    function assetBySymbol(string calldata) external view returns (address);
}
