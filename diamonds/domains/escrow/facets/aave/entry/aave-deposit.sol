// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/a-token.sol";

abstract contract ent_deposit_v1 is
    int_tokenUpdated_Escrow,
    int_a_token,
    mod_onlyOwner_AccessControl
{
    /**
        @notice This event is emitted every time Aave deposit is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param aTokenAddress aave token address.
        @param amount amount of tokens to Deposit.
        @param aTokenBalanceBeforeDeposit aTokens balance after Deposit.
        @param aTokenBalanceAfterDeposit aTokens balance after Deposit.
     */
    event AaveDeposited(
        address indexed tokenAddress,
        address indexed aTokenAddress,
        uint256 amount,
        uint256 aTokenBalanceBeforeDeposit,
        uint256 aTokenBalanceAfterDeposit
    );

    /**
        @notice The deposit, the aToken needs to be approved to have access to the token balance
        @param tokenAddress address of the token
        @param amount amount of tokens to deposit
     */
    function deposit(address tokenAddress, uint256 amount)
        public
        override
        onlyOwner
    {
        IAaveLendingPool aaveLendingPool = _getAaveLendingPool();
        IAToken aToken = _getAToken(tokenAddress);
        uint256 aTokenBalanceBeforeDeposit = aToken.balanceOf(address(this));
        IERC20(tokenAddress).safeApprove(address(aaveLendingPool), amount);
        aaveLendingPool.deposit(tokenAddress, amount, address(this), 0);
        uint256 aTokenBalanceAfterDeposit = aToken.balanceOf(address(this));
        require(
            aTokenBalanceAfterDeposit > aTokenBalanceBeforeDeposit,
            "AAVE_BALANCE_NOT_INCREASED"
        );

        _tokenUpdated(address(aToken));
        _tokenUpdated(tokenAddress);

        emit AaveDeposited(
            tokenAddress,
            address(aToken),
            amount,
            aTokenBalanceBeforeDeposit,
            aTokenBalanceAfterDeposit
        );
    }
}

abstract contract ent_deposit is ent_deposit_v1 {}
