// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/tier.sol";
import {
    mod_authorized_AccessControl
} from "../../../contexts/access-control/modifiers/authorized.sol";
import { ADMIN } from "../roles.sol";

// Libraries
import "@openzeppelin/contracts/utils/Counters.sol";
import "../internal/set-contract-uri.sol";

contract ent_setContractURI_NFT_v1 is
    sto_Tier,
    mod_authorized_AccessControl,
    int_setContractURI_NFT
{
    /**
     * @notice Sets the contract level metadata URI.
     * @param contractURI The link to the initial contract level metadata.
     */
    function setContractURI(string memory contractURI)
        external
        authorized(ADMIN, msg.sender)
    {
        _setContractURI(contractURI);
    }
}

contract ent_setContractURI_NFT is ent_setContractURI_NFT_v1 {}
