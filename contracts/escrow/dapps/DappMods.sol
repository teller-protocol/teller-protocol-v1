// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { LibLoans } from "../../market/libraries/LibLoans.sol";
import {
    PlatformSettingsLib
} from "../../settings/platform/libraries/PlatformSettingsLib.sol";

abstract contract DappMods {
    modifier onlyBorrower(uint256 loanID) {
        require(
            msg.sender == LibLoans.loan(loanID).borrower,
            "Teller: dapp not loan borrower"
        );
        _;
    }

    modifier onlySecured(uint256 loanID) {
        require(
            LibLoans.loan(loanID).collateralRatio >=
                PlatformSettingsLib.getCollateralBufferValue(),
            "Teller: dapp loan not secured"
        );
        _;
    }
}
