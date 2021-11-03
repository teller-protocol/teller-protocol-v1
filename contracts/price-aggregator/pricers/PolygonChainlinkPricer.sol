// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ChainlinkPricer.sol";

contract PolygonChainlinkPricer is ChainlinkPricer {
    using StringsLib for string;

    constructor(address ensResolver) ChainlinkPricer(ensResolver) {}

    function _getTokenSymbol(address token)
        internal
        view
        override
        returns (string memory)
    {
        string memory symbol_ = ERC20(token).symbol();
        if (symbol_.compareTo("WMATIC")) {
            return "matic";
        }
        return symbol_.lower();
    }
}
