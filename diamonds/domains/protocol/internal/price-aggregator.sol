// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV2V3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SignedSafeMath.sol";

import "../storage/asset-registry.sol";
import "../storage/price-aggregator.sol";
import "../../../libraries/AddressArrayLib.sol";

abstract contract int_PriceAggregator_v1 is
    sto_AssetRegistry_v1,
    sto_PriceAggregator_v1
{
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
        @notice It normalizes the token address to ETH if WETH.
        @param tokenAddress The address of the token to normalize.
    */
    function _normalizeTokenAddress(address tokenAddress)
        internal
        view
        returns (address)
    {
        return
            tokenAddress == getAssetRegistry().addresses["WETH"]
                ? getAssetRegistry().addresses["ETH"]
                : tokenAddress;
    }

    /**
        @notice It gets the number of decimals for a given token.
        @param addr Token address to get decimals for.
        @return uint8 Number of decimals the given token.
     */
    function _decimalsFor(address addr) internal view returns (uint8) {
        return
            addr == getAssetRegistry().addresses["ETH"]
                ? 18
                : ERC20(addr).decimals();
    }

    /**
        @notice It grabs the Chainlink Aggregator contract address for the token pair if it is supported.
        @param src Source token address.
        @param dst Destination token address.
        @return aggregator The Chainlink Aggregator address.
        @return inverse whether or not the values from the Aggregator should be considered inverted.
     */
    function _aggregatorFor(address src, address dst)
        internal
        view
        returns (AggregatorV2V3Interface aggregator, bool inverse)
    {
        inverse = getPriceAggregator().aggregators[src][dst] == address(0);
        aggregator = AggregatorV2V3Interface(
            inverse
                ? getPriceAggregator().aggregators[dst][src]
                : getPriceAggregator().aggregators[src][dst]
        );
    }

    /**
        @notice It calculates the value of a token amount into another.
        @param src Source token address.
        @param dst Destination token address.
        @param srcAmount Amount of the source token to convert into the destination token.
        @return uint256 Value of the source token amount in destination tokens.
     */
    function _valueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) internal view returns (uint256) {
        return
            (srcAmount.mul(uint256(_priceFor(src, dst)))).div(
                uint256(TEN**_decimalsFor(src))
            );
    }

    /**
        @notice It returns the price of the token pair as given from the Chainlink Aggregator.
        @dev It tries to use ETH as a pass through asset if the direct pair is not supported.
        @param src Source token address.
        @param dst Destination token address.
        @return int256 The latest answer as given from Chainlink.
     */
    function _priceFor(address src, address dst)
        internal
        view
        returns (int256)
    {
        (AggregatorV2V3Interface agg, bool inverse) = _aggregatorFor(src, dst);
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
                i < getPriceAggregator().supportedTokens[src].array.length;
                i++
            ) {
                address routeToken =
                    getPriceAggregator().supportedTokens[src].array[i];
                (bool found, ) =
                    getPriceAggregator().supportedTokens[routeToken].getIndex(
                        dst
                    );
                if (found) {
                    int256 price1 = _priceFor(src, routeToken);
                    int256 price2 = _priceFor(dst, routeToken);

                    return (price1.mul(dstFactor)).div(price2);
                }
            }
            revert("CANNOT_CALCULATE_VALUE");
        }
    }
}
