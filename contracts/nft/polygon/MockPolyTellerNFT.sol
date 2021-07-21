// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Contracts
import { PolyTellerNFT } from "./PolyTellerNFT.sol";

contract MockPolyTellerNFT is PolyTellerNFT {
    /**
     * @notice it initializes the PolyTellerNFT by calling the TellerNFT with a
     * a set of minters and additionally adding a DEPOSITOR role for the ChildChainManager
     * address
     * @param minters additional minters to add on the TellerNFT storage
     */
    function initialize(address[] calldata minters)
        external
        override
        initializer
    {
        require(minters.length == 0, "Teller: poly nft cannot have minters");
        TellerNFT.initialize(minters);

        // for mock tests
        _setupRole(DEPOSITOR, 0xAFe87013dc96edE1E116a288D80FcaA0eFFE5fe5);
    }
}
