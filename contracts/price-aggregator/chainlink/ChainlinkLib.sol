// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import {
    PriceAggStorageLib,
    ChainlinkAggStorage
} from "../../storage/price-aggregator.sol";

library ChainlinkLib {
    function s() internal view returns (ChainlinkAggStorage storage) {
        return PriceAggStorageLib.store().chainlink;
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
        aggregator = s().aggregators[src][dst];
        if (aggregator != address(0)) {
            found = true;
        } else {
            aggregator = s().aggregators[dst][src];
            if (aggregator != address(0)) {
                found = true;
                inverse = true;
            }
        }
    }

    /**
     * @dev Checks if a token address is supported by Chainlink (has a pair aggregator).
     * @param token Token address to check if is supported.
     * @return isSupported_ true if there is at least 1 pair aggregator for {token}
     */
    function isTokenSupported(address token)
        internal
        view
        returns (bool isSupported_)
    {
        isSupported_ = EnumerableSet.contains(s().supportedTokens, token);
    }
}
