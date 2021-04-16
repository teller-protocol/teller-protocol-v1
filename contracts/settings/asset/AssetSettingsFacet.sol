// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN, AUTHORIZED } from "../../shared/roles.sol";

// Libraries
import {
    CacheLib,
    Cache,
    CacheType
} from "../../shared/libraries/CacheLib.sol";

// Storage
import { AppStorageLib, AppStorage } from "../../storage/app.sol";

struct AssetSettingRequest {
    bytes32 key;
    bytes32 value;
    CacheType cacheType;
}

contract AssetSettingsFacet is RolesMods {
    function s(address asset) private view returns (Cache storage) {
        return AppStorageLib.store().assetSettings[asset];
    }

    event AssetSettingsCreated(
        address indexed asset,
        bytes32 indexed key,
        bytes32 value,
        CacheType cacheType
    );

    event AssetSettingsUpdated(
        address indexed asset,
        bytes32 indexed key,
        bytes32 value,
        CacheType cacheType
    );

    function isAssetSettingInitialized(address asset)
        external
        view
        returns (bool)
    {
        return CacheLib.exists(s(asset));
    }

    /**
     * @notice It creates an asset with the given parameters.
     */
    function createAssetSetting(
        address asset,
        AssetSettingRequest[] calldata requests
    ) external authorized(ADMIN, msg.sender) {
        require(asset != address(0), "Teller: asset address required");

        CacheLib.initialize(s(asset));

        for (uint256 i; i < requests.length; i++) {
            CacheLib.update(
                s(asset),
                requests[i].key,
                requests[i].value,
                requests[i].cacheType
            );

            emit AssetSettingsCreated(
                asset,
                requests[i].key,
                requests[i].value,
                requests[i].cacheType
            );
        }
    }

    /**
     * @notice It creates an asset with the given parameters.
     */
    function updateAssetSetting(
        address asset,
        AssetSettingRequest calldata request
    ) external authorized(ADMIN, msg.sender) {
        require(
            CacheLib.exists(s(asset)),
            "Teller: asset setting does not exists"
        );

        CacheLib.update(
            s(asset),
            request.key,
            request.value,
            request.cacheType
        );

        emit AssetSettingsUpdated(
            asset,
            request.key,
            request.value,
            request.cacheType
        );
    }
}
