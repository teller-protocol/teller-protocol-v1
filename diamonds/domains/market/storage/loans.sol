// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/AddressArrayLib.sol";
import "../../../libraries/TellerCommon.sol";
import "../../../providers/compound/CErc20Interface.sol";

abstract contract sto_Loans {
    struct LoansLayout {
        uint256 totalCollateral;
        address lendingToken;
        address collateralToken;
        CErc20Interface cToken;
        mapping(address => uint256[]) borrowerLoans;
        uint256 loanIDCounter;
        AddressArrayLib.AddressArray signers;
        mapping(uint256 => TellerCommon.Loan) loans;
    }

    function getLoansStorage() internal pure returns (LoansLayout storage l_) {
        bytes32 position = keccak256("teller_protocol.storage.loans");

        assembly {
            l_.slot := position
        }
    }
}
