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
     * @notice See {PriceAggFacet.getValueFor}
     */
    function valueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) internal view returns (uint256 value_) {
        value_ = PriceAggFacet(address(this)).getValueFor(src, dst, srcAmount);
    }

    /**
     * @notice See {PriceAggFacet.getPriceFor}
     */
    function priceFor(address src, address dst)
        internal
        view
        returns (int256 price_)
    {
        price_ = PriceAggFacet(address(this)).getPriceFor(src, dst);
    }
}
