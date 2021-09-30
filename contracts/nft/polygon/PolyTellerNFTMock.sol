// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PolyTellerNFT } from "./PolyTellerNFT.sol";

contract PolyTellerNFTMock is PolyTellerNFT {
    function __TellerNFT_V2_init_unchained(bytes calldata data)
        internal
        override
        initializer
    {
        // Mock the child chain manager to be the deployer address
        _setupRole(DEPOSITOR, _msgSender());
    }

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
    ) external {
        // Get the token ID to mint for the user
        // On a fresh mint, the exact token ID minted is determined on tx execution
        //  with sudo randomness using the block number
        uint256 tokenId = _mergeTokenId(
            tierIndex,
            uint128(block.number % tierTokenCount[tierIndex])
        );
        _mint(owner, tokenId, uint256(amount), "");
    }

    function addDepositor(address newDepositor) public {
        _setupRole(DEPOSITOR, newDepositor);
    }
}
