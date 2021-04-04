// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/c-token.sol";

abstract contract ent_lend is ent_lend_v1 {}

abstract contract ent_lend_v1 is
    int_tokenUpdated_Escrow,
    int_c_token,
    mod_onlyOwner_AccessControl
{
    /**
        @notice To lend we first have to approve the cToken to access the token balance then mint.
        @param tokenAddress address of the token.
        @param amount amount of tokens to mint.
    */
    function lend(address tokenAddress, uint256 amount)
        public
        override
        onlyBorrower
    {
        require(
            _balanceOf(tokenAddress) >= amount,
            "COMPOUND_INSUFFICIENT_UNDERLYING"
        );

        CErc20Interface cToken = _getCToken(tokenAddress);
        IERC20(tokenAddress).safeApprove(address(cToken), amount);
        uint256 result = cToken.mint(amount);
        require(result == NO_ERROR, "COMPOUND_DEPOSIT_ERROR");

        _tokenUpdated(address(cToken));
        _tokenUpdated(tokenAddress);

        emit CompoundLended(
            tokenAddress,
            address(cToken),
            amount,
            _balanceOf(tokenAddress),
            cToken.balanceOf(address(this))
        );
    }
}
