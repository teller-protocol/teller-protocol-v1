// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/lending-pool.sol";

abstract contract int_accrueInterest_LendingPool_v1 is sto_LendingPool {
    function _accrueInterest() internal {
        address cToken = getLendingPool().cToken;
        cToken.call(abi.encodeWithSignature("accrueInterest()"));
    }
}
