// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./roles.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../../../contexts/access-control/storage.sol";
import "../storage/platform-settings.sol";
import "../../../libraries/PlatformSettingsLib.sol";
import "../interfaces/IPlatformSettings.sol";

abstract contract PlatformSettingsManagement is
    Roles,
    sto_AccessControl_v1,
    mod_authorized_AccessControl_v1,
    sto_PlatformSettings_v1
{}
