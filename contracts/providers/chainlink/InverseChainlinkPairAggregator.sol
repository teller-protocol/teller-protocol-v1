pragma solidity 0.5.17;

import "./ChainlinkPairAggregator.sol";


/**
    @notice This pair aggregator is used to inverse the pair oracle feed.
    @notice As chainlink doesn't have some price oracles, sometimes instead of getting an oracle for 1 lending token = x collateral tokens, we have to get one for 1 collateral token = x lending tokens. But we still want the price returned as 1 WHOLE lending token, in collateral UNITS.
    @author develop@teller.finance
 */
contract InverseChainlinkPairAggregator is ChainlinkPairAggregator {
    /** External Functions */

    /** Internal Functions */

    /**
        @notice It overrides the regular ChainlinkPairAggregator. It only inverses the response.
        @param response to inverse.
        @return a inversed value.
     */
    function _normalizeResponse(int256 response) internal view returns (int256) {
        return _inverseValue(response);
    }

    /**
        @notice It inverses the value from the Chainlink.
        @dev See more details in our Gitbook website.
        @return an inversed value.
     */
    function _inverseValue(int256 value) internal view returns (int256) {
        return (int256(TEN**collateralDecimals) * int256(TEN**responseDecimals)) / value;
    }
}
