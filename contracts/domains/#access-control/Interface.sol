interface ifc_AccessControl_V1 {
    function hasRole(
        uint8 role,
        address account,
        uint8 domain
    ) external view returns (bool hasRole_);
}
