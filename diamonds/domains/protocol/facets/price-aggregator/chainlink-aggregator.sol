// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../../contexts/access-control/modifiers/authorized.sol";
import "../../internal/roles.sol";
import "../../storage/price-aggregator.sol";

// Interfaces
import "../../interfaces/IPriceAggregator.sol";

// Libraries
import "@openzeppelin/contracts/utils/Address.sol";

abstract contract fct_PriceAggregator_ChainlinkAggregator_v1 is
    IPriceAggregator,
    Roles,
    mod_authorized_AccessControl_v1
{
    using Address for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
     * @notice It allows for additional Chainlink Aggregators to be supported.
     * @param src Source token address.
     * @param dst Destination token address.
     * @param aggregator Price aggregator address.
     */
    function chainlinkAddAggregator(
        address src,
        address dst,
        address aggregator
    ) external override authorized(ADMIN, msg.sender) {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        (AggregatorV2V3Interface agg, ) = _chainlinkAggregatorFor(src, dst);
        require(address(agg) == address(0x0), "CHAINLINK_PAIR_ALREADY_EXISTS");

        require(
            src.isContract() || src == assetRegistryStorage().addresses["ETH"],
            "TOKEN_A_NOT_CONTRACT"
        );
        require(
            dst.isContract() || dst == assetRegistryStorage().addresses["ETH"],
            "TOKEN_B_NOT_CONTRACT"
        );
        require(aggregator.isContract(), "AGGREGATOR_NOT_CONTRACT");

        priceAggStore().chainlinkAggregators[src][dst] = aggregator;
        priceAggStore().supportedTokens[src].add(dst);
        priceAggStore().supportedTokens[dst].add(src);
    }

    /**
     * @notice It removes support for a Chainlink Aggregator pair.
     * @param src Source token address.
     * @param dst Destination token address.
     */
    function chainlinkRemoveAggregator(address src, address dst)
        external
        override
        authorized(ADMIN, msg.sender)
    {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        (AggregatorV2V3Interface agg, ) = _chainlinkAggregatorFor(src, dst);
        if (address(agg) == address(0)) {
            return;
        }

        priceAggStore().chainlinkAggregators[src][dst] = address(0);
        priceAggStore().supportedTokens[src].remove(dst);
        priceAggStore().supportedTokens[dst].remove(src);
    }
}
