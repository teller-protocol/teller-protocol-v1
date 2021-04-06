// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/ERC721/storage/ERC721.sol";

abstract contract int_setContractURI_NFT_v1 is sto_ERC721 {
    /**
     * @notice Sets the contract level metadata URI.
     * @param contractURI The link to the initial contract level metadata.
     */
    function _setContractURI(string memory contractURI) internal {
        erc721Store().contractURI = contractURI;
    }
}

abstract contract int_setContractURI_NFT is int_setContractURI_NFT_v1 {}
