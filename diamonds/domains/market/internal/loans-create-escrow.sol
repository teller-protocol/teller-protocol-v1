// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

import { int_get_sto_Loans } from "./get-loans-storage.sol";
import "../../protocol/interfaces/IPlatformSettings.sol";
import { dat_Loans } from "../data/loans.sol";

abstract contract int_create_escrow_v1 is dat_Loans {
    function _createEscrow(uint256 loanID) internal returns (address escrow) {
        Clones.clone();
        require(
            s().loans[loanID].escrow == address(0x0),
            "LOAN_ESCROW_ALREADY_EXISTS"
        );
    }
}

abstract contract int_create_escrow is int_create_escrow_v1 {}
