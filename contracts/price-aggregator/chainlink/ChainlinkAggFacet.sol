// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../../shared/roles.sol";

// Libraries
import "@openzeppelin/contracts/utils/Address.sol";
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

        PriceAggStorageLib.store().chainlinkAggregators[src][dst] = aggregator;
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

        delete PriceAggStorageLib.store().chainlinkAggregators[src][dst];
    }
}
