// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../storage/ERC721.sol";

abstract contract int_metadata_ERC721_v1 is sto_ERC721 {
    using Strings for uint256;

    /**
     * @dev Base URI for computing {tokenURI}. Empty by default, can be overriden
     * in child contracts.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }

    /**
     * @dev Token URI for computing {tokenURI}. Will be appended to {_baseURI}.
     */
    function _tokenURI(uint256 tokenId)
        internal
        view
        virtual
        returns (string memory)
    {
        return tokenId.toString();
    }

    /**
     * @dev Sets the URI for the contract metadata.
     */
    function _setContractURI(string memory uri) internal {
        erc721Store().contractURI = uri;
    }
}
