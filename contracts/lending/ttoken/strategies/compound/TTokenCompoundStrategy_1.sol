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
import { LibMeta } from "../../../../shared/libraries/LibMeta.sol";
import {
    LibCompound
} from "../../../../escrow/dapps/libraries/LibCompound.sol";

// Storage
import "../../token-storage.sol" as TokenStorage;
import "./compound-storage.sol" as CompoundStorage;

contract TTokenCompoundStrategy_1 is RolesMods, TTokenStrategy {
    /**
     * @dev it creates a reference to the TToken storage
     */
    function() pure returns (TokenStorage.Store storage)
        private constant tokenStore = TokenStorage.store;

    /**
     * @dev it creates a reference to the Compound storage
     */
    function() pure returns (CompoundStorage.Store storage)
        private constant compoundStore = CompoundStorage.store;

    string public constant NAME = "CompoundStrategy_1";

    /* External Functions */

    /**
     * @notice it returns the total supply of an underlying asset in a Teller token.
     * @return uint256 the underlying supply
     */
    function totalUnderlyingSupply() external override returns (uint256) {
        return
            tokenStore().underlying.balanceOf(address(this)) +
            compoundStore().cToken.balanceOfUnderlying(address(this));
    }

    /**
     * @notice Rebalances the underlying asset held by the Teller Token.
     *
     * This strategy looks at the ratio of held underlying asset balance and balance deposited into
     * Compound. Based on the store {balanceRatioMin} and {balanceRatioMax} values, will deposit
     * (storedRatio > balanceRatioMax) or withdraw to keep the ratio within that range.
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
            require(
                compoundStore().cToken.mint(amountToDeposit) ==
                    LibCompound.NO_ERROR,
                "Teller: Strategy deposit error - Compound"
            );

            emit StrategyRebalanced(NAME, _msgSender());
        } else if (storedRatio < compoundStore().balanceRatioMin) {
            // Withdraw tokens from Compound
            _withdraw(0, storedBal, compoundBal);

            emit StrategyRebalanced(NAME, _msgSender());
        }
    }

    /**
     * @notice Rebalances the TToken funds by indicating a minimum {amount} of underlying tokens that must be present
     *  after the call.
     * @notice If the minimum amount is present, no rebalance happens.
     * @param amount Amount of underlying tokens that must be available.
     */
    function withdraw(uint256 amount) external override {
        (uint256 storedBal, uint256 compoundBal, ) = _getBalanceInfo();
        if (storedBal < amount) {
            _withdraw(amount, storedBal, compoundBal);
        }
    }

    /**
     * @notice it gets balances and the current ratio of the underlying asset stored on the TToken.
     * @return storedBalance_ returns the total stored balance of the current underlying token
     * @return compoundBalance_ returns the amount of underlying value stored in Compound
     * @return storedRatio_ ratio of current storedBalance_ over storedBalance_ and compoundBalance_
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
     * @notice it rebalances funds stored on the TToken by indicating an extra {amount} to withdraw.
     */
    function _withdraw(
        uint256 amount,
        uint256 storedBal,
        uint256 compoundBal
    ) internal {
        // Calculate amount to rebalance
        uint16 medianRatio =
            (compoundStore().balanceRatioMax +
                compoundStore().balanceRatioMin) / 2;
        uint256 requiredBal =
            NumbersLib.percent(storedBal + compoundBal - amount, medianRatio);
        uint256 redeemAmount = requiredBal + amount - storedBal;
        // Withdraw tokens from Compound if needed
        require(
            compoundStore().cToken.redeemUnderlying(redeemAmount) ==
                LibCompound.NO_ERROR,
            "Teller: Strategy withdraw error - Compound"
        );
    }

    /**
     * @notice Sets the Compound token that should be used to manage the underlying Teller Token asset.
     * @param cTokenAddress Address of the Compound token that has the same underlying asset as the TToken.
     * @param balanceRatioMin Percentage indicating the _ limit of underlying token balance should remain on the TToken
     * @param balanceRatioMax Percentage indicating the _ limit of underlying token balance should remain on the TToken
     * @dev Note that the balanceRatio percentages have to be scaled by ONE_HUNDRED_PERCENT
     */
    function init(
        address cTokenAddress,
        uint16 balanceRatioMin,
        uint16 balanceRatioMax
    ) external {
        require(
            balanceRatioMax > balanceRatioMin,
            "Teller: Max ratio balance should be greater than Min ratio balance"
        );
        compoundStore().cToken = ICErc20(cTokenAddress);
        compoundStore().balanceRatioMin = balanceRatioMin;
        compoundStore().balanceRatioMax = balanceRatioMax;
        emit StrategyInitialized(NAME, cTokenAddress, LibMeta.msgSender());
    }
}
