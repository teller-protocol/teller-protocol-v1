// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../contexts/ERC721/storage/ERC721.sol";
import "../../../contexts/initializable/modifiers/initializer.sol";
import "../../../contexts/access-control/internal/grant-role.sol";
import "diamonds/Roles.sol";

abstract contract ent_Initialize_v1 is
    sto_ERC721_v1,
    mod_initializer_Initializable_v1,
    int_grantRole_AccessControl_v1,
    Roles
{
    function initialize(address[] calldata minters) external initializer {
        erc721Store().name = "Teller NFT";
        erc721Store().symbol = "TNFT";

        for (uint256 i; i < minters.length; i++) {
            _grantRole(MINTER_ROLE, minters[i]);
        }
    }
}
