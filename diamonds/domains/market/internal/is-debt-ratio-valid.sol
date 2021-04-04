// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "./get-loans-storage.sol";
import { dat_Loans } from "../data/loans.sol";
import "../../protocol/interfaces/IAssetSettings.sol";

abstract contract int_is_debt_ratio_valid_v1 is
    dat_Loans,
    int_get_sto_Loans_v1
{
    function _isDebtRatioValid(uint256 newLoanAmount)
        internal
        view
        returns (bool)
    {
        return
            s().getDebtRatioFor(newLoanAmount) <=
            IAssetSettings(PROTOCOL).getMaxDebtRatio(s().lendingToken);
    }
}

abstract contract int_is_debt_ratio_valid is int_is_debt_ratio_valid_v1 {}
