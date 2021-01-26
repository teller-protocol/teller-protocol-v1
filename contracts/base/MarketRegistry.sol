pragma solidity 0.5.17;

// Utils
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "../util/AddressArrayLib.sol";

// Interfaces
import "../interfaces/IMarketRegistry.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoansInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";

/**
    @notice It manages all the registered TToken contract address, mapping each one to a boolean.

    @author develop@teller.finance
 */
contract MarketRegistry is IMarketRegistry, Ownable {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /* State Variables */

    /**
        @notice It maps a lending token to an array of collateral tokens that represent a market.
     */
    mapping(address => AddressArrayLib.AddressArray) internal markets;

    /**
        @notice It maps a lending token to the associated LendingPool contract.
     */
    mapping(address => LendingPoolInterface) public lendingPools;

    /**
        @notice It maps a lending token and collateral token to the associated Loans contract.
     */
    mapping(address => mapping(address => LoansInterface)) public loans;

    /**
        @notice It represents a mapping to identify a LendingPool's Loan contract address.
     */
    mapping(address => mapping(address => bool)) public loansRegistry;

    /**
        @notice It represents a mapping to identify the address of a given TToken.
     */
    mapping(address => bool) public tTokenRegistry;

    // Constructor

    constructor() public {
        Ownable.initialize(_msgSender());
    }

    // External Functions

    /**
        @notice It registers a new market with a LendingPool and Loans contract pair.
        @param aLendingPool a lending pool contract used to borrow assets.
        @param aLoans a loans contract that stores all the relevant loans info and functionality.
     */
    function registerMarket(LendingPoolInterface aLendingPool, LoansInterface aLoans) external onlyOwner {
        require(!loansRegistry[address(aLendingPool)][address(aLoans)], "MARKET_ALREADY_REGISTERED");

        address lendingToken = address(aLendingPool.lendingToken());
        address collateralToken = aLoans.collateralToken();
        markets[lendingToken].add(collateralToken);
        lendingPools[lendingToken] = aLendingPool;
        loans[lendingToken][collateralToken] = aLoans;
        loansRegistry[address(aLendingPool)][address(aLoans)] = true;
        tTokenRegistry[address(aLendingPool.tToken())] = true;
    }

    /**
        @notice It fetches an array of collateral tokens that a given lending token supports.
        @param lendingTokenAddress a token that the protocol lends.
        @return an array of collateral tokens supported by the lending token market.
     */
    function getMarkets(address lendingTokenAddress) external view returns (address[] memory) {
        return markets[lendingTokenAddress].array;
    }
}
