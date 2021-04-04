// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/escrow.sol";
import "../../../contexts/initializable/modifiers/initializer.sol";
import {
    int_setOwner_AccessControl
} from "../../../contexts/access-control/internal/set-owner.sol";

abstract contract ent_Initialize_v1 is
    sto_Escrow,
    mod_initializer_Initializable_v1,
    int_setOwner_AccessControl
{
    function initialize(address marketAddress, uint256 loanID)
        external
        initializer
    {
        escrowStore().market = IMarket(marketAddress);
        escrowStore().loanID = loanID;

        _setOwner(escrowStore().market.loans);
    }
}
