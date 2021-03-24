pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./Base.sol";

// Utils
import "../util/AddressArrayLib.sol";

// Interfaces
import "../interfaces/IMarketRegistry.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/loans/ILoanManager.sol";
import "../interfaces/loans/ILoanTermsConsensus.sol";

/**
    @notice It manages all the registered TToken contract address, mapping each one to a boolean.

    @author develop@teller.finance
 */
contract MarketRegistry is IMarketRegistry, Base {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /* State Variables */

    address public owner;

    /**
        @notice It maps a lending token to an array of collateral tokens that represent a market.
     */
    mapping(address => AddressArrayLib.AddressArray) internal markets;

    /**
        @notice It maps a lending token to the associated LendingPool contract.
     */
    mapping(address => address) public lendingPools;

    /**
        @notice It maps a lending token and collateral token to the associated LoanManager contract.
     */
    mapping(address => mapping(address => address)) public loanManagers;

    /**
        @notice It represents a mapping to identify a LendingPool's LoanManager contract address.
     */
    mapping(address => mapping(address => bool)) public loanManagerRegistry;

    /* Modifiers */

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // External Functions

    /**
        @notice It registers a new market with a LendingPool and Loans contract pair.
        @param lendingPoolAddress a lending pool contract used to borrow assets.
        @param loanManagerAddress a loan manager contract that stores all the relevant loans info and functionality.
     */
    function registerMarket(
        address lendingPoolAddress,
        address loanManagerAddress
    ) external onlyOwner {
        require(
            !loanManagerRegistry[lendingPoolAddress][loanManagerAddress],
            "MARKET_ALREADY_REGISTERED"
        );

        address lendingToken =
            address(LendingPoolInterface(lendingPoolAddress).lendingToken());
        address collateralToken =
            ILoanManager(loanManagerAddress).collateralToken();
        markets[lendingToken].add(collateralToken);
        lendingPools[lendingToken] = lendingPoolAddress;
        loanManagers[lendingToken][collateralToken] = loanManagerAddress;
        loanManagerRegistry[lendingPoolAddress][loanManagerAddress] = true;
    }

    /**
        @notice It fetches an array of collateral tokens that a given lending token supports.
        @param lendingTokenAddress a token that the protocol lends.
        @return an array of collateral tokens supported by the lending token market.
     */
    function getMarkets(address lendingTokenAddress)
        external
        view
        returns (address[] memory)
    {
        return markets[lendingTokenAddress].array;
    }

    /**
     * @notice It initializes the MarketRegistry contract by setting the owner of the caller.
     * @dev This contract is constructed and initialized by the MarketFactory.
     */
    function initialize() external {
        require(owner == address(0), "ALREADY_INIT");
        owner = msg.sender;
    }
}
