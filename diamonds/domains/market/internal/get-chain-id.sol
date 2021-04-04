// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract int_get_chain_id {
    function _getChainId() internal view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }
}
