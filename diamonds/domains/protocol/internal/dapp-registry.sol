// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/dapp-registry.sol";

abstract contract int_DappRegistry_v1 is sto_DappRegistry {
    /**
     * @notice It tests whether an address is a dapp or not.
     * @param dapp address to test.
     * @return true if the address is a dapp. Otherwise it returns false.
     */
    function _isDapp(address dapp) internal view returns (bool) {
        return dappStore().dapps[dapp].exists;
    }
}
