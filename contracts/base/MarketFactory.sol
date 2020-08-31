pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/LoansInterface.sol";
import "../interfaces/InterestConsensusInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LendersInterface.sol";
import "../interfaces/SettingsInterface.sol";
import "../interfaces/MarketFactoryInterface.sol";
import "../providers/openzeppelin/IERC20Mintable.sol";//TODO Review if we need it here.
import "../providers/chainlink/IChainlinkPairAggregatorRegistry.sol";

// Commons
import "./DynamicProxy.sol";
import "../util/TellerCommon.sol";
import "./TInitializable.sol";

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

    mapping(address => mapping(address => TellerCommon.Market)) markets;

    /* Modifiers */

    /**
        @notice It checks whether the platform is paused or not.
        @dev It throws a require error if the platform is used.
     */
    modifier isNotPaused() {
        require(!settings().isPaused(), "PLATFORM_IS_PAUSED");
        _;
    }

    modifier marketNotExist(address borrowedToken, address collateralToken) {
        require(
            !_getMarket(borrowedToken, collateralToken).exists,
            "MARKET_NOT_EXIST"
        );
        _;
    }

    modifier marketExist(address borrowedToken, address collateralToken) {
        require(
            _getMarket(borrowedToken, collateralToken).exists,
            "MARKET_ALREADY_EXIST"
        );
        _;
    }

    /** External Functions */

    function createMarket(
        address tToken,
        address borrowedToken,
        address collateralToken
    )
        external
        onlyPauser()
        isNotPaused()
        isInitialized()
    {
        _requireCreateMarket(tToken, borrowedToken, collateralToken);
        address owner = msg.sender;

        IChainlinkPairAggregatorRegistry pairAggregatorRegistry = settings().pairAggregatorRegistry();
        address pairAggregator = address(pairAggregatorRegistry.getPairAggregator(borrowedToken, collateralToken));
        // TODO uncomment require(pairAggregator != address(0x0), "ORACLE_NOT_FOUND_FOR_MARKET");

        (
            LendingPoolInterface lendingPoolProxy,
            InterestConsensusInterface interestConsensusProxy,
            LendersInterface lendersProxy,
            LoanTermsConsensusInterface loanTermsConsensusProxy,
            LoansInterface loansProxy
        ) = _createAndInitializeProxies(
            owner,
            tToken,
            borrowedToken,
            collateralToken,
            pairAggregator
        );

        _addMarket(
            borrowedToken,
            collateralToken,
            address(loansProxy),
            address(lendersProxy),
            address(lendingPoolProxy),
            address(loanTermsConsensusProxy),
            address(interestConsensusProxy),
            pairAggregator
        );

        emit NewMarketCreated (
            owner,
            borrowedToken,
            collateralToken,
            address(loansProxy),
            address(lendersProxy),
            address(lendingPoolProxy),
            address(loanTermsConsensusProxy),
            address(interestConsensusProxy),
            address(pairAggregator)
        );
    }

    function removeMarket(address borrowedToken, address collateralToken) external
        onlyPauser()
        isNotPaused()
        isInitialized()
        marketExist(borrowedToken, collateralToken) {

        delete markets[borrowedToken][collateralToken];

        emit MarketRemoved (
            msg.sender,
            borrowedToken,
            collateralToken
        );
    }

    function getMarket(address borrowedToken, address collateralToken) external view returns (TellerCommon.Market memory) {
        return _getMarket(borrowedToken, collateralToken);
    }

    function existMarket(address borrowedToken, address collateralToken) external view returns (bool) {
        return _getMarket(borrowedToken, collateralToken).exists;
    }

    function notExistMarket(address borrowedToken, address collateralToken) external view returns (bool) {
        return !_getMarket(borrowedToken, collateralToken).exists;
    }

    function initialize(address settingsAddress)
        external
        isNotInitialized()
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        _initialize();

        _setSettings(settingsAddress);
    }

    /** Internal Functions */

    function _addMarket(
        address borrowedToken,
        address collateralToken,
        address loans,
        address lenders,
        address lendingPool,
        address loanTermsConsensus,
        address interestConsensus,
        address pairAggregator
    ) internal {
        markets[borrowedToken][collateralToken] = TellerCommon.Market({
            loans: loans,
            lenders: lenders,
            lendingPool: lendingPool,
            loanTermsConsensus: loanTermsConsensus,
            interestConsensus: interestConsensus,
            pairAggregator: pairAggregator,
            exists: true
        });
    }

    function _createDynamicProxy(bytes32 logicName) internal returns (address) {
        return address(new DynamicProxy(address(settings()), logicName));
    }

    function _getMarket(address borrowedToken, address collateralToken) internal view returns (TellerCommon.Market memory) {
        return markets[borrowedToken][collateralToken];
    }

    function _requireCreateMarket(
        address tToken,
        address borrowedToken,
        address collateralToken
    ) internal view marketNotExist(borrowedToken, collateralToken) {
        require(tToken.isContract(), "TTOKEN_MUST_BE_CONTRACT");
        require(borrowedToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        // TODO Use constant.
        require(collateralToken == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE || collateralToken.isContract(), "COLL_TOKEN_MUST_BE_CONTRACT");
    }

    function _createAndInitializeProxies(
        address owner,
        address tToken,
        address borrowedToken,
        address collateralToken,
        address pairAggregator
    ) internal returns (
        LendingPoolInterface lendingPoolProxy,
        InterestConsensusInterface interestConsensusProxy,
        LendersInterface lendersProxy,
        LoanTermsConsensusInterface loanTermsConsensusProxy,
        LoansInterface loansProxy
    ) {
        // Creating proxies
        (
            lendingPoolProxy,
            interestConsensusProxy,
            lendersProxy,
            loanTermsConsensusProxy,
            loansProxy
        ) = _createProxies(collateralToken);

        // Initializing proxies.
        _initializeProxies(
            owner,
            tToken,
            borrowedToken,
            collateralToken,
            pairAggregator,
            lendingPoolProxy,
            interestConsensusProxy,
            lendersProxy,
            loanTermsConsensusProxy,
            loansProxy
        );
    }

    /**
        @notice Creates the proxies for:
            - LendingPool
            - InterestConsensus
            - Lenders
            - LoanTermsConsensus
        @return the proxy instances.
     */
    function _createProxies(address collateralToken) internal returns (
        LendingPoolInterface lendingPoolProxy,
        InterestConsensusInterface interestConsensusProxy,
        LendersInterface lendersProxy,
        LoanTermsConsensusInterface loanTermsConsensusProxy,
        LoansInterface loansProxy
    ) {
        lendingPoolProxy = LendingPoolInterface(_createDynamicProxy(settings().versionsRegistry().consts().LENDING_POOL_LOGIC_NAME()));
        interestConsensusProxy = InterestConsensusInterface(_createDynamicProxy(settings().versionsRegistry().consts().INTEREST_CONSENSUS_LOGIC_NAME()));
        lendersProxy = LendersInterface(_createDynamicProxy(settings().versionsRegistry().consts().LENDERS_LOGIC_NAME()));
        loanTermsConsensusProxy = LoanTermsConsensusInterface(_createDynamicProxy(settings().versionsRegistry().consts().LOAN_TERMS_CONSENSUS_LOGIC_NAME()));
        if (collateralToken == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            // TODO Use constant.
            loansProxy = LoansInterface(_createDynamicProxy(settings().versionsRegistry().consts().ETHER_COLLATERAL_LOANS_LOGIC_NAME()));
        } else {
            loansProxy = LoansInterface(_createDynamicProxy(settings().versionsRegistry().consts().TOKEN_COLLATERAL_LOANS_LOGIC_NAME()));
        }
    }

    function _initializeProxies(
        address owner,
        address tToken,
        address borrowedToken,
        address collateralToken,
        address pairAggregator,
        LendingPoolInterface lendingPoolProxy,
        InterestConsensusInterface interestConsensusProxy,
        LendersInterface lendersProxy,
        LoanTermsConsensusInterface loanTermsConsensusProxy,
        LoansInterface loansProxy
    ) internal {
        address cTokenAddress = settings().getAssetSettings(borrowedToken).cTokenAddress;

        // Initializing LendingPool
        lendingPoolProxy.initialize(
            tToken,
            borrowedToken,
            address(lendersProxy),
            address(loansProxy),
            cTokenAddress,
            address(settings())
        );
        // Initializing InterestConsensus
        interestConsensusProxy.initialize(
            owner,
            address(lendersProxy),
            address(settings())
        );
        // Initializing Lenders
        lendersProxy.initialize(
            tToken,
            address(lendingPoolProxy),
            address(interestConsensusProxy),
            address(settings())
        );
        // Initializing LoanTermsConsensus
        loanTermsConsensusProxy.initialize(
            owner,
            address(loansProxy),
            address(settings())
        );

        // Initializing Loans
        loansProxy.initialize(
            pairAggregator,
            address(lendingPoolProxy),
            address(loanTermsConsensusProxy),
            address(settings()),
            collateralToken
        );
    }
}
