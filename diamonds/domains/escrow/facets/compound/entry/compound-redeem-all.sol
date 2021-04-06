// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";
import "../internal/redeem.sol";
import "../internal/c-token.sol";

abstract contract ent_redeem_all_v1 is
    int_c_token,
    int_redeem,
    mod_onlyOwner_AccessControl
{
    /**
        @notice This function redeems the complete cToken balance.
        @param tokenAddress address of the token.
    */
    function redeemAll(address tokenAddress) public override onlyOwner {
        CErc20Interface cToken = _getCToken(tokenAddress);
        _redeem(cToken, cToken.balanceOf(address(this)), false);
    }
}

abstract contract ent_redeem_all is ent_redeem_all_v1 {}
