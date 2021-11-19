// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../../shared/roles.sol";

// Interfaces
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";
import { IAToken } from "../../shared/interfaces/IAToken.sol";
import { IVault } from "../../shared/interfaces/IVault.sol";
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
import { AssetYVaultLib } from "./libraries/AssetYVaultLib.sol";
import {
    PoolTogetherLib
} from "../../escrow/dapps/libraries/PoolTogetherLib.sol";
import { MaxLoanAmountLib } from "./libraries/MaxLoanAmountLib.sol";
import { MaxDebtRatioLib } from "./libraries/MaxDebtRatioLib.sol";

// Storage
import { AppStorageLib, AppStorage } from "../../storage/app.sol";
import {
    PrizePoolInterface
} from "../../shared/interfaces/pooltogether/PrizePoolInterface.sol";

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
     * @notice it gets the maxDebtRatio of an asset
     * @param asset the address of the asset
     * @return it returns the maxDebtRatio
     */
    function getAssetMaxDebtRatio(address asset)
        external
        view
        returns (uint256)
    {
        return MaxDebtRatioLib.get(asset);
    }

    /**
     * @notice it returns the asset's Compound token
     * @param asset the address of the asset
     * @return the Compound token of an asset
     */
    function getAssetCToken(address asset) external view returns (ICErc20) {
        return AssetCTokenLib.get(asset);
    }

    /**
     * @notice it returns the asset's Aave token
     * @param asset the address of the asset
     * @return the Aave token of an asset
     */
    function getAssetAToken(address asset) external view returns (IAToken) {
        return AssetATokenLib.get(asset);
    }

    /**
     * @notice it returns the asset's PoolTogether PrizePool contract
     * @param asset the address of the asset
     * @return the PoolTogether PrizePool contract of an asset
     */
    function getAssetPPool(address asset)
        external
        view
        returns (PrizePoolInterface)
    {
        return AssetPPoolLib.get(asset);
    }

    /**
     * @notice it returns the asset's PoolTogether Ticket token
     * @param asset the address of the asset
     * @return the PoolTogether Ticket token of an asset
     */
    function getAssetPPoolTicket(address asset) external view returns (IERC20) {
        return IERC20(PoolTogetherLib.getTicketAddress(asset));
    }

    /**
     * @notice it gets the Yearn Vault of an asset
     * @param asset the address of the asset
     * @return it returns the Yearn Vault
     */
    function getAssetYVault(address asset) external view returns (IVault) {
        return AssetYVaultLib.get(asset);
    }
}
