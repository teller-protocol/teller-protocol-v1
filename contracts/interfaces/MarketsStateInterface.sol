pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";
import "../util/MarketStateLib.sol";


/**
    @notice 

    @author develop@teller.finance
 */
interface MarketsStateInterface {
    function increaseRepayment(
        address borrowedAsset,
        address collateralAsset,
        uint256 amount
    ) external;

    function increaseSupply(
        address borrowedAsset,
        address collateralAsset,
        uint256 amount
    ) external;

    function increaseBorrow(
        address borrowedAsset,
        address collateralAsset,
        uint256 amount
    ) external;

    function getSupplyToDebt(address borrowedAsset, address collateralAsset)
        external
        view
        returns (uint256);

    function getSupplyToDebtFor(
        address borrowedAsset,
        address collateralAsset,
        uint256 loanAmount
    ) external view returns (uint256);

    function getMarket(address borrowedAsset, address collateralAsset)
        external
        view
        returns (MarketStateLib.MarketState memory);
}
