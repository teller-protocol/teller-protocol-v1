// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library sto_ERC721 {
    struct ERC721Storage {
        // Token name
        string name;
        // Token symbol
        string symbol;
        // Mapping from token ID to owner address
        mapping(uint256 => address) owners;
        // Mapping owner address to token count
        mapping(address => uint256) balances;
        // Mapping from token ID to approved address
        mapping(uint256 => address) tokenApprovals;
        // Mapping from owner to operator approvals
        mapping(address => mapping(address => bool)) operatorApprovals;
    }

    function erc721Store() internal pure returns (ERC721Storage storage s) {
        bytes32 position = keccak256("teller_protocol.ERC721_token");
        assembly {
            s.slot := position
        }
    }
}
