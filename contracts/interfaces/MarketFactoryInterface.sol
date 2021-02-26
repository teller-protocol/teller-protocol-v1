pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";
import "./IMarketRegistry.sol";

/**
    @notice

    @author develop@teller.finance
 */

interface MarketFactoryInterface {
    /** External Functions */

    function marketRegistry() external returns (IMarketRegistry);

    function createMarket(address lendingToken, address collateralToken)
        external;

    function removeMarket(address lendingToken, address collateralToken)
        external;

    function getMarket(address lendingToken, address collateralToken)
        external
        view
        returns (TellerCommon.Market memory);

    function existMarket(address lendingToken, address collateralToken)
        external
        view
        returns (bool);

    function notExistMarket(address lendingToken, address collateralToken)
        external
        view
        returns (bool);

    function initialize() external;

    /** Events */

    event NewMarketCreated(
        address indexed sender,
        address indexed lendingToken,
        address indexed collateralToken,
        address loans,
        address lendingPool,
        address loanTermsConsensus
    );

    event MarketRemoved(
        address indexed sender,
        address indexed lendingToken,
        address indexed collateralToken
    );
}
