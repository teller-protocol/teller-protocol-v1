// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/ERC721/storage/ERC721.sol";
import {
    mod_initializer_Initializable
} from "../../../contexts/initializable/modifiers/initializer.sol";
import {
    int_grantRole_AccessControl
} from "../../../contexts/access-control/internal/grant-role.sol";
import { int_setContractURI_NFT } from "../internal/set-contract-uri.sol";
import { MINTER } from "../roles.sol";

import "../../../../contracts/base/diamond/libraries/LibDiamond.sol";

// Interfaces
import "../interfaces/ITellerNFT.sol";

contract ent_initialize_NFT_v1 is
    sto_ERC721,
    mod_initializer_Initializable,
    int_grantRole_AccessControl,
    int_setContractURI_NFT
{
    /**
     * @notice Initializes the TellerNFT.
     * @param minters The addresses that should allowed to mint tokens.
     * @param _contractURI The link to the initial contract level metadata.
     */
    function initialize(address[] calldata minters, string memory _contractURI)
        external
        initializer
    {
        erc721Store().name = "Teller NFT";
        erc721Store().symbol = "TNFT";

        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(ITellerNFT).interfaceId] = true;

        for (uint256 i; i < minters.length; i++) {
            _grantRole(MINTER, minters[i]);
        }

        _setContractURI(_contractURI);
    }
}

contract ent_initialize_NFT is ent_initialize_NFT_v1 {}
