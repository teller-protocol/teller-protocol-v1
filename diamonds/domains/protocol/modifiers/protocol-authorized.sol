// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IPlatformSettings.sol";
import "../address.sol";

abstract contract mod_protocolAuthorized_Protocol_v1 {
    modifier protocolAuthorized(address account) {
        require(
            IPlatformSettings(PROTOCOL).hasAuthorization(account),
            "PUNAUTHORIZED"
        );
        _;
    }
}
