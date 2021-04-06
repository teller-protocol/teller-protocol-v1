// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts

// Interfaces
import "../interfaces/ITellerNFT.sol";

/**
 * @notice NFT contract inherits this instead of the ERC721 one so the internal methods get overridden.
 */
contract ext_supportsInterface_NFT_v1 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId)
        external
        view
        returns (bool)
    {
        return interfaceId == type(ITellerNFT).interfaceId;
    }
}

contract ext_supportsInterface_NFT is ext_supportsInterface_NFT_v1 {}
