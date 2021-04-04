// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/escrow.sol";
import { int_tokenBalanceOf_Escrow } from "./token-balance-of.sol";

// Libraries
import "../../../libraries/AddressArrayLib.sol";

abstract contract int_tokenUpdated_Escrow is int_tokenUpdated_Escrow_v1 {}

abstract contract int_tokenUpdated_Escrow_v1 is
    sto_Escrow,
    int_tokenBalanceOf_Escrow
{
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
     * @notice Adds or removes tokens held by the Escrow contract
     * @param tokenAddress The token address to be added or removed
     */
    function _tokenUpdated(address tokenAddress) internal {
        (bool found, uint256 index) = tokens.getIndex(tokenAddress);
        if (_balanceOf(tokenAddress) > 0) {
            if (!found) {
                escrowStore().tokens.add(tokenAddress);
            }
        } else if (found) {
            tokens.remove(index);
        }
    }
}
