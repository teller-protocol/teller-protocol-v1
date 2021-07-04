// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {
    ContextUpgradeable
} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import { ITTokenStrategy } from "./ITTokenStrategy.sol";

abstract contract TTokenStrategy is
    ITTokenStrategy,
    ContextUpgradeable,
    ERC165
{
    /**
     * @notice it checks if interface is supported according to the ERC165 standard
     * @param interfaceId Id of the interface in question
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return
            ERC165.supportsInterface(interfaceId) ||
            interfaceId == type(ITTokenStrategy).interfaceId;
    }
}
