// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../internal/price-aggregator.sol";
import "../storage/price-aggregator.sol";
import "./price-aggregator/chainlink-aggregator.sol";
import { ADMIN } from "../internal/roles.sol";

// Interfaces
import "../interfaces/IPriceAggregator.sol";

// Libraries
import "@openzeppelin/contracts/utils/Address.sol";

abstract contract fct_PriceAggregator_v1 is
    IPriceAggregator,
    mod_authorized_AccessControl_v1,
    fct_PriceAggregator_ChainlinkAggregator_v1,
    int_PriceAggregator_v1
{
    using Address for address;
    using AddressLib for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
        @notice It removes support for a Chainlink Aggregator.
        @param tokenAddress Token to remove all markets for.
     */
    function removeAsset(address tokenAddress)
        external
        override
        authorized(ADMIN, msg.sender)
    {
        tokenAddress = _normalizeTokenAddress(tokenAddress);

        _chainlinkRemoveAsset(tokenAddress);
    }
}
