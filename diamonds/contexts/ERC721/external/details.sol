// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";

contract ext_details_ERC721_v1 is sto_ERC721 {
    /**
     * @dev See {IERC721Metadata-name}.
     */
    function name() external view returns (string memory) {
        return erc721Store().name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}.
     */
    function _symbol() external view returns (string memory) {
        return erc721Store().symbol;
    }
}
