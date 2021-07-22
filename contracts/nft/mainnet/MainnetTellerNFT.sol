// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT_V2 } from "../TellerNFT_V2.sol";
import { TellerNFTDictionary } from "../TellerNFTDictionary.sol";
import { IERC721ReceiverUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

contract MainnetTellerNFT is IERC721ReceiverUpgradeable, TellerNFT_V2 {
    /* Constants */

    address public constant V1 = 0x2ceB85a2402C94305526ab108e7597a102D6C175;
    TellerNFTDictionary public constant DICT =
        TellerNFTDictionary(0x72733102AB139FB0367cc29D492c955A7c736079);

    /* Public Functions */

    /* External Functions */

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
            // Convert V1 token ID and mint 1 new V2 token
            _mint(from, _convertV1TokenId(tokenId), 1, "");
        }

        return IERC721ReceiverUpgradeable.onERC721Received.selector;
    }

    /* Internal Functions */

    function _convertV1TokenId(uint256 _tokenId)
        internal
        view
        returns (uint256 tokenId_)
    {
        tokenId_ = _uriHashToId[DICT.tokenURIHash(_tokenId)];
        require(_exists(tokenId_), "TellerNFT: invalid token ID");
    }
}
