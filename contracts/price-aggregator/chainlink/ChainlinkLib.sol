// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import {
    PriceAggStorageLib,
    PriceAggStorage
} from "../../storage/price-aggregator.sol";

library ChainlinkLib {
    function s() internal pure returns (PriceAggStorage storage) {
        return PriceAggStorageLib.store();
    }

    /**
     * @notice It grabs the Chainlink Aggregator contract address for the token pair if it is supported.
     * @param src Source token address.
     * @param dst Destination token address.
     * @return aggregator The Chainlink Aggregator address.
     * @return found whether or not the ChainlinkAggregator exists.
     * @return inverse whether or not the values from the Aggregator should be considered inverted.
     */
    function aggregatorFor(address src, address dst)
        internal
        view
        returns (
            address aggregator,
            bool found,
            bool inverse
        )
    {
        aggregator = s().chainlinkAggregators[src][dst];
        if (aggregator != address(0)) {
            found = true;
        } else {
            aggregator = s().chainlinkAggregators[dst][src];
            if (aggregator != address(0)) {
                found = true;
                inverse = true;
            }
        }
    }
}
