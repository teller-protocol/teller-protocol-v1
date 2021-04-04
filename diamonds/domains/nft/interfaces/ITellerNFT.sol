// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// Interfaces
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

interface ITellerNFT is IERC721Upgradeable {
    /**
     * @notice It returns an array of token IDs owned by an address.
     * @dev It uses a EnumerableSet to store values and loops over each element to add to the array.
     * @dev Can be costly if calling within a contract for address with many tokens.
     */
    function ownedTokens(address owner)
        external
        view
        returns (uint256[] memory owned);

    function mint(uint256 tierIndex, address owner) external;

    function addTier(Tier memory newTier) external;

    function initialize(address[] calldata minters) external;

    /**
     * @notice The token URI is based on the token ID.
     */
    function tokenURI(uint256 tokenId)
        external
        view
        virtual
        returns (string memory);
}
