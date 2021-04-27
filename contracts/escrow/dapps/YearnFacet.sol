// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { DappMods } from "./DappMods.sol";
import { PausableMods } from "../../settings/pausable/PausableMods.sol";
import { LibDapps } from "./libraries/LibDapps.sol";
import { LibEscrow } from "../libraries/LibEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IVault } from "./interfaces/IVault.sol";

contract YearnFacet is PausableMods, DappMods {
    using SafeERC20 for IERC20;

    /**
        @notice This event is emitted when a yVault deposit is invoked successfully
        @param iVault The address of the yVault
        @param amount The amount of funds to deposit
        @param tokenBalanceBeforeDeposit The balance of tokens held after depositing
        @param tokenBalanceAfterDeposit The balance of tokens held after depositing
     */
    event YearnDeposited(
        address tokenAddress,
        address iVault,
        uint256 amount,
        uint256 tokenBalanceBeforeDeposit,
        uint256 tokenBalanceAfterDeposit
    );

    /**
        @notice This event is emitted when a yVault withdraw is invoked successfully
        @param underlyingToken The address of the underlying token of the vault
        @param iVault The address of the yVault
        @param amount The amount of funds to withdraw
        @param tokenBalanceBeforeWithdrawal The balance of tokens held before withdrawal
        @param tokenBalanceAfterWithdrawal The balance of tokens held after withdrawal
     */
    event YearnWithdrawn(
        address underlyingToken,
        address iVault,
        uint256 amount,
        uint256 tokenBalanceBeforeWithdrawal,
        uint256 tokenBalanceAfterWithdrawal
    );

    /**
        @notice Deposits the specified amount of the native unwrapped token (same as token() returns) into the Vault
        @param loanID The id of the loan being used
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function yearnDeposit(
        uint256 loanID,
        address tokenAddress,
        uint256 amount
    ) public paused("", false) onlyBorrower(loanID) {
        IVault iVault = LibDapps.getYVault(tokenAddress);
        uint256 tokenBalanceBeforeDeposit = iVault.balanceOf(address(this));
        IERC20(tokenAddress).safeApprove(address(iVault), amount);

        bytes memory callData = abi.encode(IVault.deposit.selector, amount);
        LibDapps.s().loanEscrows[loanID].callDapp(address(iVault), callData);

        uint256 tokenBalanceAfterDeposit = iVault.balanceOf(address(this));
        require(
            tokenBalanceAfterDeposit > tokenBalanceBeforeDeposit,
            "YEARN_BALANCE_NOT_INCREASED"
        );

        LibEscrow.tokenUpdated(loanID, tokenAddress);
        LibEscrow.tokenUpdated(loanID, address(iVault));

        emit YearnDeposited(
            tokenAddress,
            address(iVault),
            amount,
            tokenBalanceBeforeDeposit,
            tokenBalanceAfterDeposit
        );
    }

    /**
        @notice Withdraws the specified amount of the native unwrapped token (same as token() returns) from the Vault
        @param loanID the id of the loan being used
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function yearnWithdraw(
        uint256 loanID,
        address tokenAddress,
        uint256 amount
    ) public paused("", false) onlyBorrower(loanID) {
        IVault iVault = LibDapps.getYVault(tokenAddress);
        uint256 price = iVault.getPricePerShare();
        uint256 shares = amount / price;
        uint256 tokenBalanceBeforeWithdrawal =
            IERC20(tokenAddress).balanceOf(address(this));
        require(
            shares >= iVault.balanceOf(address(this)),
            "INSUFFICIENT_DEPOSIT"
        );

        bytes memory callData = abi.encode(IVault.withdraw.selector, shares);
        LibDapps.s().loanEscrows[loanID].callDapp(address(iVault), callData);

        uint256 tokenBalanceAfterWithdrawal =
            IERC20(tokenAddress).balanceOf(address(this));
        require(
            tokenBalanceAfterWithdrawal > tokenBalanceBeforeWithdrawal,
            "WITHDRAWAL_UNSUCCESSFUL"
        );

        LibEscrow.tokenUpdated(loanID, tokenAddress);
        LibEscrow.tokenUpdated(loanID, address(iVault));

        emit YearnWithdrawn(
            iVault.token(),
            address(iVault),
            amount,
            tokenBalanceBeforeWithdrawal,
            tokenBalanceAfterWithdrawal
        );
    }

    /**
        @notice Redeems all funds from a yVault from a previous deposit
        @param loanID the id of the loan being used
        @param tokenAddress The address of the token being deposited
     */
    function yearnWithdrawAll(uint256 loanID, address tokenAddress)
        public
        paused("", false)
        onlyBorrower(loanID)
    {
        IVault iVault = LibDapps.getYVault(tokenAddress);
        uint256 tokenBalanceBeforeWithdrawal =
            IERC20(tokenAddress).balanceOf(address(this));

        bytes memory callData = abi.encode(IVault.withdrawAll.selector);
        LibDapps.s().loanEscrows[loanID].callDapp(address(iVault), callData);

        uint256 tokenBalanceAfterWithdrawal =
            IERC20(tokenAddress).balanceOf(address(this));
        require(
            tokenBalanceAfterWithdrawal > tokenBalanceBeforeWithdrawal,
            "WITHDRAWAL_UNSUCCESSFUL"
        );

        LibEscrow.tokenUpdated(loanID, tokenAddress);
        LibEscrow.tokenUpdated(loanID, address(iVault));

        emit YearnWithdrawn(
            iVault.token(),
            address(iVault),
            tokenBalanceBeforeWithdrawal,
            tokenBalanceBeforeWithdrawal,
            tokenBalanceAfterWithdrawal
        );
    }
}
