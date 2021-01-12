pragma solidity 0.5.17;

import "./ISwapper.sol";
import "./ICompoundComptroller.sol";

interface IAssetController {
    function initialize(address uniswapControllerAddress) external;

    function addAsset(address asset) external;

    function removeAsset(address asset) external;

    function uniswapController() external view returns (ISwapper);

    function compoundComptroller() external view returns (ICompoundComptroller);

    function getAssets() external view returns (address[] memory);

    function assetBySymbol(string calldata) external view returns (address);
}
