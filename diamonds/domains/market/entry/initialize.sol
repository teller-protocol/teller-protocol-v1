// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../contexts/initializable/modifiers/initializer.sol";
import "../../protocol/interfaces/IAssetRegistry.sol";
import "../../protocol/address.sol";
import "../storage/lending-pool.sol";

abstract contract ent_initialize_Market_v1 is
    mod_initializer_Initializable_v1,
    sto_lendingPool
{
    function initialize() external initializer {
        address comp = IAssetRegistry(PROTOCOL).getAsset("COMP");
        require(comp != address(0), "NOCOMP");
        getLendingPool().addresses["COMP"] = comp;
    }
}
