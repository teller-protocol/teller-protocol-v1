// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IMarketFactory.sol";
import "../../../contexts/#access-control/modifiers/authorized.sol";
import "../internal/roles.sol";
import "../internal/market-registry.sol";
import "../storage/asset-registry.sol";

abstract contract ent_MarketFactory_v1 is
    IMarketFactory,
    mod_authorized_AccessControl_v1,
    Roles
{
    /**
        @notice It creates a new market for a given lending and collateral tokens.
        @dev It uses the Settings.ETH_ADDRESS to represent the ETHER.
        @param lendingToken the token address used to create the lending pool and TToken.
        @param collateralToken the collateral token address.
     */
    function createMarket(address lendingToken, address collateralToken)
        external
        override
        authorized(PAUSER, msg.sender)
    {
        // address loanManagerAddress =
        //     _createDynamicProxy(keccak256("LoanManager"), true);
        // ILendingPool lendingPool =
        //     LendingPoolInterface(marketRegistry.lendingPools(lendingToken));
        // if (address(lendingPool) == address(0)) {
        //     lendingPool = _createLendingPool(lendingToken);
        // }
        // // Initializing Loans
        // ILoanManager(loanManagerAddress).initialize(
        //     address(lendingPool),
        //     address(settings),
        //     collateralToken,
        //     initDynamicProxyLogic
        // );
        // marketRegistry.registerMarket(address(lendingPool), loanManagerAddress);
        // emit NewMarketCreated(
        //     msg.sender,
        //     lendingToken,
        //     collateralToken,
        //     loanManagerAddress,
        //     address(lendingPool)
        // );
    }
}
