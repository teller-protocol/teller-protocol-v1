// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IDestroyable.sol";
import "./EscrowLib.sol";

contract EscrowProxy is IDestroyable {
    address constant _primary = address(0);
    address constant _secondary = address(0);

    function destroy() external override {}

    fallback(bytes calldata) external payable returns (bytes memory) {
        address primary = _primary;
        address secondary = _secondary;
        // With immutable instances.
        // Tries primary, if it doesn't work tries secondary.
        // Only time secondary gets tried is if primary is not deployed
        // or if the call to primary reverts.
        // If the call to secondary reverts, the call should also revert unless caught.
        assembly {
            function dc(addr) {
                calldatacopy(0, 0, calldatasize())
                let result := delegatecall(gas(), addr, 0, calldatasize(), 0, 0)
                switch result
                case 0 {
                    leave
                }
                default {
                    returndatacopy(0, 0, returndatasize())
                    return(0, returndatasize())
                }
            }

            dc(primary)
            dc(secondary)
            returndatacopy(0, 0, returndatasize())
            return(0, returndatasize())
        }
    }
}
