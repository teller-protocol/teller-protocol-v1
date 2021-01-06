pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";

/**
    @notice 

    @author develop@teller.finance
 */

interface IMarketFactory {
    /** External Functions */

    function createMarket(
        address tToken,
        address borrowedToken,
        address collateralToken
    ) external;

    function removeMarket(address borrowedToken, address collateralToken) external;

    function getMarket(address borrowedToken, address collateralToken)
        external
        view
        returns (TellerCommon.Market memory);

    function existMarket(address borrowedToken, address collateralToken)
        external
        view
        returns (bool);

    function notExistMarket(address borrowedToken, address collateralToken)
        external
        view
        returns (bool);

    function initialize(address settingsAddress) external;

    /** Events */

    event NewMarketCreated(
        address indexed sender,
        address indexed borrowedToken,
        address indexed collateralToken,
        address loans,
        address lenders,
        address lendingPool,
        address loanTermsConsensus,
        address interestConsensus
    );

    event MarketRemoved(
        address indexed sender,
        address indexed borrowedToken,
        address indexed collateralToken
    );
}
