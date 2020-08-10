pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";

// Contracts

// Interfaces
import "../interfaces/MarketsStateInterface.sol";
import "../util/MarketStateLib.sol";


/**
    @notice This contract is used to store market data.

    @author develop@teller.finance
 */
contract MarketsState is MarketsStateInterface, WhitelistedRole {
    using SafeMath for uint256;
    using MarketStateLib for MarketStateLib.MarketState;

    /** Constants */

    /* State Variables */

    /**
        @notice It maps a lent token => collateral token => Market state.
        Example:
            address(DAI) => address(LINK) => MarketState
            address(DAI) => address(ETH) => MarketState
     */
    mapping(address => mapping(address => MarketStateLib.MarketState)) public markets;

    /**
        @notice It increases the repayment amount for a given market.
        @notice This function is called every new repayment is received.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @param amount amount to add.
     */
    function increaseRepayment(
        address borrowedAsset,
        address collateralAsset,
        uint256 amount
    ) external onlyWhitelisted() {
        markets[borrowedAsset][collateralAsset].increaseRepayment(amount);
    }

    /**
        @notice It increases the supply amount for a given market.
        @notice This function is called every new deposit (Lenders) is received.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @param amount amount to add.
     */
    function increaseSupply(
        address borrowedAsset,
        address collateralAsset,
        uint256 amount
    ) external onlyWhitelisted() {
        markets[borrowedAsset][collateralAsset].increaseSupply(amount);
    }

    /**
        @notice It increases the borrowed amount for a given market.
        @notice This function is called every new loan is taken out
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @param amount amount to add.
     */
    function increaseBorrow(
        address borrowedAsset,
        address collateralAsset,
        uint256 amount
    ) external onlyWhitelisted() {
        markets[borrowedAsset][collateralAsset].increaseBorrow(amount);
    }

    /**
        @notice It gets the current supply-to-debt (StD) ratio for a given market.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @return the supply-to-debt ratio value.
     */
    function getSupplyToDebt(address borrowedAsset, address collateralAsset)
        external
        view
        returns (uint256)
    {
        return _getMarket(borrowedAsset, collateralAsset).getSupplyToDebt();
    }

    /**
        @notice It gets the supply-to-debt (StD) ratio for a given market, including a new loan amount.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @param loanAmount a new loan amount to consider in the ratio.
        @return the supply-to-debt ratio value.
     */
    function getSupplyToDebtFor(
        address borrowedAsset,
        address collateralAsset,
        uint256 loanAmount
    ) external view returns (uint256) {
        return _getMarket(borrowedAsset, collateralAsset).getSupplyToDebtFor(loanAmount);
    }

    /**
        @notice It gets the current market state.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @return the current market state.
     */
    function getMarket(address borrowedAsset, address collateralAsset)
        external
        view
        returns (MarketStateLib.MarketState memory)
    {
        return _getMarket(borrowedAsset, collateralAsset);
    }

    /** Internal Functions */

    /**
        @notice It gets the current market state.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @return the current market state.
     */
    function _getMarket(address borrowedAsset, address collateralAsset)
        internal
        view
        returns (MarketStateLib.MarketState storage)
    {
        return markets[borrowedAsset][collateralAsset];
    }
}
