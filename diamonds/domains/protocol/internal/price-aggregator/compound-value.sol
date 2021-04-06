pragma solidity ^0.8.0;

// Interfaces
import "diamonds/providers/compound/CErc20Interface.sol";

abstract contract int_PriceAggregator_CompoundValue_v1 {
    /**
     * @dev Compounds exchange rate is scaled by 18 decimals (10^18)
     */
    uint256 internal constant EXCHANGE_RATE_SCALE = 1000000000000000000;

    function _compoundValueInUnderlying(address cToken, uint256 cTokenAmount)
        internal
        view
        returns (uint256)
    {
        return
            (cTokenAmount * CErc20Interface(cToken).exchangeRateStored()) /
            EXCHANGE_RATE_SCALE;
    }

    function _compoundValueOfUnderlying(
        address cToken,
        uint256 underlyingAmount
    ) internal view returns (uint256) {
        return
            (underlyingAmount * EXCHANGE_RATE_SCALE) /
            CErc20Interface(cToken).exchangeRateStored();
    }
}
