pragma solidity 0.5.17;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


library NumbersList {
    using SafeMath for uint256;

    uint256 private constant PERCENTAGE_TO_DECIMAL = 10000;

    struct Values {
        uint256[] list;
        uint256 max;
        uint256 min;
        uint256 sum;
    }

    function addValue(Values storage self, uint256 newValue) internal returns (bool) {
        self.list.push(newValue);
        if (self.max < newValue) {
            self.max = newValue;
        }
        if (self.min > newValue) {
            self.min = newValue;
        }
        self.sum = self.sum.add(newValue);
    }

    function totalValues(Values storage self) internal view returns (uint256) {
        return self.list.length;
    }

    function isFinalized(Values storage self, uint256 totalRequiredValues)
        internal
        view
        returns (bool)
    {
        return self.list.length >= totalRequiredValues;
    }

    function getAverage(Values storage self) internal view returns (uint256) {
        return self.sum.div(totalValues(self));
    }

    function isWithinTolerance(Values storage self, uint256 tolerance)
        internal
        view
        returns (bool)
    {
        uint256 average = getAverage(self);
        uint256 toleranceAmount = average.mul(tolerance).div(PERCENTAGE_TO_DECIMAL);

        uint256 minTolerance = average.sub(toleranceAmount);
        if (self.min <= minTolerance) {
            return false;
        }

        uint256 maxTolerance = average.add(toleranceAmount);
        if (self.max >= maxTolerance) {
            return false;
        }
        return true;
    }
}
