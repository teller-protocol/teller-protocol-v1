// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import { DataProvider } from "./cra/DataProvider.sol";
import "hardhat/console.sol";

contract ProviderFactoryFacet {
    address public admin;
    DataProvider[] public providers;

    modifier onlyAdmin() {
        require(admin == msg.sender, "Only the admin can call this!");
        _;
    }

    // whichever address that deploys the provider factory facet is the admin of the factory
    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice it creates a new provider. whichever address that creates the new provider is the
     * admin of the said provider.
     */
    function createProvider() public {
        DataProvider provider = new DataProvider(msg.sender);
        providers.push(provider);
    }

    function getProviders() public view returns (DataProvider[] memory) {
        return providers;
    }
}
