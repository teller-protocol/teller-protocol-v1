// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { MarketStorageLib } from "../../storage/market.sol";
import { AppStorageLib } from "../../storage/app.sol";
import { OVER_COLLATERALIZED_BUFFER } from "../../settings/platform/names.sol";

abstract contract DappMods {
    modifier onlyBorrower(uint256 loanID) {
        require(
            msg.sender ==
                MarketStorageLib.store().loans[loanID].loanTerms.borrower
        );
        _;
    }

    modifier onlySecured(uint256 loanID) {
        require(
            MarketStorageLib.store().loans[loanID].loanTerms.collateralRatio >=
                AppStorageLib.store().platformSettings[
                    OVER_COLLATERALIZED_BUFFER
                ]
                    .value
        );
        _;
    }
}
