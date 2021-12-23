// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TTokenCompoundStrategy_1 } from "./TTokenCompoundStrategy_1.sol";

// Interfaces
import { ICErc20 } from "../../../../shared/interfaces/ICErc20.sol";
import { LibMeta } from "../../../../shared/libraries/LibMeta.sol";

contract TTokenCompoundStrategy_2 is TTokenCompoundStrategy_1 {
    /* External Functions */

    function totalUnderlyingSupply() public override returns (uint256) {
        // Get current supply
        uint256 currentSupply = super.totalUnderlyingSupply();
        // Calculate bonus interest due
        uint256 bonusInterest = ((currentSupply * 10) / 100) *
            ((block.timestamp - compoundStore().lastBonusIntTimestamp) /
                365 days);
        // Deposit into
        tokenStore().underlying.transferFrom(
            compoundStore().bonusGnosisSafe,
            address(this),
            bonusInterest
        );

        return currentSupply + bonusInterest;
    }

    /**
     * @notice Sets the Compound token that should be used to manage the underlying Teller Token asset.
     * @param cTokenAddress Address of the Compound token that has the same underlying asset as the TToken.
     * @param balanceRatioMin Percentage indicating the _ limit of underlying token balance should remain on the TToken
     * @param balanceRatioMax Percentage indicating the _ limit of underlying token balance should remain on the TToken
     * @param bonusGnosisSafe The address of the gnosisSafe to pull funds from for bonus interest
     * @dev Note that the balanceRatio percentages have to be scaled by ONE_HUNDRED_PERCENT
     */
    function init(
        address cTokenAddress,
        uint16 balanceRatioMin,
        uint16 balanceRatioMax,
        address bonusGnosisSafe
    ) external {
        require(
            balanceRatioMax > balanceRatioMin,
            "Teller: Max ratio balance should be greater than Min ratio balance"
        );
        compoundStore().cToken = ICErc20(cTokenAddress);
        compoundStore().balanceRatioMin = balanceRatioMin;
        compoundStore().balanceRatioMax = balanceRatioMax;
        compoundStore().bonusGnosisSafe = bonusGnosisSafe;
        compoundStore().lastBonusIntTimestamp = block.timestamp;
        NAME = "CompoundStrategy_2";
        emit StrategyInitialized(NAME, cTokenAddress, LibMeta.msgSender());
    }
}
