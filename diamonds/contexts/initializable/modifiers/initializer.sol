// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage.sol";

abstract contract mod_initializer_Initializable_v1 is sto_Initializable {
    modifier initializer {
        require(
            !initializableStorage().initialized,
            "Teller: already initialized"
        );
        _;
    }
}

abstract contract mod_initializer_Initializable is
    mod_initializer_Initializable_v1
{}
