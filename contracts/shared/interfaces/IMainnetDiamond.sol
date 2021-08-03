// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ITellerDiamond } from "./ITellerDiamond.sol";
import { MainnetNFTFacet } from "../../nft/mainnet/MainnetNFTFacet.sol";
import {
    NFTMainnetBridgingToPolygonFacet
} from "../../nft/mainnet/NFTMainnetBridgingToPolygonFacet.sol";

abstract contract IMainnetDiamond is
    ITellerDiamond,
    MainnetNFTFacet,
    NFTMainnetBridgingToPolygonFacet
{}
