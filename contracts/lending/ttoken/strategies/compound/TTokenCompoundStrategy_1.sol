// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// contracts
import {
    RolesMods
} from "../../../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../../data.sol";

// Interfaces
import { ICErc20 } from "../../../../shared/interfaces/ICErc20.sol";
import { TTokenStrategy } from "../TTokenStrategy.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { NumbersLib } from "../../../../shared/libraries/NumbersLib.sol";

// Storage
import "../../storage.sol" as TokenStorage;
import "./storage.sol" as CompoundStorage;

contract TTokenCompoundStrategy_1 is RolesMods, TTokenStrategy {
    function() pure returns (TokenStorage.Store storage)
        private constant tokenStore = TokenStorage.store;

    function() pure returns (CompoundStorage.Store storage)
        private constant compoundStore = CompoundStorage.store;

    string public constant NAME = "CompoundStrategy_1";

    /* External Functions */

    function totalUnderlyingSupply() external override returns (uint256) {
        return
            tokenStore().underlying.balanceOf(address(this)) +
            compoundStore().cToken.balanceOfUnderlying(address(this));
    }

    /**
     * @notice Rebalances the underlying asset held by the Teller Token.
     *
     * This strategy looks at the ratio of held underlying asset balance and balance deposited into
     * Compound. Based on the store {balanceRatioMin} and {balanceRatioMax} values, will deposit or
     * withdraw to keep the ratio within that range.
     */
    function rebalance() public override {
        (uint256 storedBal, uint256 compoundBal, uint16 storedRatio) =
            _getBalanceInfo();
        if (storedRatio > compoundStore().balanceRatioMax) {
            // Calculate median ratio to rebalance to
            uint16 medianRatio =
                (compoundStore().balanceRatioMax +
                    compoundStore().balanceRatioMin) / 2;
            uint256 requiredBal =
                NumbersLib.percent(storedBal + compoundBal, medianRatio);
            uint256 amountToDeposit = storedBal - requiredBal;

            // Allow Compound to take underlying tokens
            SafeERC20.safeIncreaseAllowance(
                tokenStore().underlying,
                address(compoundStore().cToken),
                amountToDeposit
            );
            // Deposit tokens into Compound
            compoundStore().cToken.mint(amountToDeposit);

            emit StrategyRebalanced(NAME, msg.sender);
        } else if (storedRatio < compoundStore().balanceRatioMin) {
            // Withdraw tokens from Compound
            _withdraw(0, storedBal, compoundBal, storedRatio);

            emit StrategyRebalanced(NAME, msg.sender);
        }
    }

    /**
     * @notice Rebalances the TToken funds by indicating a minimum {amount} of underlying tokens that must be present
     *  after the call.
     * @notice If the minimum amount is present, no rebalance happens.
     * @param amount Amount of underlying tokens that must be available.
     */
    function withdraw(uint256 amount) external override {
        (uint256 storedBal, uint256 compoundBal, uint16 storedRatio) =
            _getBalanceInfo();
        if (storedBal < amount) {
            _withdraw(amount, storedBal, compoundBal, storedRatio);
        }
    }

    /**
     * @dev Gets balances and the current ratio of the underlying asset stored on the TToken.
     */
    function _getBalanceInfo()
        internal
        returns (
            uint256 storedBalance_,
            uint256 compoundBalance_,
            uint16 storedRatio_
        )
    {
        storedBalance_ = tokenStore().underlying.balanceOf(address(this));
        compoundBalance_ = compoundStore().cToken.balanceOfUnderlying(
            address(this)
        );
        storedRatio_ = NumbersLib.ratioOf(
            storedBalance_,
            storedBalance_ + compoundBalance_
        );
    }

    /**
     * @dev Rebalances funds stored on the TToken by indicating an extra {amount} to withdraw.
     */
    function _withdraw(
        uint256 amount,
        uint256 storedBal,
        uint256 compoundBal,
        uint16 storedRatio
    ) internal {
        // Calculate amount to rebalance
        uint16 medianRatio =
            (compoundStore().balanceRatioMax +
                compoundStore().balanceRatioMin) / 2;
        uint256 requiredBal =
            NumbersLib.percent(
                storedBal + compoundBal - amount,
                medianRatio - storedRatio
            );
        uint256 redeemAmount = amount - storedBal + requiredBal;
        // Withdraw tokens from Compound if needed
        compoundStore().cToken.redeemUnderlying(redeemAmount);
    }

    /**
     * @notice Sets the Compound token that should be used to manage the underlying Teller Token asset.
     * @param cTokenAddress Address of the Compound token that has the same underlying asset as the TToken.
     * @param balanceRatioMin Percentage indicating the _ limit of underlying token balance should remain on the TToken
     * @param balanceRatioMax Percentage indicating the _ limit of underlying token balance should remain on the TToken
     */
    function init(
        address cTokenAddress,
        uint16 balanceRatioMin,
        uint16 balanceRatioMax
    ) external {
        compoundStore().cToken = ICErc20(cTokenAddress);
        compoundStore().balanceRatioMin = balanceRatioMin;
        compoundStore().balanceRatioMax = balanceRatioMax;
    }
}
