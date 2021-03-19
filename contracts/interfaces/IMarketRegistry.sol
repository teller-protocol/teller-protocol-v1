pragma solidity 0.5.17;

// Utils
import "../util/AddressArrayLib.sol";

// Interfaces
import "./LendingPoolInterface.sol";
import "./loans/ILoanManager.sol";

/**
    @notice It defines all the functions for the TToken registry

    @author develop@teller.finance
 */

interface IMarketRegistry {
    /**
        @notice It fetches an array of collateral tokens that a given lending token supports.
        @param lendingTokenAddress a token that the protocol lends.
        @return an array of collateral tokens supported by the lending token market.
     */
    function getMarkets(address lendingTokenAddress)
        external
        view
        returns (address[] memory);

    /**
        @notice It maps a lending token to the associated LendingPool contract.
        @param lendingTokenAddress the lending token used in a LendingPool.
        @return the LendingPool contract for the given token.
     */
    function lendingPools(address lendingTokenAddress)
        external
        view
        returns (address);

    /**
        @notice It maps a lending token and collateral token to the associated LoanManager contract.
        @param lendingTokenAddress a token the protocol lends out.
        @param collateralTokenAddress a token that is used as collateral.
        @return the Loans contract for the given token pair.
     */
    function loanManagers(
        address lendingTokenAddress,
        address collateralTokenAddress
    ) external view returns (address);

    /**
        @notice It represents a mapping to identify a LendingPool's LoanManager contract address.
        @param lendingPoolAddress a LendingPool contract.
        @param loanManagerAddress a Loans contract.
        @return true if the Loans contract address is registered to the LendingPool contract.
     */
    function loanManagerRegistry(
        address lendingPoolAddress,
        address loanManagerAddress
    ) external view returns (bool);

    /**
        @notice It registers a new market with a LendingPool and Loans contract pair.
        @param lendingPoolAddress a lending pool contract used to borrow assets.
        @param loanManagerAddress a loan manager contract that stores all the relevant loans info and functionality.
     */
    function registerMarket(
        address lendingPoolAddress,
        address loanManagerAddress
    ) external;
}
