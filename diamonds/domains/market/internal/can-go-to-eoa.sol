// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { int_get_sto_Loans } from "../internal/get-loans-storage.sol";
import "../../protocol/interfaces/IPlatformSettings.sol";
import "../data/loans.sol";

abstract contract int_canGoToEoa_v1 is int_get_sto_Loans, dat_Loans_v1 {
    function _canGoToEoa(uint256 loanID) internal view returns (bool) {
        uint256 overCollateralizedBuffer =
            IPlatformSettings(PROTOCOL).getOverCollateralizedBufferValue();

        return
            s().loans[loanID].loanTerms.collateralRatio >=
            overCollateralizedBuffer;
    }
}
