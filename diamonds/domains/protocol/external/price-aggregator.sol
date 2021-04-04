// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV2V3Interface.sol";

import "../storage/price-aggregator.sol";
import "../interfaces/IPriceAggregator.sol";
import "../internal/price-aggregator.sol";
import "../../../libraries/AddressArrayLib.sol";

abstract contract ext_PriceAggregator_v1 is
    sto_PriceAggregator_v1,
    int_PriceAggregator_v1,
    IPriceAggregator
{
    using AddressArrayLib for AddressArrayLib.AddressArray;

    function getTokensSupportedBy(address tokenAddress)
        external
        view
        returns (address[] memory)
    {
        return getPriceAggregator().supportedTokens[tokenAddress].array;
    }

    /**
        @notice It grabs the Chainlink Aggregator contract address for the token pair if it is supported.
        @param src Source token address.
        @param dst Destination token address.
        @return AggregatorV2V3Interface The Chainlink Aggregator address.
        @return bool whether or not the values from the Aggregator should be considered inverted.
     */

    function aggregatorFor(address src, address dst)
        external
        view
        override
        returns (AggregatorV2V3Interface, bool)
    {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        return _aggregatorFor(src, dst);
    }

    /**
        @notice It checks if the token is supported.
        @param tokenAddress Token address to check support for.
        @return bool whether or not the token is supported.
     */
    function isTokenSupported(address tokenAddress)
        external
        view
        override
        returns (bool)
    {
        tokenAddress = _normalizeTokenAddress(tokenAddress);

        return getPriceAggregator().supportedTokens[tokenAddress].length() > 0;
    }

    /**
        @notice It calculates the value of a token amount into another.
        @param src Source token address.
        @param dst Destination token address.
        @param srcAmount Amount of the source token to convert into the destination token.
        @return uint256 Value of the source token amount in destination tokens.
     */
    function valueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) external view override returns (uint256) {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        return _valueFor(src, dst, srcAmount);
    }

    /**
        @notice It returns the price of the token pair as given from the Chainlink Aggregator.
        @dev It tries to use ETH as a pass through asset if the direct pair is not supported.
        @param src Source token address.
        @param dst Destination token address.
        @return int256 The latest answer as given from Chainlink.
     */
    function latestAnswerFor(address src, address dst)
        external
        view
        override
        returns (int256)
    {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        return _priceFor(src, dst);
    }
}
