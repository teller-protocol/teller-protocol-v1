pragma solidity 0.5.17;

// We import the contract so truffle compiles it, and we have the ABI available when working with it.
import "../../util/NumbersList.sol";


contract NumbersListMock {
    using NumbersList for NumbersList.Values;

    NumbersList.Values public values;

    function addValue(uint256 newValue) external {
        values.addValue(newValue);
    }

    function valuesCount() external view returns (uint256) {
        return values.count;
    }

    function isFinalized(uint256 totalRequiredValues) external view returns (bool) {
        return values.isFinalized(totalRequiredValues);
    }

    function getAverage() external view returns (uint256) {
        return values.getAverage();
    }

    function isWithinTolerance(uint256 tolerance) external view returns (bool) {
        return values.isWithinTolerance(tolerance);
    }
}
