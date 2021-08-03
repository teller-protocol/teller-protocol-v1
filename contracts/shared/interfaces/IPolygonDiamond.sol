// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ITellerDiamond } from "./ITellerDiamond.sol";
import { NFTFacet } from "../../nft/NFTFacet.sol";

abstract contract IPolyDiamond is ITellerDiamond, NFTFacet {}
