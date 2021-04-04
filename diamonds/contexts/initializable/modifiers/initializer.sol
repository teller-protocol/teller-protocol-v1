// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage.sol";
import "../../../diamond/libraries/LibDiamond.sol";

abstract contract mod_initializer_Initializable_v1 is sto_Initializable_v1 {
    modifier initializer {
        require(
            !initializableStorage().initialized,
            "Teller: already initialized"
        );
        LibDiamond.enforceIsContractOwner();
        _;
    }
}
