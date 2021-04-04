// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PROTOCOL } from "../data/escrow.sol";
import "../storage/escrow.sol";
import { int_tokenBalanceOf_Escrow } from "../internal/token-balance-of.sol";
import { int_getLendingToken_Escrow } from "../internal/get-lending-token.sol";

abstract contract ext_calculateTotalValue_Escrow is
    ext_calculateTotalValue_Escrow_v1
{}

abstract contract ext_calculateTotalValue_Escrow_v1 is
    sto_Escrow,
    int_tokenBalanceOf_Escrow,
    int_getLendingToken_Escrow
{
    /**
     * @notice Calculate the value of the loan by getting the value of all tokens the Escrow owns.
     * @return Escrow total value denoted in the lending token.
     */
    function calculateTotalValue() external view returns (uint256) {
        uint256 valueInEth;
        address WETH_ADDRESS = PROTOCOL.getAsset("WETH");
        address ETH_ADDRESS = PROTOCOL.getAsset("ETH");
        address[] storage tokens = escrowStore().tokens;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == WETH_ADDRESS) {
                valueInEth = valueInEth.add(_balanceOf(tokens[i]));
            } else {
                valueInEth = valueInEth.add(
                    _valueOfIn(tokens[i], ETH_ADDRESS, _balanceOf(tokens[i]))
                );
            }
        }

        return PROTOCOL.valueFor(ETH_ADDRESS, _getLendingToken(), valueInEth);
    }
}
