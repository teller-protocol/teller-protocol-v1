pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/roles/WhitelistedRole.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

// Contracts
import "./BaseUpgradeable.sol";
import "./TInitializable.sol";

// Interfaces
import "../interfaces/MarketsStateInterface.sol";
import "../util/MarketStateLib.sol";
import "../util/AddressLib.sol";
import "../providers/compound/CErc20Interface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used to store market data.

    @author develop@teller.finance
 */
contract MarketsState is
    MarketsStateInterface,
    TInitializable,
    WhitelistedRole,
    BaseUpgradeable
{
    using AddressLib for address;
    using Address for address;
    using MarketStateLib for MarketStateLib.MarketState;
    using SafeMath for uint256;

    /** Constants */

    uint8 internal constant EXCHANGE_RATE_DECIMALS = 18;

    /* State Variables */

    /**
        @notice It maps:
        - The cToken address related with a given lent token => collateral token => Market state.
        - If the lent token is not supported by Compound, this function uses the lent token address as key.
        
        Examples (supported by Compound):
            address(cDAI) => address(LINK) => MarketState
            address(cUSDC) => address(LINK) => MarketState
        
        Examples (not supported by Compound):
            address(TokenA) => address(LINK) => MarketState
            address(TokenB) => address(ETH) => MarketState
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
    ) external onlyWhitelisted() isInitialized() {
        _getMarket(borrowedAsset, collateralAsset).increaseRepayment(amount);
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
    ) external onlyWhitelisted() isInitialized() {
        _getMarket(borrowedAsset, collateralAsset).increaseSupply(amount);
    }

    /**
        @notice It decreases the supply amount for a given market.
        @notice This function is called every new withdraw (Lenders) is done.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @param amount amount to decrease.
     */
    function decreaseSupply(
        address borrowedAsset,
        address collateralAsset,
        uint256 amount
    ) external onlyWhitelisted() isInitialized() {
        _getMarket(borrowedAsset, collateralAsset).decreaseSupply(amount);
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
    ) external onlyWhitelisted() isInitialized() {
        _getMarket(borrowedAsset, collateralAsset).increaseBorrow(amount);
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
        address cTokenAddress = _getCTokenAddress(borrowedAsset);
        if (cTokenAddress.isEmpty()) {
            return markets[borrowedAsset][collateralAsset].getSupplyToDebtFor(loanAmount);
        } else {
            uint8 cTokenDecimals = CErc20Interface(cTokenAddress).decimals();
            uint256 exchangeRate = CErc20Interface(cTokenAddress).exchangeRateStored();
            uint256 diffDecimals = uint256(EXCHANGE_RATE_DECIMALS).sub(
                uint256(cTokenDecimals)
            );
            uint256 cLoanAmount = loanAmount.mul(10**diffDecimals).div(exchangeRate);
            return
                markets[cTokenAddress][collateralAsset].getSupplyToDebtFor(cLoanAmount);
        }
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

    /**
        @notice It initializes this Markets State instance.
        @param settingsAddress settings address.
     */
    function initialize(address settingsAddress) public initializer() isNotInitialized() {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        WhitelistedRole.initialize(msg.sender);
        TInitializable._initialize();

        _setSettings(settingsAddress);
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
        address cTokenAddress = _getCTokenAddress(borrowedAsset);
        if (cTokenAddress.isEmpty()) {
            return markets[borrowedAsset][collateralAsset];
        } else {
            return markets[cTokenAddress][collateralAsset];
        }
    }

    /**
        @notice Gets the cToken address associated to a borrowed asset.
        @param borrowedAsset borrowed address.
        @return the cToken address (if Compound supported the asset). Otherwise it returns an empty address.
     */
    function _getCTokenAddress(address borrowedAsset) internal view returns (address) {
        return settings().getCTokenAddress(borrowedAsset);
    }
}
