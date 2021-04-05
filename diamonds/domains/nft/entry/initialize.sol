// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/ERC721/storage/ERC721.sol";
import "../../../contexts/initializable/modifiers/initializer.sol";
import "../../../contexts/access-control/internal/grant-role.sol";
import { MINTER } from "../data.sol";

contract ent_initialize_NFT_v1 is
    mod_initializer_Initializable_v1,
    int_grantRole_AccessControl_v1
{
    function initialize(address[] calldata minters) external initializer {
        sto_ERC721.erc721Store().name = "Teller NFT";
        sto_ERC721.erc721Store().symbol = "TNFT";

        for (uint256 i; i < minters.length; i++) {
            _grantRole(MINTER, minters[i]);
        }
    }
}
