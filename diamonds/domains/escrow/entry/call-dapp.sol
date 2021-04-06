// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { Dapp, DappData } from "../data/dapp.sol";
import "../storage/escrow.sol";
import { sto_DappRegistry } from "../storage/dapp-registry.sol";
import {
    mod_onlyOwner_AccessControl
} from "../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../protocol/interfaces/IProtocol.sol";

abstract contract ent_CallDapp_v1 is
    sto_Escrow,
    sto_DappRegistry,
    mod_onlyOwner_AccessControl
{
    /**
     * @notice It calls a given dapp using a delegatecall for this Escrow to interact with.
     * @param dappData the current dapp data to be executed.
     */
    function callDapp(DappData calldata dappData) external onlyOwner {
        Dapp memory dapp = dappStore().dapps[dappData.location];
        require(dapp.exists, "Escrow: dapp not whitelisted");
        require(
            dapp.unsecured ||
                escrowStore().market.isLoanSecured(escrowStore().loanID),
            "Escrow: loan unsecured dapp not allowed"
        );

        (bool success, ) = dappData.location.delegatecall(dappData.data);

        if (!success) {
            assembly {
                let ptr := mload(0x40)
                let size := returndatasize()
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }
    }
}

abstract contract ent_CallDapp is ent_CallDapp_v1 {}
