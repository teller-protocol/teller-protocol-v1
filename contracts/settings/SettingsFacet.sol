// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Interfaces
import { IUniswapV2Router } from "../shared/interfaces/IUniswapV2Router.sol";

// Libraries
import { PlatformSettingsLib } from "./PlatformSettingsLib.sol";
import { RolesLib } from "../contexts2/access-control/roles/RolesLib.sol";

// Storage
import { AppStorageLib, AppStorage } from "../storage/app.sol";

struct InitAssets {
    string sym;
    address addr;
}
struct InitArgs {
    InitAssets[] assets;
    address uniswapV2Router;
}

contract SettingsFacet is RolesMods {
    using PlatformSettingsLib for PlatformSettingsLib.PlatformSetting;

    function s() private pure returns (AppStorage storage) {
        return AppStorageLib.store();
    }

    function updatePlatformSetting(bytes32 name, uint256 newValue)
        external
        authorized(ADMIN, msg.sender)
    {
        s().platformSettings[name].update(newValue);
    }

    function removePlatformSetting(bytes32 name)
        external
        authorized(ADMIN, msg.sender)
    {
        s().platformSettings[name].remove();
    }

    function init(InitArgs calldata _args) external {
        require(!s().initialized, "Teller: platform already initialized");
        s().initialized = true;

        for (uint256 i; i < _args.assets.length; i++) {
            s().assetAddresses[_args.assets[i].sym] = _args.assets[i].addr;
        }
        s().uniswapRouter = IUniswapV2Router(_args.uniswapV2Router);

        RolesLib.grantRole(ADMIN, msg.sender);
    }
}
