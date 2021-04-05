// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";

abstract contract int_metadata_ERC721_v1 {
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
}
