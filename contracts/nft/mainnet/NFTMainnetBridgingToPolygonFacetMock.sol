// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import {
    NFTMainnetBridgingToPolygonFacet
} from "./NFTMainnetBridgingToPolygonFacet.sol";

contract NFTMainnetBridgingToPolygonFacetMock is
    NFTMainnetBridgingToPolygonFacet
{
    /* Constructor */

    /**
     * @notice Sets the NFT migrator address on deployment
     * @param tellerNFTMigratorAddress The address of Teller's NFT migrator contract
     */
    constructor(address tellerNFTMigratorAddress)
        NFTMainnetBridgingToPolygonFacet(tellerNFTMigratorAddress)
    {}

    function __depositFor(uint256[] memory tokenIds, uint256[] memory amounts)
        internal
        override
    {}
}
