// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../contexts/access-control/modifiers/authorized.sol";
import "../internal/roles.sol";
import "../internal/price-aggregator.sol";
import "../interfaces/IPriceAggregator.sol";
import "../storage/price-aggregator.sol";
import "@openzeppelin/contracts/utils/Address.sol";

abstract contract ext_PriceAggregator_v1 is
    Roles,
    mod_authorized_AccessControl_v1,
    int_PriceAggregator_v1,
    IPriceAggregator
{
    using Address for address;
    using AddressLib for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
        @notice It allows for additional Chainlink Aggregators to be supported.
        @param src Source token address.
        @param dst Destination token address.
        @param aggregator Price aggregator address.
     */
    function addAggregator(
        address src,
        address dst,
        address aggregator
    ) external override authorized(PAUSER, msg.sender) {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        (AggregatorV2V3Interface agg, ) = _aggregatorFor(src, dst);
        require(address(agg) == address(0x0), "CHAINLINK_PAIR_ALREADY_EXISTS");

        require(
            src.isContract() || src == getAssetRegistry().addresses["ETH"],
            "TOKEN_A_NOT_CONTRACT"
        );
        require(
            dst.isContract() || dst == getAssetRegistry().addresses["ETH"],
            "TOKEN_B_NOT_CONTRACT"
        );
        require(aggregator.isContract(), "AGGREGATOR_NOT_CONTRACT");

        getPriceAggregator().aggregators[src][dst] = aggregator;
        getPriceAggregator().supportedTokens[src].add(dst);
        getPriceAggregator().supportedTokens[dst].add(src);
    }

    /**
        @notice It removes support for a Chainlink Aggregator pair.
        @param src Source token address.
        @param dst Destination token address.
     */
    function removeAggregator(address src, address dst)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        (AggregatorV2V3Interface agg, ) = _aggregatorFor(src, dst);
        if (address(agg).isEmpty()) {
            return;
        }

        getPriceAggregator().aggregators[src][dst] = address(0);
        getPriceAggregator().supportedTokens[src].remove(dst);
        getPriceAggregator().supportedTokens[dst].remove(src);
    }

    /**
        @notice It removes support for a Chainlink Aggregator.
        @param tokenAddress Token to remove all markets for.
     */
    function removeAsset(address tokenAddress)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        tokenAddress = _normalizeTokenAddress(tokenAddress);

        address[] storage arr =
            getPriceAggregator().supportedTokens[tokenAddress].array;
        for (uint256 i; i < arr.length; i++) {
            (AggregatorV2V3Interface agg, bool inverse) =
                _aggregatorFor(tokenAddress, arr[i]);
            if (inverse) {
                getPriceAggregator().aggregators[arr[i]][
                    tokenAddress
                ] = address(0);
            } else {
                getPriceAggregator().aggregators[tokenAddress][
                    arr[i]
                ] = address(0);
            }

            arr.pop();
        }
    }
}
