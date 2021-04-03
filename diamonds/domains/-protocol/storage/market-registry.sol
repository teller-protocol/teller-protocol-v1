import "../libraries/AddressArrayLib.sol";

abstract contract sto_MarketRegistry_v1 {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    struct Layout {
        mapping(address => AddressArrayLib.AddressArray) markets;
        mapping(address => address) lendingPools;
        mapping(address => mapping(address => address)) loanManagers;
        mapping(address => mapping(address => bool)) loanManagerRegistry;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.market_registry.v1");

    function getMarketRegistryStorage()
        internal
        pure
        returns (Layout storage l_)
    {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}
