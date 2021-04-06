// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";
import { int_exists_ERC721_v1 } from "../internal/exists.sol";
import { int_metadata_ERC721_v1 } from "../internal/metadata.sol";

contract ext_metadata_ERC721_v1 is
    sto_ERC721,
    int_exists_ERC721_v1,
    int_metadata_ERC721_v1
{
    /**
     * @notice Base URI for computing {tokenURI}. See {IERC721Metadata-_baseURI}
     */
    function baseURI() external view virtual returns (string memory) {
        return _baseURI();
    }

    /**
     * @notice See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId)
        external
        view
        virtual
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory base = _baseURI();
        return
            bytes(base).length > 0
                ? string(abi.encodePacked(base, _tokenURI(tokenId)))
                : "";
    }

    /**
     * @notice Get the URI for the contract metadata.
     */
    function contractURI() external view virtual returns (string memory) {
        return erc721Store().contractURI;
    }
}
