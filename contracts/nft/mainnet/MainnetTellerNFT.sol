// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT_V2 } from "../TellerNFT_V2.sol";
import { TellerNFTDictionary } from "../TellerNFTDictionary.sol";
import {
    IERC721ReceiverUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

contract MainnetTellerNFT is IERC721ReceiverUpgradeable, TellerNFT_V2 {
    /* Constants */

    address public constant V1 = 0x2ceB85a2402C94305526ab108e7597a102D6C175;
    TellerNFTDictionary public constant DICT =
        TellerNFTDictionary(0x72733102AB139FB0367cc29D492c955A7c736079);
    address public constant diamond =
        0xc14D994fe7C5858c93936cc3bD42bb9467d6fB2C;

    bytes32 public constant MINTER = keccak256("MINTER");

    /* Initializers */

    /**
     * @notice Initializes the TellerNFT.
     * @param data The addresses that should allowed to mint tokens.
     */
    function __TellerNFT_V2_init_unchained(bytes calldata data)
        internal
        override
        initializer
    {
        address[] memory minters = abi.decode(data, (address[]));

        // Set admin role for minters
        _setRoleAdmin(MINTER, ADMIN);
        // Set the initial minters
        for (uint256 i; i < minters.length; i++) {
            _setupRole(MINTER, minters[i]);
        }
    }

    /* External Functions */

    /**
     * @notice It mints a new token for a Tier index.
     * @param tierIndex Tier to mint token on.
     * @param owner The owner of the new token.
     *
     * Requirements:
     *  - Caller must be an authorized minter
     */
    function mint(
        address owner,
        uint128 tierIndex,
        uint128 amount
    ) external onlyRole(MINTER) {
        // Get the token ID to mint for the user
        // On a fresh mint, the exact token ID minted is determined on tx execution
        //  with sudo randomness using the block number
        uint256 tokenId = _mergeTokenId(
            tierIndex,
            uint128(block.number % tierTokenCount[tierIndex])
        );
        _mint(owner, tokenId, uint256(amount), "");
    }

    /**
     * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
     * by `operator` from `from`, this function is called.
     *
     * It must return its Solidity selector to confirm the token transfer.
     * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
     *
     * The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`.
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        // Check which 721 token we received
        // We only care about V1 so we can migrate it
        if (_msgSender() == V1) {
            uint256 newTokenId;
            // if the from address is the diamond address, we trust that we
            // can decode the data into the newly converted token id
            if (from == diamond) {
                newTokenId = abi.decode(data, (uint256));
            } else {
                newTokenId = convertV1TokenId(tokenId);
            }
            // Convert V1 token ID and mint 1 new V2 token to the diamond
            _mint(from, newTokenId, 1, "");
        }
        return IERC721ReceiverUpgradeable.onERC721Received.selector;
    }

    /* Public Functions */

    /**
     * @notice it performs a reverse look up on by finding our ID using the
     * tokenURI hash using the NFT dictionary. Required that the token id exists
     * @param _tokenId the tokenId to look up
     */
    function convertV1TokenId(uint256 _tokenId)
        public
        view
        returns (uint256 tokenId_)
    {
        tokenId_ = _uriHashToId[DICT.tokenURIHash(_tokenId)];
        require(_exists(tokenId_), "TellerNFT: invalid token ID");
    }
}
