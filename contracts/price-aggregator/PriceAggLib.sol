// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PriceAggFacet } from "./PriceAggFacet.sol";

// Storage
import { AppStorageLib } from "../storage/app.sol";

/**
 * @notice Helper functions to staticcall into the PriceAggFacet from other facets. See {PriceAggFacet.getPriceFor}
 */
library PriceAggLib {
    /**
     * @notice It calculates the value of one token amount into another
     * @param src the source token
     * @param dst the destination token
     * @param srcAmount the amount of source token
     * @return value_ the returned value of src in dst
     */
    function valueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) internal view returns (uint256 value_) {
        value_ = PriceAggFacet(address(this)).getValueFor(src, dst, srcAmount);
    }

    /**
     * @notice It returns the price of the token pair as given from Compound.
     * @dev if no compound price is calculated, then it checks Chainlink price Aggregator
     * @param src the address of the source token
     * @param dst the address of the desitnation token
     * @return price_ gets the price of src in dst
     */
    function priceFor(address src, address dst)
        internal
        view
        returns (int256 price_)
    {
        price_ = PriceAggFacet(address(this)).getPriceFor(src, dst);
    }
}
