// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TToken_V1 } from "../TToken_V1.sol";

contract TTokenLogicTester {
    function attack(
        address ttoken,
        address admin,
        address underlying
    ) external {
        TToken_V1(ttoken).initialize(admin, underlying);
    }
}
