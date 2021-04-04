pragma solidity ^0.8.0;

import "../../contexts/ERC721/context.sol";
import "./internal/token-metadata.sol";

abstract contract ctx_TellerNFT_v1 is ctx_ERC721_v1, int_TokenMetadata_v1 {}
