// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contacts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";
import { PriceAggregator } from "./PriceAggregator.sol";

// Storage
import { AppStorageLib } from "../settings/storage/app.sol";

contract PriceAggFacet is RolesMods {
    function setPriceAggregator(address priceAggAddress)
        external
        authorized(ADMIN, msg.sender)
    {
        AppStorageLib.store().priceAggregator = PriceAggregator(
            priceAggAddress
        );
    }
}
