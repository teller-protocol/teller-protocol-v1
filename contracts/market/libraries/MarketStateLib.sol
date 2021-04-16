// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces

// Libraries
import {
    PlatformSettingsLib
} from "../../settings/platform/PlatformSettingsLib.sol";

// Storage
import {
    MarketStorageLib,
    MarketStorage,
    LoanStatus
} from "../../storage/market.sol";

library MarketLib {
    function s() private pure returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    /**
     * @notice It validates whether supply to debt (StD) ratio is valid including the loan amount.
     * @param newLoanAmount the new loan amount to consider o the StD ratio.
     * @return ratio_ Whether debt ratio for lending pool is valid.
     */
    function debtRatioFor(address asset, uint256 newLoanAmount)
        internal
        returns (uint256 ratio_)
    {
        // NOTE: potentially costly function
        uint256 supplied = s().tTokens[asset].totalUnderlyingSupply();
        if (supplied > 0) {
            uint256 newOnLoanAmount =
                s().totalBorrowed[asset] -
                    s().totalRepaid[asset] +
                    newLoanAmount;
            ratio_ = newOnLoanAmount.ratioOf(supplied);
        }
    }
}
