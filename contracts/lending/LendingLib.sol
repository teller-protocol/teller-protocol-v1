// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";

// Interfaces
import { ITToken } from "./ttoken/ITToken.sol";

// Storage
import { MarketStorageLib, MarketStorage } from "../storage/market.sol";

import "hardhat/console.sol";

library LendingLib {
    function s() internal pure returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    function tToken(address asset) internal view returns (ITToken tToken_) {
        tToken_ = s().tTokens[asset];
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
        console.log("supplied underlying", supplied);
        if (supplied > 0) {
            uint256 newOnLoanAmount =
                s().totalBorrowed[asset] -
                    s().totalRepaid[asset] +
                    newLoanAmount;
            ratio_ = NumbersLib.ratioOf(newOnLoanAmount, supplied);
        }
    }
}
