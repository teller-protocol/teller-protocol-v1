pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../interfaces/ISwapper.sol";
import "../util/AddressArrayLib.sol";
import "../interfaces/IAssetController.sol";

contract AssetController is IAssetController {
    using Address for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    ISwapper public uniswapController;

    ICompoundComptroller public compoundComptroller;

    AddressArrayLib.AddressArray private assets;

    mapping(string => address) public assetBySymbol;

    function getAssets() external view returns (address[] memory) {
        return assets.array;
    }

    function addAsset(address asset) external {
        assets.add(asset);
        assetBySymbol[ERC20Detailed(asset).symbol()] = asset;
    }

    function removeAsset(address asset) external {
        assets.remove(asset);
        delete assetBySymbol[ERC20Detailed(asset).symbol()];
    }

    function initialize(
        address uniswapControllerAddress,
        address compoundComptrollerAddress
    ) external {
        require(
            uniswapControllerAddress.isContract(),
            "UNISWAP_CONTROLLER_MUST_BE_CONTRACT"
        );
        require(
            compoundComptrollerAddress.isContract(),
            "COMPOUND_COMPTROLLER_MUST_BE_CONTRACT"
        );

        uniswapController = ISwapper(uniswapControllerAddress);
        compoundComptroller = ICompoundComptroller(compoundComptrollerAddress);
    }
}
