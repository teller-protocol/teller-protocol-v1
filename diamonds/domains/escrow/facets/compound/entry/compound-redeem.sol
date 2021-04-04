// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";
import "../internal/redeem.sol";
import "../internal/c-token.sol";

abstract contract ent_redeem is ent_redeem_v1 {}

abstract contract ent_redeem_v1 is
    int_c_token,
    int_redeem,
    mod_onlyOwner_AccessControl
{
    /**
        @notice This function redeems the user's cTokens for a specific amount of the underlying token.
        @param tokenAddress address of the token.
        @param amount amount of underlying tokens to redeem.
    */
    function redeem(address tokenAddress, uint256 amount)
        public
        override
        onlyOwner
    {
        CErc20Interface cToken = _getCToken(tokenAddress);
        _redeem(cToken, amount, true);
    }
}
