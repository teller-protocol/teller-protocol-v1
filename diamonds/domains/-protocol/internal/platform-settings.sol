import "./roles.sol";
import "../../../contexts/#access-control/modifiers/authorized.sol";
import "../../../contexts/#access-control/storage.sol";
import "../storage.sol";
import "../data.sol";
import "../libraries/PlatformSettingsLib.sol";
import "../interfaces/IPlatformSettings.sol";

abstract contract PlatformSettingsManagement is
    Roles,
    sto_AccessControl_v1,
    mod_authorized_AccessControl_v1,
    sto_PlatformSettings_v1,
    dat_SlatformSettings_v1
{}
