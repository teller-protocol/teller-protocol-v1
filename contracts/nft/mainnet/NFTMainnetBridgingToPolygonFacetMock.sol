// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import {
    NFTMainnetBridgingToPolygonFacet
} from "./NFTMainnetBridgingToPolygonFacet.sol";

contract NFTMainnetBridgingToPolygonFacetMock is
    NFTMainnetBridgingToPolygonFacet
{
    constructor(address polygonNFT)
        NFTMainnetBridgingToPolygonFacet(polygonNFT)
    {}

    function __depositFor(uint256[] memory tokenIds) internal override {}
}
