pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "../../base/BaseUpgradeable.sol";
import "../../base/TInitializable.sol";

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../openzeppelin/SignedSafeMath.sol";

// Interfaces
import "./IChainlinkAggregator.sol";

contract ChainlinkAggregator is IChainlinkAggregator, TInitializable, BaseUpgradeable {
    using Address for address;
    using AddressLib for address;
    using SafeMath for uint256;
    using SignedSafeMath for int256;

    uint256 internal constant TEN = 10;

    mapping(address => mapping(address => address)) internal aggregators;

    /* External Functions */

    function aggregatorFor(address src, address dst) external view returns (AggregatorV2V3Interface, bool) {
        return _aggregatorFor(src, dst);
    }

    function valueFor(address src, address dst, uint256 srcAmount) external view returns (uint256) {
        return _valueFor(src, dst, srcAmount);
    }

    function latestAnswerFor(address src, address dst) external view returns (int256) {
        return _priceFor(src, dst);
    }

    function latestTimestampFor(address src, address dst) external view returns (uint256) {
        (AggregatorV2V3Interface agg, ) = _aggregatorFor(src, dst);
        return address(agg) == address(0) ? 0 : agg.latestTimestamp();
    }

    function add(address src, address dst, address aggregator) external onlyPauser {
        require(aggregators[src][dst] == address(0));
        require(src.isContract() || src == settings().ETH_ADDRESS(), "TOKEN_A_NOT_CONTRACT");
        require(dst.isContract() || dst == settings().ETH_ADDRESS(), "TOKEN_B_NOT_CONTRACT");
        require(aggregator.isContract(), "AGGREGATOR_NOT_CONTRACT");
        aggregators[src][dst] = aggregator;
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

    function _decimalsFor(address addr) internal view returns (uint8) {
        return addr == settings().ETH_ADDRESS() ? 18 : ERC20Detailed(addr).decimals();
    }

    function _aggregatorFor(address src, address dst) internal view returns (AggregatorV2V3Interface aggregator, bool inverse) {
        if (src == settings().WETH_ADDRESS()) {
            src = settings().ETH_ADDRESS();
        }
        if (dst == settings().WETH_ADDRESS()) {
            dst = settings().ETH_ADDRESS();
        }

        inverse = aggregators[src][dst] == address(0);
        aggregator = AggregatorV2V3Interface(inverse ? aggregators[dst][src] : aggregators[src][dst]);
    }

    function _valueFor(address src, address dst, uint256 srcAmount) internal view returns (uint256) {
        return srcAmount * uint256(_priceFor(src, dst)) / uint256(TEN**_decimalsFor(src));
    }

    function _priceFor(address src, address dst) internal view returns (int256) {
        (AggregatorV2V3Interface agg, bool inverse) = _aggregatorFor(src, dst);
        uint8 srcDecimals = _decimalsFor(src);
        uint8 dstDecimals = _decimalsFor(dst);
        int256 srcFactor = int256(TEN**srcDecimals);
        int256 dstFactor = int256(TEN**dstDecimals);
        if (address(agg) != address(0)) {
            int256 price = agg.latestAnswer();
            if (inverse) {
                return srcFactor * dstFactor / price;
            }
            return price;
        } else {
            address eth = settings().ETH_ADDRESS();
            dst.requireNotEqualTo(eth, "CANNOT_CALCULATE_VALUE");

            int256 price1 = _priceFor(src, eth);
            int256 price2 = _priceFor(dst, eth);

            return price1 * dstFactor / price2;
        }
    }
}
