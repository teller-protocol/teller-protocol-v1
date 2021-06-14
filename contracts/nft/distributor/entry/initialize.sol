// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../store.sol";
import "../../../contexts/initializable/modifiers/initializer.sol";
import "../../../contexts/access-control/entry/grant-role.sol";

// Utils
import { ADMIN } from "../data.sol";

// Interfaces
import "../../ITellerNFT.sol";
import "../../TellerNFTDictionary.sol";

contract ent_initialize_NFTDistributor_v1 is
    sto_NFTDistributor,
    mod_initializer_Initializable_v1,
    ent_grantRole_AccessControl_v1
{
    /**
     * @notice Initializes the Distributor contract with the TellerNFT
     * @param _nft The address of the TellerNFT.
     * @param admin The address of an admin.
     */
    function initialize(
        address _nft,
        address _dictionary,
        address admin
    ) external initializer {
        distributorStore().nft = ITellerNFT(_nft);
        distributorStore().dictionary = TellerNFTDictionary(_dictionary);

        _grantRole(ADMIN, admin);
    }
}
