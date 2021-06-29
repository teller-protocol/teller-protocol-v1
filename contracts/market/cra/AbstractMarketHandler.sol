// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import { LoanRequest } from "../../storage/market.sol";
import { Provider } from "./Provider.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract MarketHandler {
    using EnumerableSet for EnumerableSet.AddressSet;
    // market info
    uint8 public numberOfSignaturesRequired;
    uint16 public maxInterestRate;
    uint16 public maxCollateralRatio;
    uint256 public maxLoanAmount;

    // admin stuff
    mapping(address => bool) admins;

    struct ProviderConfig {
        mapping(address => bool) admin;
        mapping(address => bool) signer;
        // uint32 maxAge;
    }

    // signature stuff
    mapping(bytes32 => bool) public usedCommitments;
    EnumerableSet.AddressSet internal providers;

    modifier onlyAdmin() {
        require(admins[msg.sender], "Teller: not market admin!");
        _;
    }

    constructor() {}

    /**
     * @notice it gets the user score and user request then returns the loan interest rate,
     * loan collateral ratio and loan amount.
     * @param marketScore the score of the user
     * @param request the user's request for the loan
     * @return userInterestRate returns the interest rate for the user based on his score
     * @return userCollateralRatio returns the collateral ratio of the user based on his score
     * @return userLoanAmount returns the amount for the user to take a loan out based on his score
     */
    function handler(uint256 marketScore, LoanRequest memory request)
        external
        pure
        virtual
        returns (
            uint16 userInterestRate,
            uint16 userCollateralRatio,
            uint256 userLoanAmount
        );

    function getProviders() public view returns (address[] memory providers_) {
        providers_ = new address[](providers.length());
        for (uint256 i; i < providers.length(); i++) {
            providers_[i] = providers.at(i);
        }
    }

    function addProviders(address[] calldata providerAddresses)
        public
        onlyAdmin
    {
        for (uint256 i; i < providerAddresses.length; i++) {
            providers.add(providerAddresses[i]);
        }
    }

    function removeProviders(address[] calldata providerAddresses)
        public
        onlyAdmin
    {
        for (uint256 i; i < providerAddresses.length; i++) {
            providers.remove(providerAddresses[i]);
        }
    }
}
