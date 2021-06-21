// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN, AUTHORIZED } from "../../shared/roles.sol";

// Interfaces
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";
import { IAToken } from "../../shared/interfaces/IAToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Libraries
import {
    CacheLib,
    Cache,
    CacheType
} from "../../shared/libraries/CacheLib.sol";
import { AssetCTokenLib } from "./libraries/AssetCTokenLib.sol";
import { AssetATokenLib } from "./libraries/AssetATokenLib.sol";
import { AssetPPoolLib } from "./libraries/AssetPPoolLib.sol";
import {
    PoolTogetherLib
} from "../../escrow/dapps/libraries/PoolTogetherLib.sol";
import { MaxLoanAmountLib } from "./libraries/MaxLoanAmountLib.sol";
import { MaxTVLLib } from "./libraries/MaxTVLLib.sol";

// Storage
import { AppStorageLib, AppStorage } from "../../storage/app.sol";
import {
    PrizePoolInterface
} from "../../escrow/dapps/interfaces/PrizePoolInterface.sol";

/**
 * @notice View function to get asset setting values.
 *
 * @author develop@teller.finance
 */
contract AssetSettingsDataFacet {
    /**
     * @notice it gets the asset's max loan amount
     * @param asset the address of the asset
     * @return the max loan amount
     */
    function getAssetMaxLoanAmount(address asset)
        external
        view
        returns (uint256)
    {
        return MaxLoanAmountLib.get(asset);
    }

    /**
     * @notice it gets the maxTVL of an asset
     * @param asset the address of the asset
     * @return it returns the maxTVL
     */
    function getAssetMaxTVL(address asset) external view returns (uint256) {
        return MaxTVLLib.get(asset);
    }

    /**
     * @notice it returns the asset's cToken
     * @param asset the address of the asset
     * @return the cToken of an asset
     */
    function getAssetCToken(address asset) external view returns (ICErc20) {
        return AssetCTokenLib.get(asset);
    }

    function getAssetAToken(address asset) external view returns (IAToken) {
        return AssetATokenLib.get(asset);
    }

    function getAssetPPool(address asset)
        external
        view
        returns (PrizePoolInterface)
    {
        return AssetPPoolLib.get(asset);
    }

    function getAssetPPoolTicket(address asset) external view returns (IERC20) {
        return IERC20(PoolTogetherLib.getTicketAddress(asset));
    }
}
