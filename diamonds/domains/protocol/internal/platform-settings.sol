// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/access-control/storage.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../storage/platform-settings.sol";

abstract contract PlatformSettingsManagement is
    sto_AccessControl,
    mod_authorized_AccessControl_v1,
    sto_PlatformSettings
{}
