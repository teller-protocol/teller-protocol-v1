// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/ITToken.sol";

abstract contract sto_LendingPool_v1 {
    struct LendingPoolLayout {
        mapping(string => address) addresses;
        mapping(address => uint256) totalSuppliedUnderlyingLender;
        mapping(address => uint256) totalInterestEarnedLender;
        ITToken tToken;
        ERC20 lendingToken;
        address cToken;
        address compound;
        address comp;
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 totalInterestEarned;
    }

    bytes32 internal constant LENDING_POOL_POSITION =
        keccak256("teller_protocol.storage.lending_pool.v1");

    function getLendingPool()
        internal
        pure
        returns (LendingPoolLayout storage l_)
    {
        bytes32 position = LENDING_POOL_POSITION;

        assembly {
            l_.slot := position
        }
    }
}
