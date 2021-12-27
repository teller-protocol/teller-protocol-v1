// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TTokenCompoundStrategy_1 } from "./TTokenCompoundStrategy_1.sol";

// Interfaces
import { ICErc20 } from "../../../../shared/interfaces/ICErc20.sol";
import { LibMeta } from "../../../../shared/libraries/LibMeta.sol";

contract TTokenCompoundStrategy_2 is TTokenCompoundStrategy_1 {
    address immutable bonusGnosisSafe;

    /* External Functions */

    function totalUnderlyingSupply() public override returns (uint256) {
        // Get current supply
        uint256 currentSupply = super.totalUnderlyingSupply();
        // Calculate bonus interest due
        uint256 bonusInterest = ((currentSupply / 10) / 365 days) *
            ((block.timestamp - compoundStore().lastBonusIntTimestamp) /
                1 days);
        uint256 gnosisBalance = tokenStore().underlying.balanceOf(
            bonusGnosisSafe
        );
        if (gnosisBalance < bonusInterest) {
            bonusInterest = gnosisBalance;
        }
        if (bonusInterest > 0) {
            // Deposit into
            tokenStore().underlying.transferFrom(
                bonusGnosisSafe,
                address(this),
                bonusInterest
            );
        }

        return currentSupply + bonusInterest;
    }

    /**
     * @notice Sets the address of the bonus gnosis safe for the bonus interest disbursment
     * @param _bonusGnosisSafe The address of the gnosisSafe to pull funds from for bonus interest
     */
    constructor(address _bonusGnosisSafe) {
        bonusGnosisSafe = _bonusGnosisSafe;
        compoundStore().lastBonusIntTimestamp = block.timestamp;
        NAME = "CompoundStrategy_2";
    }
}
