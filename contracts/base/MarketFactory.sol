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
import "../interfaces/TTokenRegistryInterface.sol";

// Commons
import "../util/TellerCommon.sol";

// Contracts
import "./TInitializable.sol";
import "./DynamicProxy.sol";
import "./TTokenRegistry.sol";
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
contract MarketFactory is TInitializable, BaseUpgradeable, MarketFactoryInterface {
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

    TTokenRegistryInterface public tTokenRegistry;

    /* Modifiers */

    /**
        @notice It checks whether the platform is paused or not.
        @dev It throws a require error if the platform is used.
     */
    modifier isNotPaused() {
        require(!_getSettings().isPaused(), "PLATFORM_IS_PAUSED");
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
        require(_getMarket(lendingToken, collateralToken).exists, "MARKET_NOT_EXIST");
        _;
    }

    /** External Functions */

    /**
        @notice It creates a new market for a given TToken and borrowed/collateral tokens.
        @dev It uses the Settings.ETH_ADDRESS to represent the ETHER.
        @param lendingToken the token address used to create the lending pool and TToken.
        @param collateralToken the collateral token address.
     */
    function createMarket(
        address lendingToken,
        address collateralToken
    ) external isInitialized() isNotPaused() onlyPauser() {
        require(lendingToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == _getSettings().ETH_ADDRESS() ||
            collateralToken.isContract(),
            "COLL_TOKEN_MUST_BE_CONTRACT"
        );

        address owner = msg.sender;

        (
            LendingPoolInterface lendingPoolProxy,
            LoanTermsConsensusInterface loanTermsConsensusProxy,
            LoansInterface loansProxy
        ) = _createAndInitializeProxies(owner, lendingToken, collateralToken);

        _addMarket(
            lendingToken,
            collateralToken,
            address(loansProxy),
            address(lendingPoolProxy),
            address(loanTermsConsensusProxy)
        );

        emit NewMarketCreated(
            owner,
            lendingToken,
            collateralToken,
            address(loansProxy),
            address(lendingPoolProxy),
            address(loanTermsConsensusProxy)
        );
    }

    /**
        @notice It removes a current market for a given borrowed/collateral tokens.
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
     */
    function removeMarket(address lendingToken, address collateralToken)
        external
        onlyPauser()
        isNotPaused()
        isInitialized()
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
        @param settingsAddress the settings contract address.
     */
    function initialize(address settingsAddress) external isNotInitialized() {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        _initialize();

        _setSettings(settingsAddress);

        tTokenRegistry = new TTokenRegistry();
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
        return address(new DynamicProxy(address(_getSettings()), logicName));
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
        @notice It creates and initializes the proxies used for the given tToken, and borrowed/collateral tokens.
        @param owner the owner address (or sender transaction).
        @param lendingToken the borrowed token address.
        @param collateralToken the collateral token address.
     */
    function _createAndInitializeProxies(
        address owner,
        address lendingToken,
        address collateralToken
    )
        internal
        returns (
            LendingPoolInterface lendingPoolProxy,
            LoanTermsConsensusInterface loanTermsConsensusProxy,
            LoansInterface loansProxy
        )
    {
        // Creating proxies
        (lendingPoolProxy, loanTermsConsensusProxy, loansProxy) = _createProxies(
            collateralToken
        );

        TTokenInterface tToken = new TToken(lendingToken, address(lendingPoolProxy));
        tTokenRegistry.registerTToken(tToken);

        // Initializing proxies.
        _initializeProxies(
            owner,
            tToken,
            collateralToken,
            lendingPoolProxy,
            loanTermsConsensusProxy,
            loansProxy
        );
    }

    /**
        @notice Creates the proxies for:
            - LendingPool
            - LoanTermsConsensus
        @return the proxy instances.
     */
    function _createProxies(address collateralToken)
        internal
        returns (
            LendingPoolInterface lendingPoolProxy,
            LoanTermsConsensusInterface loanTermsConsensusProxy,
            LoansInterface loansProxy
        )
    {
        lendingPoolProxy = LendingPoolInterface(
            _createDynamicProxy(
                _getSettings().versionsRegistry().consts().LENDING_POOL_LOGIC_NAME()
            )
        );
        loanTermsConsensusProxy = LoanTermsConsensusInterface(
            _createDynamicProxy(
                _getSettings()
                    .versionsRegistry()
                    .consts()
                    .LOAN_TERMS_CONSENSUS_LOGIC_NAME()
            )
        );
        if (collateralToken == _getSettings().ETH_ADDRESS()) {
            loansProxy = LoansInterface(
                _createDynamicProxy(
                    _getSettings()
                        .versionsRegistry()
                        .consts()
                        .ETHER_COLLATERAL_LOANS_LOGIC_NAME()
                )
            );
        } else {
            loansProxy = LoansInterface(
                _createDynamicProxy(
                    _getSettings()
                        .versionsRegistry()
                        .consts()
                        .TOKEN_COLLATERAL_LOANS_LOGIC_NAME()
                )
            );
        }
    }

    /**
        @notice It initializes all the new proxies.
        @param owner the owner address (or sender transaction).
        @param tToken the tToken address.
        @param collateralToken the collateral token address.
        @param lendingPoolProxy the new lending pool proxy instance.
        @param loanTermsConsensusProxy the new loan terms consensus proxy instance.
        @param loansProxy the new loans proxy instance.
     */
    function _initializeProxies(
        address owner,
        TTokenInterface tToken,
        address collateralToken,
        LendingPoolInterface lendingPoolProxy,
        LoanTermsConsensusInterface loanTermsConsensusProxy,
        LoansInterface loansProxy
    ) internal {
        // Initializing LendingPool
        lendingPoolProxy.initialize(
            tToken,
            address(loansProxy),
            address(_getSettings())
        );
        // Initializing LoanTermsConsensus
        loanTermsConsensusProxy.initialize(
            owner,
            address(loansProxy),
            address(_getSettings())
        );

        // Initializing Loans
        loansProxy.initialize(
            address(lendingPoolProxy),
            address(loanTermsConsensusProxy),
            address(_getSettings()),
            collateralToken
        );
    }
}
