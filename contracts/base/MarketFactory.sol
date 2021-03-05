pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/LoansInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/SettingsInterface.sol";
import "../interfaces/MarketFactoryInterface.sol";
import "../interfaces/IMarketRegistry.sol";

// Commons
import "../util/TellerCommon.sol";

// Contracts
import "./Base.sol";
import "./DynamicProxy.sol";
import "./MarketRegistry.sol";
import "./TToken.sol";

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
    @notice This contract offers functions to manage markets.

    @author develop@teller.finance
 */
contract MarketFactory is MarketFactoryInterface, Base {
    using Address for address;

    /** Constants */

    /** Structs */

    /* State Variables */

    /**
        @notice It defines a market for a given borrowed and collateral tokens.
        @dev It uses the Settings.ETH_ADDRESS constant to represent ETHER.
        @dev Examples:

        address(DAI) => address(ETH) => Market {...}
        address(DAI) => address(LINK) => Market {...}
     */
    mapping(address => mapping(address => TellerCommon.Market)) markets;

    IMarketRegistry public marketRegistry;

    /* Modifiers */

    /**
        @notice It checks whether the platform is paused or not.
        @dev It throws a require error if the platform is used.
     */
    modifier isNotPaused() {
        require(!settings.isPaused(), "PLATFORM_IS_PAUSED");
        _;
    }

    /**
        @notice It checks whether a market exists or not for a given borrowed/collateral tokens.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
        @dev It throws a require error if the market already exists.
     */
    modifier marketNotExist(address lendingToken, address collateralToken) {
        require(
            !_getMarket(lendingToken, collateralToken).exists,
            "MARKET_ALREADY_EXIST"
        );
        _;
    }

    /**
        @notice It checks whether a market exists or not for a given borrowed/collateral tokens.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
        @dev It throws a require error if the market doesn't exist.
     */
    modifier marketExist(address lendingToken, address collateralToken) {
        require(
            _getMarket(lendingToken, collateralToken).exists,
            "MARKET_NOT_EXIST"
        );
        _;
    }

    /** External Functions */

    /**
        @notice It creates a new market for a given TToken and borrowed/collateral tokens.
        @dev It uses the Settings.ETH_ADDRESS to represent the ETHER.
        @param lendingToken the token address used to create the lending pool and TToken.
        @param collateralToken the collateral token address.
     */
    function createMarket(address lendingToken, address collateralToken)
        external
        isInitialized
        isNotPaused
        onlyPauser
    {
        require(lendingToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == settings.ETH_ADDRESS() ||
                collateralToken.isContract(),
            "COLL_TOKEN_MUST_BE_CONTRACT"
        );

        LoanTermsConsensusInterface loanTermsConsensus =
            _createLoanTermsConsensus();
        LoansInterface loans = _createLoans(collateralToken);

        LendingPoolInterface lendingPool =
            marketRegistry.lendingPools(lendingToken);
        if (address(lendingPool) == address(0)) {
            lendingPool = _createLendingPool();
            TToken tToken = _createTToken();

            tToken.initialize(lendingToken, address(lendingPool));
            lendingPool.initialize(marketRegistry, tToken, address(settings));
        }

        // Initializing LoanTermsConsensus
        loanTermsConsensus.initialize(
            msg.sender,
            address(loans),
            address(settings)
        );

        // Initializing Loans
        loans.initialize(
            address(lendingPool),
            address(loanTermsConsensus),
            address(settings),
            collateralToken
        );

        marketRegistry.registerMarket(lendingPool, loans);

        _addMarket(
            lendingToken,
            collateralToken,
            address(loans),
            address(lendingPool),
            address(loanTermsConsensus)
        );

        emit NewMarketCreated(
            msg.sender,
            lendingToken,
            collateralToken,
            address(loans),
            address(lendingPool),
            address(loanTermsConsensus)
        );
    }

    /**
        @notice It removes a current market for a given borrowed/collateral tokens.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
     */
    function removeMarket(address lendingToken, address collateralToken)
        external
        onlyPauser
        isNotPaused
        isInitialized
        marketExist(lendingToken, collateralToken)
    {
        delete markets[lendingToken][collateralToken];

        emit MarketRemoved(msg.sender, lendingToken, collateralToken);
    }

    /**
        @notice It gets the current addresses for a given borrowed/collateral token.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
        @return a struct with the contract addresses for the given market.
     */
    function getMarket(address lendingToken, address collateralToken)
        external
        view
        returns (TellerCommon.Market memory)
    {
        return _getMarket(lendingToken, collateralToken);
    }

    /**
        @notice It tests whether a market exists or not for a given borrowed/collateral tokens.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
        @return true if the market exists for the given borrowed/collateral tokens. Otherwise it returns false.
     */
    function existMarket(address lendingToken, address collateralToken)
        external
        view
        returns (bool)
    {
        return _getMarket(lendingToken, collateralToken).exists;
    }

    /**
        @notice It tests whether a market exists or not for a given borrowed/collateral tokens.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
        @return true if the market doesn't exist for the given borrowed/collateral tokens. Otherwise it returns false.
     */
    function notExistMarket(address lendingToken, address collateralToken)
        external
        view
        returns (bool)
    {
        return !_getMarket(lendingToken, collateralToken).exists;
    }

    /**
        @notice It initializes this market factory instance.
     */
    function initialize() external isNotInitialized {
        _initialize(msg.sender);

        marketRegistry = new MarketRegistry();
    }

    /** Internal Functions */

    /**
        @notice It adds a market in the internal mapping.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
        @param loans the new loans contract address.
        @param lendingPool the new lending pool contract address.
        @param loanTermsConsensus the new loan terms consensus contract address.
     */
    function _addMarket(
        address lendingToken,
        address collateralToken,
        address loans,
        address lendingPool,
        address loanTermsConsensus
    ) internal {
        markets[lendingToken][collateralToken] = TellerCommon.Market({
            loans: loans,
            lendingPool: lendingPool,
            loanTermsConsensus: loanTermsConsensus,
            exists: true
        });
    }

    /**
        @notice It creates a dynamic proxy instance for a given logic name.
        @dev It is used to create all the market contracts (LendingPool, Loans, and others).
     */
    function _createDynamicProxy(bytes32 logicName) internal returns (address) {
        return address(new DynamicProxy(address(logicRegistry), logicName));
    }

    /**
        @notice It gets the current addresses for a given borrowed/collateral token.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
        @return a struct with the contract addresses for the given market.
     */
    function _getMarket(address lendingToken, address collateralToken)
        internal
        view
        returns (TellerCommon.Market memory)
    {
        return markets[lendingToken][collateralToken];
    }

    /**
        @notice Creates a proxy contract for LendingPool.
        @return a new LendingPool instance.
     */
    function _createTToken() internal returns (TToken) {
        return
            TToken(
                _createDynamicProxy(logicRegistry.consts().TTOKEN_LOGIC_NAME())
            );
    }

    /**
        @notice Creates a proxy contract for LendingPool.
        @return a new LendingPool instance.
     */
    function _createLendingPool() internal returns (LendingPoolInterface) {
        return
            LendingPoolInterface(
                _createDynamicProxy(
                    logicRegistry.consts().LENDING_POOL_LOGIC_NAME()
                )
            );
    }

    /**
        @notice Creates a proxy contract for LoanTermsConsensus.
        @return a new LoanTermsConsensus instance.
     */
    function _createLoanTermsConsensus()
        internal
        returns (LoanTermsConsensusInterface)
    {
        return
            LoanTermsConsensusInterface(
                _createDynamicProxy(
                    logicRegistry.consts().LOAN_TERMS_CONSENSUS_LOGIC_NAME()
                )
            );
    }

    /**
        @notice Creates a proxy contract for Loans.
        @return a new Loans instance.
     */
    function _createLoans(address collateralToken)
        internal
        returns (LoansInterface)
    {
        bytes32 logicName =
            collateralToken == settings.ETH_ADDRESS()
                ? logicRegistry.consts().ETHER_COLLATERAL_LOANS_LOGIC_NAME()
                : logicRegistry.consts().TOKEN_COLLATERAL_LOANS_LOGIC_NAME();
        return LoansInterface(_createDynamicProxy(logicName));
    }
}
