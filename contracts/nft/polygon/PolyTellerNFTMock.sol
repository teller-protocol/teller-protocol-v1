// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PolyTellerNFT } from "./PolyTellerNFT.sol";

contract PolyTellerNFTMock is PolyTellerNFT {
    function initialize(address[] calldata minters)
        public
        virtual
        override
        initializer
    {
        // Mock the child chain manager to be the deployer address
        _setupRole(DEPOSITOR, _msgSender());
    }
}
