// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../storage/escrow.sol";

abstract contract int_getLendingToken_Escrow is int_getLendingToken_Escrow_v1 {}

abstract contract int_getLendingToken_Escrow_v1 is sto_Escrow {
    function _getLendingToken() internal view returns (address) {
        return escrowStore().market.lendingToken();
    }
}
