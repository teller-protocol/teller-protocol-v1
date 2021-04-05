// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../contexts/pausable/storage.sol";
import "../../protocol/interfaces/IPlatformSettings.sol";
import "../data/loans.sol";
import "../../protocol/address.sol";

abstract contract mod_whenNotPaused_Market_v1 is sto_Pausable {
    modifier whenNotPaused {
        require(!IPlatformSettings(PROTOCOL).isPaused(), "PTCPAUSED");
        require(
            !IPlatformSettings(PROTOCOL).isMarketPaused(address(this)),
            "MKTPAUSED"
        );
        _;
    }
}
