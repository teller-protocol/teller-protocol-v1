// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/ITToken.sol";

abstract contract sto_LendingPool {
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

    function getLendingPool()
        internal
        pure
        returns (LendingPoolLayout storage l_)
    {
        bytes32 position = keccak256("teller_protocol.storage.lending_pool");

        assembly {
            l_.slot := position
        }
    }
}
