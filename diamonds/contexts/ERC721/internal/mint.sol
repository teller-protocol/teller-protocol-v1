// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../data.sol";
import "../storage/ERC721.sol";
import { int_exists_ERC721_v1 } from "./exists.sol";
import { int_checkOnReceived_ERC721_v1 } from "./check-received.sol";
import { int_beforeTokenTransfer_ERC721_v1 } from "./before-token-transfer.sol";

abstract contract int_mint_ERC721_v1 is
    dat_ERC721,
    sto_ERC721,
    int_exists_ERC721_v1,
    int_checkOnReceived_ERC721_v1,
    int_beforeTokenTransfer_ERC721_v1
{
    /**
     * @dev Safely mints `tokenId` and transfers it to `to`.
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }

    /**
     * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`_safeMint`], with an additional `data` parameter which is
     * forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
     */
    function _safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal virtual {
        _mint(to, tokenId);
        require(
            _checkOnERC721Received(address(0), to, tokenId, _data),
            "ERC721: transfer to non ERC721Receiver implementer"
        );
    }

    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     *
     * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - `to` cannot be the zero address.
     *
     * Emits a {Transfer} event.
     */
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        _beforeTokenTransfer(address(0), to, tokenId);

        erc721Store().balances[to] += 1;
        erc721Store().owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }
}

abstract contract int_mint_ERC721 is int_mint_ERC721_v1 {}
