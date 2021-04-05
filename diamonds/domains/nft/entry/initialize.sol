// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/ERC721/storage/ERC721.sol";
import "../../../contexts/initializable/modifiers/initializer.sol";
import "../../../contexts/access-control/internal/grant-role.sol";
import { MINTER } from "../roles.sol";

contract ent_initialize_NFT_v1 is
    sto_ERC721,
    mod_initializer_Initializable_v1,
    int_grantRole_AccessControl_v1
{
    /**
     * @notice Initializes the TellerNFT.
     * @param minters The addresses that should allowed to mint tokens.
     */
    function initialize(address[] calldata minters) external initializer {
        erc721Store().name = "Teller NFT";
        erc721Store().symbol = "TNFT";

        for (uint256 i; i < minters.length; i++) {
            _grantRole(MINTER, minters[i]);
        }
    }
}

contract ent_initialize_NFT is ent_initialize_NFT_v1 {}
