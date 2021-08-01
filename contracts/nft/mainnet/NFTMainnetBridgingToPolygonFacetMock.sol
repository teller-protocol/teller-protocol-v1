// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import {
    NFTMainnetBridgingToPolygonFacet
} from "./NFTMainnetBridgingToPolygonFacet.sol";

contract NFTMainnetBridgingToPolygonFacetMock is
    NFTMainnetBridgingToPolygonFacet
{
    function __depositForV1(uint256[] memory tokenIds) internal override {}
}
