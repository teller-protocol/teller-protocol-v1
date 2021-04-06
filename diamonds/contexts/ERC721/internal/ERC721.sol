// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";
import { int_exists_ERC721_v1 } from "./exists.sol";
import { int_checkOnReceived_ERC721_v1 } from "./check-received.sol";
import { int_beforeTokenTransfer_ERC721_v1 } from "./before-token-transfer.sol";
import { int_metadata_ERC721_v1 } from "./metadata.sol";
import { int_approve_ERC721_v1 } from "./approve.sol";
import { int_transfer_ERC721_v1 } from "./transfer.sol";

// Libraries
import "@openzeppelin/contracts/utils/Address.sol";

abstract contract int_ERC721_v1 is
    sto_ERC721,
    int_exists_ERC721_v1,
    int_checkOnReceived_ERC721_v1,
    int_beforeTokenTransfer_ERC721_v1,
    int_metadata_ERC721_v1,
    int_approve_ERC721_v1,
    int_transfer_ERC721_v1
{
    using Address for address;

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * `_data` is additional data, it has no specified format and it is sent in call to `to`.
     *
     * This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
     * implement alternative mechanisms to perform token transfer, such as signature-based.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal virtual {
        require(
            _isApprovedOrOwner(msg.sender, tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        _transfer(from, to, tokenId);
        require(
            _checkOnERC721Received(from, to, tokenId, _data),
            "ERC721: transfer to non ERC721Receiver implementer"
        );
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId)
        internal
        view
        virtual
        returns (bool)
    {
        require(
            _exists(tokenId),
            "ERC721: operator query for nonexistent token"
        );
        address owner = erc721Store().owners[tokenId];
        return (spender == owner ||
            erc721Store().tokenApprovals[tokenId] == spender ||
            erc721Store().operatorApprovals[owner][spender]);
    }

    /**
     * @dev Returns whether `operator` is allowed to manage all of `owner` tokens.
     */
    function _isApprovedForAll(address owner, address operator)
        internal
        view
        virtual
        returns (bool)
    {
        return erc721Store().operatorApprovals[owner][operator];
    }

    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual {
        address owner = erc721Store().owners[tokenId];

        _beforeTokenTransfer(owner, address(0), tokenId);

        // Clear approvals
        _approve(address(0), tokenId);

        erc721Store().balances[owner] -= 1;
        delete erc721Store().owners[tokenId];

        emit Transfer(owner, address(0), tokenId);
    }

    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits a {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal override {
        erc721Store().tokenApprovals[tokenId] = to;
        emit Approval(erc721Store().owners[tokenId], to, tokenId);
    }
}
