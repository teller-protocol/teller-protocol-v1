// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { PrizePoolInterface } from "./PrizePoolInterface.sol";

interface IControlledToken {
    function controller() external view returns (PrizePoolInterface);
}
