// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/token.sol";
import "../storage/tier.sol";
import "../../../contexts/ERC721/storage/ERC721.sol";
import {
    ext_metadata_ERC721_v1,
    int_metadata_ERC721_v1
} from "../../../contexts/ERC721/external/metadata.sol";
import { int_metadata_NFT_v1 } from "../internal/metadata.sol";

// Libraries
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @notice NFT contract inherits this instead of the ERC721 one so the internal methods get overridden.
 */
contract ext_metadata_NFT_v1 is
    sto_Token,
    sto_Tier,
    sto_ERC721,
    ext_metadata_ERC721_v1,
    int_metadata_NFT_v1
{
    using SafeMath for uint256;

    function contractURI() external view returns (string memory) {
        return tokenStore().contractURI;
    }

    /**
     * @notice The base URI path where the token media is hosted.
     * @dev Base URI for computing {tokenURI}.
     */
    function _baseURI()
        internal
        view
        override(int_metadata_ERC721_v1, int_metadata_NFT_v1)
        returns (string memory)
    {
        return int_metadata_NFT_v1._baseURI();
    }

    /**
     * @notice It returns the hash to use for the token URI.
     */
    function _tokenURI(uint256 tokenId)
        internal
        view
        override(int_metadata_ERC721_v1, int_metadata_NFT_v1)
        returns (string memory)
    {
        return int_metadata_NFT_v1._tokenURI(tokenId);
    }
}

contract ext_metadata_NFT is ext_metadata_NFT_v1 {}
