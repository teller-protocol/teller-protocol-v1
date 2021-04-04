// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract int_accrueInterest_LendingPool_v1, sto_LendingPool_v1 {

    function _accrueInterest() internal {
        address cToken = getLendingPool().cToken;
        cToken.call(abi.encodeWithSignature("accrueInterest()"));
    }
}
