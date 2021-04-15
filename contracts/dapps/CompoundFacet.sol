// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { MarketStorageLib, LendingPool } from "../storage/market.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { LoansMods } from "../market/LoansMods.sol";
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";
import { LibDapps } from "./libraries/LibDapps.sol";
import { ICErc20 } from "../shared/interfaces/ICErc20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CompoundFacet is RolesMods, PausableMods, LoansMods {
    using SafeERC20 for IERC20;

    /* Error Codes */

    uint256 public constant NO_ERROR = 0;

    // @notice Caller does not have sufficient balance in the ERC-20 contract to complete the desired action.
    uint256 public constant TOKEN_INSUFFICIENT_BALANCE = 13;

    /**
        @notice This event is emitted every time Compound lend is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param cTokenAddress compound token address.
        @param amount amount of tokens to Lend.
        @param tokenBalance underlying token balance after Lend.
        @param cTokenBalance cTokens balance after Lend.
     */
    event CompoundLended(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount,
        uint256 tokenBalance,
        uint256 cTokenBalance
    );

    /**
        @notice This event is emitted every time Compound redeem is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param cTokenAddress compound token address.
        @param amount amount of tokens to Redeem.
        @param isUnderlyingAmount boolean indicating if the amount was in the underlying token.
        @param tokenBalance underlying token balance after Redeem.
        @param cTokenBalance cTokens balance after Redeem.
     */
    event CompoundRedeemed(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount,
        bool isUnderlyingAmount,
        uint256 tokenBalance,
        uint256 cTokenBalance
    );

    /**
        @notice To lend we first have to approve the cToken to access the token balance then mint.
        @param loanID id of the loan being used in the dapp
        @param tokenAddress address of the token.
        @param amount amount of tokens to mint.
    */
    function compoundLend(
        uint256 loanID,
        address tokenAddress,
        uint256 amount
    ) public loanActiveOrSet(loanID) paused("", false) onlyBorrower(loanID) {
        require(
            LibDapps.balanceOf(loanID, tokenAddress) >= amount,
            "COMPOUND_INSUFFICIENT_UNDERLYING"
        );

        ICErc20 cToken =
            MarketStorageLib.marketStore().lendingPool[tokenAddress].cToken;
        IERC20(tokenAddress).safeApprove(address(cToken), amount);
        uint256 result = cToken.mint(amount);
        require(result == NO_ERROR, "COMPOUND_DEPOSIT_ERROR");

        LibDapps.tokenUpdated(loanID, address(cToken));
        LibDapps.tokenUpdated(loanID, tokenAddress);

        emit CompoundLended(
            tokenAddress,
            address(cToken),
            amount,
            LibDapps.balanceOf(loanID, tokenAddress),
            cToken.balanceOf(address(this))
        );
    }

    /**
        @notice This function redeems the user's cTokens for a specific amount of the underlying token.
        @param loanID id of the loan being used in the dapp
        @param tokenAddress address of the token.
        @param amount amount of underlying tokens to redeem.
    */
    function compoundRedeem(
        uint256 loanID,
        address tokenAddress,
        uint256 amount
    ) public loanActiveOrSet(loanID) paused("", false) onlyBorrower(loanID) {
        ICErc20 cToken =
            MarketStorageLib.marketStore().lendingPool[tokenAddress].cToken;
        _redeem(loanID, cToken, amount, true);
    }

    /**
        @notice This function redeems the complete cToken balance.
        @param loanID id of the loan being used in the dapp
        @param tokenAddress address of the token.
    */
    function CompoundRedeemAll(uint256 loanID, address tokenAddress)
        public
        loanActiveOrSet(loanID)
        paused("", false)
        onlyBorrower(loanID)
    {
        ICErc20 cToken =
            MarketStorageLib.marketStore().lendingPool[tokenAddress].cToken;
        _redeem(loanID, cToken, cToken.balanceOf(address(this)), false);
    }

    /**
        @notice This function calls on Compound cToken to redeem an amount of the underlying token.
        @param loanID id of the loan being used in the dapp
        @param cToken the instance of the cToken.
        @param amount amount of cToken or underlying token to redeem.
        @param isUnderlying boolean indicating if the amount to redeem is in the underlying token amount.
    */
    function _redeem(
        uint256 loanID,
        ICErc20 cToken,
        uint256 amount,
        bool isUnderlying
    ) internal {
        address tokenAddress = cToken.underlying();
        uint256 result =
            isUnderlying
                ? cToken.redeemUnderlying(amount)
                : cToken.redeem(amount);
        require(
            result != TOKEN_INSUFFICIENT_BALANCE,
            "COMPOUND_INSUFFICIENT_BALANCE"
        );
        require(result == NO_ERROR, "COMPOUND_WITHDRAWAL_ERROR");

        LibDapps.tokenUpdated(loanID, address(cToken));
        LibDapps.tokenUpdated(loanID, tokenAddress);

        emit CompoundRedeemed(
            tokenAddress,
            address(cToken),
            amount,
            isUnderlying,
            LibDapps.balanceOf(loanID, tokenAddress),
            cToken.balanceOf(address(this))
        );
    }
}
