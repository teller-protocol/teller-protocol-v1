pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "../../base/BaseUpgradeable.sol";
import "../../base/TInitializable.sol";

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../openzeppelin/SignedSafeMath.sol";
import "../../util/AddressArrayLib.sol";

// Interfaces
import "./IChainlinkAggregator.sol";

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
    @notice This contract is used to fetch and calculate prices and values from one token to another through Chainlink Aggregators.
    @dev It tries to find an aggregator using the token addresses supplied. If unable, it uses ETH as a pass through asset to construct a path conversion.

    @author develop@teller.finance
 */
contract ChainlinkAggregator is IChainlinkAggregator, TInitializable, BaseUpgradeable {
    using Address for address;
    using AddressLib for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;
    using SafeMath for uint256;
    using SignedSafeMath for int256;

    /* State Variables */

    uint256 internal constant TEN = 10;

    /*
        @notice It is a mapping for Chainlink Aggregator contracts by baseTokenAddress => quoteTokenAddress => chainlinkAggregatorAddress
     */
    mapping(address => mapping(address => address)) internal aggregators;

    mapping(address => AddressArrayLib.AddressArray) internal supportedTokens;

    /* External Functions */

    /**
        @notice It grabs the Chainlink Aggregator contract address for the token pair if it is supported.
        @param src Source token address.
        @param dst Destination token address.
        @return AggregatorV2V3Interface The Chainlink Aggregator address.
        @return bool whether or not the values from the Aggregator should be considered inverted.
     */
    function aggregatorFor(address src, address dst)
        external
        view
        returns (AggregatorV2V3Interface, bool)
    {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        return _aggregatorFor(src, dst);
    }

    /**
        @notice It checks if the token is supported.
        @param tokenAddress Token address to check support for.
        @return bool whether or not the token is supported.
     */
    function isTokenSupported(address tokenAddress) external view returns (bool) {
        tokenAddress = _normalizeTokenAddress(tokenAddress);

        return supportedTokens[tokenAddress].length() > 0;
    }

    /**
        @notice It calculates the value of a token amount into another.
        @param src Source token address.
        @param dst Destination token address.
        @param srcAmount Amount of the source token to convert into the destination token.
        @return uint256 Value of the source token amount in destination tokens.
     */
    function valueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) external view returns (uint256) {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        return _valueFor(src, dst, srcAmount);
    }

    /**
        @notice It returns the price of the token pair as given from the Chainlink Aggregator.
        @dev It tries to use ETH as a pass through asset if the direct pair is not supported.
        @param src Source token address.
        @param dst Destination token address.
        @return uint256 The latest answer as given from Chainlink.
     */
    function latestAnswerFor(address src, address dst) external view returns (int256) {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        return _priceFor(src, dst);
    }

    /**
        @notice It allows for additional Chainlink Aggregators to be supported.
        @param src Source token address.
        @param dst Destination token address.
     */
    function add(
        address src,
        address dst,
        address aggregator
    ) external onlyPauser {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        (AggregatorV2V3Interface agg, ) = _aggregatorFor(src, dst);
        address(agg).requireEmpty("CHAINLINK_PAIR_ALREADY_EXISTS");

        require(
            src.isContract() || src == _getSettings().ETH_ADDRESS(),
            "TOKEN_A_NOT_CONTRACT"
        );
        require(
            dst.isContract() || dst == _getSettings().ETH_ADDRESS(),
            "TOKEN_B_NOT_CONTRACT"
        );
        require(aggregator.isContract(), "AGGREGATOR_NOT_CONTRACT");

        aggregators[src][dst] = aggregator;
        supportedTokens[src].add(dst);
        supportedTokens[dst].add(src);
    }

    /**
        @notice It removes support for a Chainlink Aggregator pair.
        @param src Source token address.
        @param dst Destination token address.
     */
    function remove(address src, address dst) external onlyPauser {
        src = _normalizeTokenAddress(src);
        dst = _normalizeTokenAddress(dst);

        (AggregatorV2V3Interface agg, ) = _aggregatorFor(src, dst);
        if (address(agg).isEmpty()) {
            return;
        }

        aggregators[src][dst] = address(0);
        supportedTokens[src].remove(dst);
        supportedTokens[dst].remove(src);
    }

    /**
        @notice It removes support for a Chainlink Aggregator.
        @param tokenAddress Token to remove all markets for.
     */
    function remove(address tokenAddress) external onlyPauser {
        tokenAddress = _normalizeTokenAddress(tokenAddress);

        address[] storage arr = supportedTokens[tokenAddress].array;
        for (uint256 i; i < arr.length; i++) {
            (AggregatorV2V3Interface agg, bool inverse) = _aggregatorFor(
                tokenAddress,
                arr[i]
            );
            if (inverse) {
                aggregators[arr[i]][tokenAddress] = address(0);
            } else {
                aggregators[tokenAddress][arr[i]] = address(0);
            }
        }

        arr.length = 0;
    }

    /**
        @notice It initializes this ChainlinkAggregator instance.
        @param settingsAddress the settings contract address.
     */
    function initialize(address settingsAddress) external isNotInitialized() {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        _initialize();

        _setSettings(settingsAddress);
    }

    /* Internal Functions */

    function _normalizeTokenAddress(address tokenAddress)
        internal
        view
        returns (address)
    {
        return
            tokenAddress == _getSettings().WETH_ADDRESS()
                ? _getSettings().ETH_ADDRESS()
                : tokenAddress;
    }

    /**
        @notice It gets the number of decimals for a given token.
        @param addr Token address to get decimals for.
        @return uint8 Number of decimals the given token.
     */
    function _decimalsFor(address addr) internal view returns (uint8) {
        return addr == _getSettings().ETH_ADDRESS() ? 18 : ERC20Detailed(addr).decimals();
    }

    /**
        @notice It grabs the Chainlink Aggregator contract address for the token pair if it is supported.
        @param src Source token address.
        @param dst Destination token address.
        @return AggregatorV2V3Interface The Chainlink Aggregator address.
        @return bool whether or not the values from the Aggregator should be considered inverted.
     */
    function _aggregatorFor(address src, address dst)
        internal
        view
        returns (AggregatorV2V3Interface aggregator, bool inverse)
    {
        inverse = aggregators[src][dst] == address(0);
        aggregator = AggregatorV2V3Interface(
            inverse ? aggregators[dst][src] : aggregators[src][dst]
        );
    }

    /**
        @notice It calculates the value of a token amount into another.
        @param src Source token address.
        @param dst Destination token address.
        @param srcAmount Amount of the source token to convert into the destination token.
        @return uint256 Value of the source token amount in destination tokens.
     */
    function _valueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) internal view returns (uint256) {
        return
            (srcAmount * uint256(_priceFor(src, dst))) / uint256(TEN**_decimalsFor(src));
    }

    /**
        @notice It returns the price of the token pair as given from the Chainlink Aggregator.
        @dev It tries to use ETH as a pass through asset if the direct pair is not supported.
        @param src Source token address.
        @param dst Destination token address.
        @return uint256 The latest answer as given from Chainlink.
     */
    function _priceFor(address src, address dst) internal view returns (int256) {
        (AggregatorV2V3Interface agg, bool inverse) = _aggregatorFor(src, dst);
        uint8 dstDecimals = _decimalsFor(dst);
        int256 dstFactor = int256(TEN**dstDecimals);
        if (address(agg) != address(0)) {
            int256 price = agg.latestAnswer();
            uint8 resDecimals = agg.decimals();
            if (inverse) {
                price = int256(TEN**(resDecimals + resDecimals)) / price;
            }
            if (dstDecimals > resDecimals) {
                price = price * int256(TEN**(dstDecimals - resDecimals));
            } else {
                price = price / int256(TEN**(resDecimals - dstDecimals));
            }
            int256 srcFactor = int256(TEN**_decimalsFor(src));
            return price;
        } else {
            address eth = _getSettings().ETH_ADDRESS();
            dst.requireNotEqualTo(eth, "CANNOT_CALCULATE_VALUE");

            int256 price1 = _priceFor(src, eth);
            int256 price2 = _priceFor(dst, eth);

            return (price1 * dstFactor) / price2;
        }
    }
}
