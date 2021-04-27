// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../../shared/roles.sol";

// Libraries
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { ChainlinkLib } from "./ChainlinkLib.sol";

// Storage
import {
    PriceAggStorageLib,
    PriceAggStorage
} from "../../storage/price-aggregator.sol";

contract ChainlinkAggFacet is RolesMods {
    /**
     * @notice It grabs the Chainlink Aggregator contract address for the token pair if it is supported.
     * @param src Source token address.
     * @param dst Destination token address.
     * @return agg The Chainlink Aggregator address.
     * @return found whether or not the ChainlinkAggregator exists.
     * @return inverse whether or not the values from the Aggregator should be considered inverted.
     */
    function getChainlinkAggregatorFor(address src, address dst)
        external
        view
        returns (
            address agg,
            bool found,
            bool inverse
        )
    {
        (agg, found, inverse) = ChainlinkLib.aggregatorFor(src, dst);
    }

    /**
     * @dev Checks if a token address is supported by Chainlink (has a pair aggregator).
     * @param token Token address to check if is supported.
     * @return isSupported_ true if there is at least 1 pair aggregator for {token}
     */
    function isChainlinkTokenSupported(address token)
        external
        view
        returns (bool)
    {
        return ChainlinkLib.isTokenSupported(token);
    }

    /**
     * @notice It allows for additional Chainlink Aggregators to be supported.
     * @param src Source token address.
     * @param dst Destination token address.
     * @param aggregator Price aggregator address.
     */
    function addChainlinkAggregator(
        address src,
        address dst,
        address aggregator
    ) external authorized(ADMIN, msg.sender) {
        (, bool found, ) = ChainlinkLib.aggregatorFor(src, dst);
        require(!found, "Teller: chainlink aggregator already exists");
        require(Address.isContract(src), "Teller: source token not contract");
        require(
            Address.isContract(dst),
            "Teller: destination token not contract"
        );
        require(
            Address.isContract(aggregator),
            "Teller: chainlink aggregator not contract"
        );

        // Store now aggregator
        ChainlinkLib.s().aggregators[src][dst] = aggregator;
        // Make sure token addresses are known to be supported
        EnumerableSet.add(ChainlinkLib.s().supportedTokens, src);
        EnumerableSet.add(ChainlinkLib.s().supportedTokens, dst);
        // Increment token pair counts
        ChainlinkLib.s().pairCount[src]++;
        ChainlinkLib.s().pairCount[dst]++;
    }

    /**
     * @notice It removes support for a Chainlink Aggregator pair.
     * @param src Source token address.
     * @param dst Destination token address.
     */
    function removeChainlinkAggregator(address src, address dst)
        external
        authorized(ADMIN, msg.sender)
    {
        (, bool found, ) = ChainlinkLib.aggregatorFor(src, dst);
        if (!found) {
            return;
        }

        // Delete aggregator storage
        delete ChainlinkLib.s().aggregators[src][dst];
        // Decrement token pair counts
        ChainlinkLib.s().pairCount[src]--;
        ChainlinkLib.s().pairCount[dst]--;
        // Remove token support if token pair length is 0
        if (ChainlinkLib.s().pairCount[src] == 0) {
            EnumerableSet.remove(ChainlinkLib.s().supportedTokens, src);
        }
        if (ChainlinkLib.s().pairCount[dst] == 0) {
            EnumerableSet.remove(ChainlinkLib.s().supportedTokens, dst);
        }
    }
}
