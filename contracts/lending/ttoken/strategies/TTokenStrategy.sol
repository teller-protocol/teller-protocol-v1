// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import { ITTokenStrategy } from "./ITTokenStrategy.sol";

abstract contract TTokenStrategy is ITTokenStrategy, ERC165 {
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
