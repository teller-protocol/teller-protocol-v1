// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/tier.sol";
import {
    int_metadata_ERC721_v1
} from "../../../contexts/ERC721/internal/metadata.sol";

// Libraries
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

abstract contract int_metadata_NFT_v1 is sto_Tier, int_metadata_ERC721_v1 {
    using SafeMath for uint256;

    /**
     * @notice The base URI path where the token media is hosted.
     * @dev Base URI for computing {tokenURI}.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return "https://gateway.pinata.cloud/ipfs/";
    }

    /**
     * @notice It returns the hash to use for the token URI.
     */
    function _tokenURI(uint256 tokenId)
        internal
        view
        virtual
        override
        returns (string memory)
    {
        string[] storage tierImageHashes =
            tierStore().tiers[tierStore().tokenTierMap[tokenId]].hashes;
        return tierImageHashes[tokenId.mod(tierImageHashes.length)];
    }
}

abstract contract int_metadata_NFT is int_metadata_NFT_v1 {}
