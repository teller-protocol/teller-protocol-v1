pragma experimental ABIEncoderV2;
pragma solidity 0.5.17;

// Interfaces
import "./IChainlinkPairAggregatorRegistry.sol";
import "../../base/TInitializable.sol";
import "../../interfaces/LogicVersionsRegistryInterface.sol";

// Contracts
import "../../base/DynamicProxy.sol";

// Commons
import "../../util/TellerCommon.sol";

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
    @notice This contract manages the Chainlink pair aggregator for the platform.
    @dev It is used by the Escrow Dapps, and the MarketFactory contract.

    @author developer@teller.finance
 */
contract ChainlinkPairAggregatorRegistry is
    TInitializable,
    BaseUpgradeable,
    IChainlinkPairAggregatorRegistry
{
    using Address for address;

    /**
        @notice This identifies the pair aggregator for a given market (borrowed / collateral tokens).
        @dev Examples:
            address(DAI) => address(ETH) => address(0x1234...5678)
            address(DAI) => address(LINK) => address(0x2345...789)
            address(USDC) => address(ETH) => address(0x345...7890)
            address(USDC) => address(LINK) => address(0x4567...890)
        @dev It uses 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for ETH. See Settings.ETH_ADDRESS()
     */
    mapping(address => mapping(address => PairAggregatorInterface)) public aggregators;

    /** Modifiers **/

    /** Public Functions **/

    /**
        @notice It registers new pair aggregators for given markets.
        @param requests the input data to register the new pair aggregator.
        @return the new pair aggregator addresses.
     */
    function registerPairAggregators(
        TellerCommon.PairAggregatorRegisterRequest[] calldata requests
    )
        external
        isInitialized()
        onlyPauser()
        returns (PairAggregatorInterface[] memory newAggregators)
    {
        require(requests.length > 0, "REQUEST_LIST_EMPTY");

        newAggregators = new PairAggregatorInterface[](requests.length);

        for (uint256 index; index < requests.length; index++) {
            newAggregators[index] = _registerPairAggregator(requests[index]);
        }
    }

    /**
        @notice It registers a new pair aggregator for a given market.
        @param request the input data to register the new pair aggregator.
        @return the new pair aggregator created.
     */
    function registerPairAggregator(
        TellerCommon.PairAggregatorRegisterRequest calldata request
    ) external isInitialized() onlyPauser() returns (PairAggregatorInterface aggregator) {
        aggregator = _registerPairAggregator(request);
    }

    /**
        @notice It updates a current pair aggregator for a given market.
        @param request the input data to register the new pair aggregator.
        @return the new pair aggregator created.
     */
    function updatePairAggregator(
        TellerCommon.PairAggregatorRegisterRequest calldata request
    ) external isInitialized() onlyPauser() returns (PairAggregatorInterface aggregator) {
        require(request.baseToken.isContract(), "BASE_TOKEN_MUST_BE_CONTRACT");
        require(request.quoteToken.isContract(), "QUOTE_TOKEN_MUST_BE_CONTRACT");
        require(
            request.chainlinkAggregatorAddress.isContract(),
            "BASE_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            _hasPairAggregator(request.baseToken, request.quoteToken),
            "PAIR_AGGREGATOR_NOT_EXIST"
        );

        address oldPairAggregator = address(
            aggregators[request.baseToken][request.quoteToken]
        );

        aggregator = _createPairAggregatorInstance(request);

        aggregators[request.baseToken][request.quoteToken] = aggregator;

        emit PairAggregatorUpdated(
            msg.sender,
            request.baseToken,
            request.quoteToken,
            oldPairAggregator,
            address(aggregator),
            request.responseDecimals,
            request.collateralDecimals,
            request.inverse
        );
    }

    /**
        @notice It initializes this registry contract.
        @param settingsAddress this settings address.
     */
    function initialize(address settingsAddress) external isNotInitialized() {
        _setSettings(settingsAddress);

        _initialize();
    }

    /**
        @notice Gets a pair aggregator for a given base and quote tokens (a market).
        @notice baseToken the base token address.
        @notice quoteToken the quote token address.
        @return the pair aggregator address for the given base and quote addresses.
     */
    function getPairAggregator(address baseToken, address quoteToken)
        external
        view
        returns (PairAggregatorInterface)
    {
        return aggregators[baseToken][quoteToken];
    }

    /**
        @notice Tests whether a pair aggregator exists for a given base and quote tokens (a market) or not.
        @notice baseToken the base token address.
        @notice quoteToken the quote token address.
        @return true if the pair aggregator address for the given base and quote tokens is not 0x0. Otherwise it returns false.
     */
    function hasPairAggregator(address baseToken, address quoteToken)
        external
        view
        returns (bool)
    {
        return _hasPairAggregator(baseToken, quoteToken);
    }

    /** Internal Functions */

    /**
        @notice Tests whether a pair aggregator exists for a given base and quote tokens (a market) or not.
        @notice baseToken the base token address.
        @notice quoteToken the quote token address.
        @return true if the pair aggregator address for the given base and quote tokens is not 0x0. Otherwise it returns false.
     */
    function _hasPairAggregator(address baseToken, address quoteToken)
        internal
        view
        returns (bool)
    {
        return address(aggregators[baseToken][quoteToken]) != address(0x0);
    }

    function _createPairAggregatorInstance(
        TellerCommon.PairAggregatorRegisterRequest memory request
    ) internal returns (PairAggregatorInterface aggregator) {
        bytes32 logicName = LogicVersionsRegistryInterface(settings().versionsRegistry())
            .consts()
            .CHAINLINK_PAIR_AGGREGATOR_LOGIC_NAME();
        DynamicProxy pairAggregatorProxy = new DynamicProxy(
            address(settings()),
            logicName
        );

        address pairAggregatorAddress = address(pairAggregatorProxy);
        aggregator = PairAggregatorInterface(pairAggregatorAddress);
        aggregator.initialize(
            request.chainlinkAggregatorAddress,
            request.inverse,
            request.responseDecimals,
            request.collateralDecimals
        );
    }

    /**
        @notice It registers a new pair aggregator for a given market.
        @param request the input data to register the new pair aggregator.
        @return the new pair aggregator created.
     */
    function _registerPairAggregator(
        TellerCommon.PairAggregatorRegisterRequest memory request
    ) internal returns (PairAggregatorInterface aggregator) {
        require(
            settings().ETH_ADDRESS() == request.baseToken ||
                request.baseToken.isContract(),
            "BASE_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            settings().ETH_ADDRESS() == request.quoteToken ||
                request.quoteToken.isContract(),
            "QUOTE_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            request.chainlinkAggregatorAddress.isContract(),
            "BASE_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            !_hasPairAggregator(request.baseToken, request.quoteToken),
            "PAIR_AGGREGATOR_ALREADY_EXIST"
        );

        aggregator = _createPairAggregatorInstance(request);

        aggregators[request.baseToken][request.quoteToken] = aggregator;

        emit PairAggregatorRegistered(
            msg.sender,
            request.baseToken,
            request.quoteToken,
            address(aggregator),
            request.responseDecimals,
            request.collateralDecimals,
            request.inverse
        );
    }
}
