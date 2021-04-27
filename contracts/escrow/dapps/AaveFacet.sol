// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { DappMods } from "./DappMods.sol";
import { PausableMods } from "../../settings/pausable/PausableMods.sol";
import { LibDapps } from "./libraries/LibDapps.sol";
import { LibEscrow } from "../libraries/LibEscrow.sol";
import { IAToken } from "./interfaces/IAToken.sol";
import { IAaveLendingPool } from "./interfaces/IAaveLendingPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AaveFacet is PausableMods, DappMods {
    using SafeERC20 for IERC20;
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
        @notice This event is emitted every time Aave redeem is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param aTokenAddress aave token address.
        @param amount amount of tokens to Withdrawal.
        @param aTokenBalanceBeforeDeposit aTokens balance after Withdrawal.
        @param aTokenBalanceAfterWithdrawal aTokens balance after Withdrawal.
     */
    event AaveWithdrawn(
        address indexed tokenAddress,
        address indexed aTokenAddress,
        uint256 amount,
        uint256 aTokenBalanceBeforeDeposit,
        uint256 aTokenBalanceAfterWithdrawal
    );

    /**
        @notice The deposit, the aToken needs to be approved to have access to the token balance
        @param loanID id of the loan being used in the dapp
        @param tokenAddress address of the token
        @param amount amount of tokens to deposit
     */
    function aaveDeposit(
        uint256 loanID,
        address tokenAddress,
        uint256 amount
    ) public paused("", false) onlyBorrower(loanID) {
        IAaveLendingPool aaveLendingPool = LibDapps.getAaveLendingPool();
        IAToken aToken = LibDapps.getAToken(tokenAddress);
        uint256 aTokenBalanceBeforeDeposit = aToken.balanceOf(address(this));
        IERC20(tokenAddress).safeApprove(address(aaveLendingPool), amount);

        bytes memory callData =
            abi.encode(
                IAaveLendingPool.deposit.selector,
                tokenAddress,
                amount,
                address(this),
                0
            );
        LibDapps.s().loanEscrows[loanID].callDapp(
            address(aaveLendingPool),
            callData
        );

        uint256 aTokenBalanceAfterDeposit = aToken.balanceOf(address(this));
        require(
            aTokenBalanceAfterDeposit > aTokenBalanceBeforeDeposit,
            "AAVE_BALANCE_NOT_INCREASED"
        );

        LibEscrow.tokenUpdated(loanID, address(aToken));
        LibEscrow.tokenUpdated(loanID, tokenAddress);

        emit AaveDeposited(
            tokenAddress,
            address(aToken),
            amount,
            aTokenBalanceBeforeDeposit,
            aTokenBalanceAfterDeposit
        );
    }

    /**
        @notice This function withdraws the user's aTokens for a specific amount
        @param loanID id of the loan being used in the dapp
        @param tokenAddress address of the token
        @param amount amount of the underlying tokens to withdraw
     */
    function aaveWithdraw(
        uint256 loanID,
        address tokenAddress,
        uint256 amount
    ) public paused("", false) onlyBorrower(loanID) {
        IAToken aToken = LibDapps.getAToken(tokenAddress);
        IAaveLendingPool aaveLendingPool = LibDapps.getAaveLendingPool();
        uint256 aTokenBalanceBeforeWithdraw = aToken.balanceOf(address(this));
        require(
            aTokenBalanceBeforeWithdraw >= amount,
            "NO_BALANCE_TO_WITHDRAW"
        );

        bytes memory callData =
            abi.encode(
                IAaveLendingPool.withdraw.selector,
                tokenAddress,
                amount,
                address(this)
            );
        LibDapps.s().loanEscrows[loanID].callDapp(
            address(aaveLendingPool),
            callData
        );

        uint256 aTokenBalanceAfterWithdraw = aToken.balanceOf(address(this));
        require(
            aTokenBalanceAfterWithdraw < aTokenBalanceBeforeWithdraw,
            "AAVE_WITHDRAWAL_ERROR"
        );

        LibEscrow.tokenUpdated(loanID, address(aToken));
        LibEscrow.tokenUpdated(loanID, tokenAddress);

        emit AaveWithdrawn(
            tokenAddress,
            address(aToken),
            amount,
            aTokenBalanceBeforeWithdraw,
            aTokenBalanceAfterWithdraw
        );
    }

    /**
        @notice This function withdraws all the user's aTokens from previous deposits
        @param loanID id of the loan being used in the dapp
        @param tokenAddress address of the token
     */
    function aaveWithdrawAll(uint256 loanID, address tokenAddress)
        public
        paused("", false)
        onlyBorrower(loanID)
    {
        IAToken aToken = LibDapps.getAToken(tokenAddress);

        uint256 aTokenBalanceBeforeWithdraw = aToken.balanceOf(address(this));
        require(aTokenBalanceBeforeWithdraw >= 0, "NO_BALANCE_TO_WITHDRAW");

        IAaveLendingPool aaveLendingPool = LibDapps.getAaveLendingPool();

        bytes memory callData =
            abi.encode(
                IAaveLendingPool.withdraw.selector,
                tokenAddress,
                aTokenBalanceBeforeWithdraw,
                address(this)
            );
        LibDapps.s().loanEscrows[loanID].callDapp(
            address(aaveLendingPool),
            callData
        );

        uint256 aTokenBalanceAfterWithdraw = aToken.balanceOf(address(this));
        require(aTokenBalanceAfterWithdraw == 0, "AAVE_WITHDRAWAL_ERROR");

        LibEscrow.tokenUpdated(loanID, address(aToken));
        LibEscrow.tokenUpdated(loanID, tokenAddress);

        emit AaveWithdrawn(
            tokenAddress,
            address(aToken),
            aTokenBalanceBeforeWithdraw,
            aTokenBalanceBeforeWithdraw,
            aTokenBalanceAfterWithdraw
        );
    }
}
