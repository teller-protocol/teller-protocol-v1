import "../internal/has-role.sol";
import "../internal/revoke-role.sol";

abstract contract ent_renounceRole_AccessControl_v1 is
    int_hasRole_AccessControl_v1,
    int_revokeRole_AccessControl_v1
{
    function renounceRole(bytes32 role) external {
        require(_hasRole(role, msg.sender), "CAN'T RENOUNCE");
        _revokeRole(role, msg.sender);
    }
}
