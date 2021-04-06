// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// Contracts
import { Tier } from "../data/tier.sol";

// Interfaces
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ITellerNFT is IERC721 {
    /**
     * @notice The contract metadata URI.
     */
    function contractURI() external view returns (string memory);

    /**
     * @notice The token metadata URI.
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);

    /**
     * @notice It returns information about a Tier for an index.
     */
    function getTier(uint256 tierIndex)
        external
        view
        returns (Tier memory tier_);

    /**
     * @notice It returns information about a Tier for a token ID.
     */
    function getTokenTier(uint256 tokenId)
        external
        view
        returns (uint256 index_, Tier memory tier_);

    /**
     * @notice It returns an array of token IDs owned by an address.
     * @dev It uses a EnumerableSet to store values and loops over each element to add to the array.
     * @dev Can be costly if calling within a contract for address with many tokens.
     */
    function getTierHashes(uint256 tierIndex)
        external
        view
        returns (string[] memory hashes_);

    /**
     * @notice It returns an array of token IDs owned by an address.
     * @dev It uses a EnumerableSet to store values and loops over each element to add to the array.
     * @dev Can be costly if calling within a contract for address with many tokens.
     */
    function ownedTokens(address owner)
        external
        view
        returns (uint256[] memory owned);

    /**
     * @notice It mints a new token for a Tier index.
     *
     * Requirements:
     *  - Caller must be an authorized minter
     */
    function mint(uint256 tierIndex, address owner) external;

    /**
     * @notice Adds a new Tier to be minted with the given information.
     * @dev It auto increments the index of the next tier to add.
     * @param newTier Information about the new tier to add.
     *
     * Requirements:
     *  - Caller must have the {MINTER} role
     */
    function addTier(Tier memory newTier) external;

    /**
     * @notice Initializes the TellerNFT.
     * @param minters The addresses that should allowed to mint tokens.
     * @param _contractURI The link to the initial contract level metadata.
     */
    function initialize(address[] calldata minters, string memory _contractURI)
        external;
}
