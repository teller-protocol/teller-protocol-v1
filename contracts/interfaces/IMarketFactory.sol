// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../util/TellerCommon.sol";
import "./IMarketRegistry.sol";

/**
    @notice

    @author develop@teller.finance
 */

interface IMarketFactory {
    /** External Functions */

    function marketRegistry() external returns (IMarketRegistry);

    function createMarket(address lendingToken, address collateralToken)
        external;

    function initialize() external;

    /** Events */

    event NewMarketCreated(
        address indexed sender,
        address indexed lendingToken,
        address indexed collateralToken,
        address loans,
        address lendingPool
    );
}
