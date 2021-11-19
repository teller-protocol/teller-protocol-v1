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
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

contract ChainlinkPricer {
    using StringsLib for string;

    // Chainlink ENS resolver
    address public immutable ENS_RESOLVER;
    // namehash of `data.eth` domain
    bytes32 public constant ENS_DOMAIN =
        0x4a9dd6923a809a49d009b308182940df46ac3a45ee16c1133f90db66596dae1f;

    constructor(address ensResolver) {
        require(
            Address.isContract(ensResolver),
            "Teller: resolver not contract"
        );
        ENS_RESOLVER = ensResolver;
    }

    function getEthPrice(address token) external view returns (uint256 price_) {
        (
            uint80 roundID,
            int256 rawPrice,
            uint256 startedAt,
            uint256 updateTime,
            uint80 answeredInRound
        ) = ChainlinkAgg(getEthAggregator(token)).latestRoundData();
        require(rawPrice > 0, "Chainlink price <= 0");
        require(updateTime != 0, "Incomplete round");
        require(answeredInRound + 2 >= roundID, "Stale price");
        price_ = SafeCast.toUint256(rawPrice);
    }

    function getEthAggregator(address token) public view returns (address) {
        string memory name = _getTokenSymbol(token).concat("-eth");
        return ENS.resolve(ENS_RESOLVER, ENS.subnode(name, ENS_DOMAIN));
    }

    function _getTokenSymbol(address token)
        internal
        view
        virtual
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
