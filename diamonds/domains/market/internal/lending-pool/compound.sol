// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../storage/lending-pool.sol";
import "../../../../providers/compound/CErc20Interface.sol";

abstract contract int_compound_LendinPool_v1 is sto_LendingPool_v1 {
    using SafeERC20 for ERC20;

    /**
        @notice It deposits a given amount of tokens to Compound.
        @dev The cToken address must be defined in AssetSettings.
        @dev The underlying token value of the tokens to be deposited must be positive. Because the decimals of
            cTokens and the underlying asset can differ, the deposit of dust tokens may result in no cTokens minted.
        @param amount The amount of underlying tokens to deposit.
        @return difference The amount of underlying tokens deposited.
     */
    function _depositToCompoundIfSupported(uint256 amount)
        internal
        returns (uint256 difference)
    {
        CErc20Interface cToken = CErc20Interface(getLendingPool().cToken);
        ERC20 lendingToken = ERC20(getLendingPool().lendingToken);

        if (address(cToken) == address(0)) {
            return 0;
        }

        // approve the cToken contract to take lending tokens
        lendingToken.safeApprove(address(cToken), amount);

        uint256 balanceBefore = lendingToken.balanceOf(address(this));

        // Now mint cTokens, which will take lending tokens
        uint256 mintResult = cToken.mint(amount);
        require(mintResult == 0, "COMPOUND_DEPOSIT_ERROR");

        uint256 balanceAfter = lendingToken.balanceOf(address(this));
        difference = balanceBefore - balanceAfter;
        require(difference > 0, "DEPOSIT_CTOKEN_DUST");
    }

    /**
        @notice It withdraws a given amount of tokens from Compound.
        @param amount The amount of underlying tokens to withdraw.
        @return The amount of underlying tokens withdrawn.
     */
    function _withdrawFromCompoundIfSupported(uint256 amount)
        internal
        returns (uint256)
    {
        CErc20Interface cToken = CErc20Interface(getLendingPool().cToken);

        if (address(cToken) == address(0)) {
            return 0;
        }

        uint256 balanceBefore =
            getLendingPool().lendingToken.balanceOf(address(this));

        uint256 redeemResult = cToken.redeemUnderlying(amount);
        require(redeemResult == 0, "COMPOUND_REDEEM_UNDERLYING_ERROR");

        uint256 balanceAfter =
            getLendingPool().lendingToken.balanceOf(address(this));
        return balanceAfter - (balanceBefore);
    }
}
