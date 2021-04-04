// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../contracts/interfaces/LendingPoolInterface.sol";

abstract contract sto_Loans {
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

    function getLoansStorage() internal pure returns (Layout storage l_) {
        bytes32 position = keccak256("teller_protocol.storage.loans");

        assembly {
            l_.slot := position
        }
    }
}
