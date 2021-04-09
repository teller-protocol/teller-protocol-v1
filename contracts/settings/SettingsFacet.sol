// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Libraries
import { PlatformSettingsLib } from "./PlatformSettingsLib.sol";
import { RolesLib } from "../contexts2/access-control/roles/RolesLib.sol";

// Storage
import { AppStorageLib, AppStorage } from "../storage/app.sol";

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

    function init() external {
        require(!s().initialized, "Teller: platform already initialized");
        s().initialized = true;

        RolesLib.grantRole(ADMIN, msg.sender);
    }
}
