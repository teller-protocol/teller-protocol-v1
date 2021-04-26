// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "../interfaces/IStrategy.sol";
import { TELLER_TTOKEN_STRATEGY_SALT } from "../Data.sol";

abstract contract AStrategy is IStrategy, ERC165 {
    modifier strategized() {
        require(msg.sig == this.strategize.selector);
        _;
    }

    /**
        NOTE: you must override this to indicate that you are supporting
        the deposit/withdrawal hooks on your implementation.
        Simply inherit from this contract and follow the instructions in
        ./node_modules/-openzeppelin/contracts/utils/introspection/ERC165.sol
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function strategize(bytes4 selector, bytes calldata data)
        external
        returns (bytes32 salt, bytes memory output)
    {
        salt = TELLER_TTOKEN_STRATEGY_SALT;
        output = _strategize(selector, data);
    }

    function _strategize(bytes4 sig, bytes calldata data)
        internal
        virtual
        returns (bytes memory output);
}
