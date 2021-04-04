// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../contracts/interfaces/LendingPoolInterface.sol";

abstract contract sto_Loans_v1 {
    struct Layout {
        uint256 totalCollateral;
        LendingPoolInterface lendingPool;
        address lendingToken;
        address collateralToken;
        CErc20Interface cToken;
        mapping(address => uint256[]) borrowerLoans;
        uint256 loanIDCounter;
        AddressArrayLib.AddressArray signers;
        mapping(uint256 => TellerCommon.Loan) loans;
    }

    bytes32 internal constant LOANS_POSITION =
        keccak256("teller_protocol.storage.loans.v1");

    function getLoansStorage() internal pure returns (LoansLayout storage l_) {
        bytes32 position = LOANS_POSITION;

        assembly {
            l_.slot := position
        }
    }
}

abstract contract sto_Loans is sto_Loans_v1 {}
