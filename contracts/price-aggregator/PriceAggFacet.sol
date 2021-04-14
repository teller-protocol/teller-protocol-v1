// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import {
    AggregatorV2V3Interface
} from "@chainlink/contracts/src/v0.7/interfaces/AggregatorV2V3Interface.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Storage
import { AppStorageLib } from "../storage/app.sol";
import { ChainlinkLib } from "./chainlink/ChainlinkLib.sol";
import { CompoundLib } from "../shared/libraries/CompoundLib.sol";

contract PriceAggFacet {
    uint256 internal constant TEN = 10;

    /**
     * @notice It returns the price of the token pair as given from the Chainlink Aggregator.
     * @dev It tries to use ETH as a pass through asset if the direct pair is not supported.
     * @param src Source token address.
     * @param dst Destination token address.
     * @return int256 The latest answer as given from Chainlink.
     */
    function getPriceFor(address src, address dst)
        external
        view
        returns (int256)
    {
        return _priceFor(src, dst);
    }

    /**
     * @notice It calculates the value of a token amount into another.
     * @param src Source token address.
     * @param dst Destination token address.
     * @param srcAmount Amount of the source token to convert into the destination token.
     * @return uint256 Value of the source token amount in destination tokens.
     */
    function getValueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) external view returns (uint256) {
        (bool isCToken, address underlying) = _isCToken(src);
        if (isCToken) {
            srcAmount = CompoundLib.valueInUnderlying(src, srcAmount);
            src = underlying;
        }

        return
            (srcAmount * uint256(_priceFor(src, dst))) /
            uint256(TEN**_decimalsFor(src));
    }

    /**
     * @dev It gets the number of decimals for a given token.
     * @param addr Token address to get decimals for.
     * @return uint8 Number of decimals the given token.
     */
    function _decimalsFor(address addr) internal view returns (uint8) {
        return ERC20(addr).decimals();
    }

    function _priceFor(address src, address dst) private view returns (int256) {
        (address agg, bool foundAgg, bool inverse) =
            ChainlinkLib.aggregatorFor(src, dst);
        uint256 dstDecimals = _decimalsFor(dst);
        int256 dstFactor = int256(TEN**dstDecimals);
        if (foundAgg) {
            int256 price = AggregatorV2V3Interface(agg).latestAnswer();
            uint256 resDecimals = AggregatorV2V3Interface(agg).decimals();
            if (inverse) {
                price = int256(TEN**(resDecimals + resDecimals)) / price;
            }
            if (dstDecimals > resDecimals) {
                price = price * int256(TEN**(dstDecimals - resDecimals));
            } else {
                price = price / int256(TEN**(resDecimals - dstDecimals));
            }
            return price;
        } else {
            address WETH = AppStorageLib.store().assetAddresses["WETH"];
            // If the destination asset is WETH in this `else` block,
            // it means we already been here and should revert.
            if (dst == WETH) {
                revert("Teller: cannot calc price from Chainlink");
            }

            int256 price1 = _priceFor(src, WETH);
            int256 price2 = _priceFor(dst, WETH);

            return (price1 * dstFactor) / price2;
        }
    }

    function _isCToken(address token)
        private
        view
        returns (bool isCToken, address underlying)
    {
        isCToken = CompoundLib.isCompoundToken(token);
        if (isCToken) {
            underlying = CompoundLib.getUnderlying(token);
        }
    }
}
