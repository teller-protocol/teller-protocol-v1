abstract contract sto_AssetRegistry_v1 {
    struct Layout {
        mapping(string => address) addresses;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.asset_registry.v1");

    function getAssetRegistry() internal pure returns (Layout storage l_) {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}
