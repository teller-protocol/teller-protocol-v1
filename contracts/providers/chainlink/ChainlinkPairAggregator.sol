pragma solidity 0.5.17;

// Externals
import "@chainlink/contracts/src/v0.5/interfaces/AggregatorInterface.sol";

// Interfaces
import "../../interfaces/PairAggregatorInterface.sol";

// Contracts
import "../../base/TInitializable.sol";

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../openzeppelin/SignedSafeMath.sol";

/**
    @notice This is a Chainlink Oracle wrapper implementation. It uses the AggregatorInterface from Chainlink to get data.

    @author develop@teller.finance
 */
contract ChainlinkPairAggregator is PairAggregatorInterface, TInitializable {
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using Address for address;

    uint256 internal constant TEN = 10;
    uint256 internal constant MAX_POWER_VALUE = 50;

    /**
        @notice It represents the Chainlink oracle reference used in this pair aggregator instance.
     */
    AggregatorInterface public aggregator;
    /**
        @notice It represents the decimals included in the Chainlink oracle responses.
     */
    uint8 public responseDecimals;
    /**
        @notice It represents the decimals in the collateral token used in this pair aggregator.
     */
    uint8 public collateralDecimals;
    /**
        @notice It represents the difference between reponseDecimals and collateralDecimals.
        @notice It is used to normalize the amounts.
     */
    uint8 public pendingDecimals;
    /**
        @notice It defines if this pair aggregator is inverse or not.
        @dev It is used when Chainlink doesn't support a given market, but they support the inverse one.
        @dev Example:
            Not supported:  DAI / LINK
            Supported:      LINK / DAI.
            In this case, despite Chainlink doesn't support the  DAI / LINK oracle, we use the LINK / DAI one and make the inverse calculation.
     */
    bool public inverse;

    /** External Functions */

    /**
        @notice Gets the current answer from the Chainlink aggregator oracle.
        @return a normalized response value.
     */
    function getLatestAnswer() external view returns (int256) {
        int256 latestAnswerInverted = aggregator.latestAnswer();
        return _normalizeResponse(latestAnswerInverted);
    }

    /**
        @notice Gets the past round answer from the Chainlink aggregator oracle.
        @param roundsBack the answer number to retrieve the answer for
        @return a normalized response value.
     */
    function getPreviousAnswer(uint256 roundsBack) external view returns (int256) {
        int256 answer = _getPreviousAnswer(roundsBack);
        return _normalizeResponse(answer);
    }

    /**
        @notice Gets the last updated height from the aggregator.
        @return the latest timestamp.
     */
    function getLatestTimestamp() external view returns (uint256) {
        return aggregator.latestTimestamp();
    }

    /**
        @notice Gets the latest completed round where the answer was updated.
        @return the latest round id.
    */
    function getLatestRound() external view returns (uint256) {
        return aggregator.latestRound();
    }

    /**
        @notice Gets block timestamp when an answer was last updated
        @param roundsBack the answer number to retrieve the updated timestamp for
        @return the previous timestamp.
     */
    function getPreviousTimestamp(uint256 roundsBack) external view returns (uint256) {
        uint256 latest = aggregator.latestRound();
        require(roundsBack <= latest, "NOT_ENOUGH_HISTORY");
        return aggregator.getTimestamp(latest - roundsBack);
    }

    /**
        @notice It creates a new ChainlinkPairAggregator instance.
        @param aggregatorAddress to use in this Chainlink pair aggregator.
        @param isInverse defines whether the aggregator is inverse or not.
        @param responseDecimalsValue the decimals included in the Chainlink response.
        @param collateralDecimalsValue the decimals included in the collateral token.
    */
    function initialize(
        address aggregatorAddress,
        bool isInverse,
        uint8 responseDecimalsValue,
        uint8 collateralDecimalsValue
    ) external isNotInitialized() {
        require(aggregatorAddress.isContract(), "AGGREGATOR_NOT_CONTRACT");

        _initialize();

        inverse = isInverse;
        aggregator = AggregatorInterface(aggregatorAddress);
        responseDecimals = responseDecimalsValue;
        collateralDecimals = collateralDecimalsValue;

        if (collateralDecimals >= responseDecimals) {
            pendingDecimals = collateralDecimals - responseDecimals;
        } else {
            pendingDecimals = responseDecimals - collateralDecimals;
        }
        require(pendingDecimals <= MAX_POWER_VALUE, "MAX_PENDING_DECIMALS_EXCEEDED");
    }

    /**
        @notice It gets the aggregator info associated to this pair aggregator instance.
        @return response decimals.
        @return collateral decimals.
        @return pending decimals (difference between response and collateral).
        @return isInverse true if it is an inverse pair aggregator. Otherwise it returns false.
     */
    function getInfo()
        external
        view
        returns (
            uint8 response,
            uint8 collateral,
            uint8 pending,
            bool isInverse
        )
    {
        return (responseDecimals, collateralDecimals, pendingDecimals, inverse);
    }

    /** Internal Functions */

    /**
        @notice It normalizes a value depending on the collateral and response decimals configured in the contract.
        @param value to normalize.
        @return a normalized value.
     */
    function _normalizeResponse(int256 value) internal view returns (int256) {
        if (inverse) {
            return
                (int256(TEN**collateralDecimals) * int256(TEN**responseDecimals)) / value;
        } else {
            if (collateralDecimals >= responseDecimals) {
                return value.mul(int256(TEN**pendingDecimals));
            } else {
                return value.div(int256(TEN**pendingDecimals));
            }
        }
    }

    /**
        @notice Gets the past round answer from the Chainlink aggregator oracle.
        @param roundsBack the answer number to retrieve the answer for
        @return a non-normalized response value.
     */
    function _getPreviousAnswer(uint256 roundsBack) internal view returns (int256) {
        uint256 latest = aggregator.latestRound();
        require(roundsBack <= latest, "NOT_ENOUGH_HISTORY");
        return aggregator.getAnswer(latest - roundsBack);
    }
}
