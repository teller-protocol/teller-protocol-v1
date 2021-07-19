// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import {
    AggregatorV2V3Interface as ChainlinkAgg
} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV2V3Interface.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Libraries
import { ENS } from "../../shared/libraries/ENSLib.sol";
import { StringsLib } from "../../shared/libraries/StringsLib.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract ChainlinkPricer {
    using StringsLib for string;

    // Chainlink ENS resolver
    address public immutable ENS_RESOLVER;
    // namehash of `data.eth` domain
    bytes32 public constant ENS_DOMAIN =
        0x4a9dd6923a809a49d009b308182940df46ac3a45ee16c1133f90db66596dae1f;

    constructor(address ensResolver) {
        ENS_RESOLVER = ensResolver;
    }

    function getEthPrice(address token) external view returns (uint256 price_) {
        price_ = SafeCast.toUint256(
            ChainlinkAgg(getEthAggregator(token)).latestAnswer()
        );
    }

    function getEthAggregator(address token) public view returns (address) {
        string memory name = _getTokenSymbol(token).concat("-eth");
        return ENS.resolve(ENS_RESOLVER, ENS.subnode(name, ENS_DOMAIN));
    }

    function _getTokenSymbol(address token)
        internal
        view
        returns (string memory)
    {
        string memory symbol_ = ERC20(token).symbol();
        if (symbol_.compareTo("WBTC")) {
            return "btc";
        }
        if (symbol_.compareTo("WMATIC")) {
            return "matic";
        }
        return symbol_.lower();
    }
}
