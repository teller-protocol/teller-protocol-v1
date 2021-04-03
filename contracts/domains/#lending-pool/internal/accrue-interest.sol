// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { s_LendingPool } from "../../../storage/LendingPool.sol";

function _accrueInterest() internal {
    s_LendingPool.Layout storage layout = s_LendingPool.get();

    address(layout.cToken).call(abi.encodeWithSignature("accrueInterest()"));
}
