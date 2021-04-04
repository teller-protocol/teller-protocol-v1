pragma solidity ^0.8.0;

// Contracts
import "../../storage/price-aggregator.sol";

// Interfaces
import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV2V3Interface.sol";

// Libraries
import "../../../libraries/AddressArrayLib.sol";
import "../../../../../contracts/util/AddressArrayLib.sol";

abstract contract int_PriceAggregator_ChainlinkAggregator_v1 is
    sto_PriceAggregator
{
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
     * @notice It removes support for a Chainlink Aggregator.
     * @param tokenAddress Token to remove all markets for.
     */
    function _chainlinkRemoveAsset(address tokenAddress) internal {
        address[] storage arr =
            priceAggStore().supportedTokens[tokenAddress].array;
        for (uint256 i; i < arr.length; i++) {
            (AggregatorV2V3Interface agg, bool inverse) =
                _chainlinkAggregatorFor(tokenAddress, arr[i]);
            if (inverse) {
                priceAggStore().chainlinkAggregators[arr[i]][
                    tokenAddress
                ] = address(0);
            } else {
                priceAggStore().chainlinkAggregators[tokenAddress][
                    arr[i]
                ] = address(0);
            }

            arr.pop();
        }
    }

    /**
     * @notice It grabs the Chainlink Aggregator contract address for the token pair if it is supported.
     * @param src Source token address.
     * @param dst Destination token address.
     * @return aggregator The Chainlink Aggregator address.
     * @return inverse whether or not the values from the Aggregator should be considered inverted.
     */
    function _chainlinkAggregatorFor(address src, address dst)
        internal
        view
        returns (AggregatorV2V3Interface aggregator, bool inverse)
    {
        inverse = priceAggStore().chainlinkAggregators[src][dst] == address(0);
        aggregator = AggregatorV2V3Interface(
            inverse
                ? priceAggStore().chainlinkAggregators[dst][src]
                : priceAggStore().chainlinkAggregators[src][dst]
        );
    }

    /**
     * @notice It returns the price of the token pair as given from the Chainlink Aggregator.
     * @dev It tries to use ETH as a pass through asset if the direct pair is not supported.
     * @param src Source token address.
     * @param dst Destination token address.
     * @return int256 The latest answer as given from Chainlink.
     */
    function _chainlinkPriceFor(address src, address dst)
        internal
        view
        returns (int256)
    {
        (AggregatorV2V3Interface agg, bool inverse) =
            _chainlinkAggregatorFor(src, dst);
        uint256 dstDecimals = _decimalsFor(dst);
        int256 dstFactor = int256(TEN**dstDecimals);
        if (address(agg) != address(0)) {
            int256 price = agg.latestAnswer();
            uint256 resDecimals = agg.decimals();
            if (inverse) {
                price = int256(TEN**(resDecimals.add(resDecimals))).div(price);
            }
            if (dstDecimals > resDecimals) {
                price = price.mul(int256(TEN**(dstDecimals.sub(resDecimals))));
            } else {
                price = price.div(int256(TEN**(resDecimals.sub(dstDecimals))));
            }
            int256 srcFactor = int256(TEN**_decimalsFor(src));
            return price;
        } else {
            for (
                uint256 i;
                i < priceAggStore().supportedTokens[src].array.length;
                i++
            ) {
                address routeToken =
                    priceAggStore().supportedTokens[src].array[i];
                (bool found, ) =
                    priceAggStore().supportedTokens[routeToken].getIndex(dst);
                if (found) {
                    int256 price1 = _priceForChainlink(src, routeToken);
                    int256 price2 = _priceForChainlink(dst, routeToken);

                    return (price1.mul(dstFactor)).div(price2);
                }
            }
            revert("PriceAggregator: cannot calc price from Chainlink");
        }
    }
}
