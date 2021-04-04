// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { int_get_sto_Loans } from "./get-loans-storage.sol";
import {
    ext_PlatformSettings_v1
} from "../../protocol/external/platform-settings.sol";
import "../../../../contracts/interfaces/IInitializeableDynamicProxy.sol";

abstract contract int_create_escrow_v1 is
    int_get_sto_Loans,
    ext_PlatformSettings_v1,
    IInitializeableDynamicProxy
{
    function _createEscrow(uint256 loanID) internal returns (address escrow) {
        require(
            s().loans[loanID].escrow == address(0x0),
            "LOAN_ESCROW_ALREADY_EXISTS"
        );

        //        escrow = _clone(s().initDynamicProxyLogic); Check oz proxy lib
        IInitializeableDynamicProxy(escrow).initialize(
            address(s().logicRegistry),
            keccak256("Escrow"),
            true
        );
        ext_PlatformSettings_v1.addEscrowAuthorized(escrow);
    }
}

abstract contract int_create_escrow is int_create_escrow_v1 {}
