pragma solidity 0.5.17;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


library NumbersList {
    using SafeMath for uint256;

    uint256 private constant PERCENTAGE_TO_DECIMAL = 10000;

    struct Values {
        uint256 count;
        uint256 max;
        uint256 min;
        uint256 sum;
    }

    function addValue(Values storage self, uint256 newValue) internal {
        if (self.max < newValue) {
            self.max = newValue;
        }
        if (self.min > newValue || self.count == 0) {
            self.min = newValue;
        }
        self.sum = self.sum.add(newValue);
        self.count = self.count.add(1);
    }

    function valuesCount(Values storage self) internal view returns (uint256) {
        return self.count;
    }

    function isEmpty(Values storage self) internal view returns (bool) {
        return valuesCount(self) == 0;
    }

    function isFinalized(Values storage self, uint256 totalRequiredValues)
        internal
        view
        returns (bool)
    {
        return valuesCount(self) >= totalRequiredValues;
    }

    function getAverage(Values storage self) internal view returns (uint256) {
        return isEmpty(self) ? 0 : self.sum.div(valuesCount(self));
    }

    function isWithinTolerance(Values storage self, uint256 tolerancePercentage)
        internal
        view
        returns (bool)
    {
        if (isEmpty(self)) {
            return false;
        }
        uint256 average = getAverage(self);
        uint256 toleranceAmount = average.mul(tolerancePercentage).div(PERCENTAGE_TO_DECIMAL);

        uint256 minTolerance = average.sub(toleranceAmount);
        if (self.min < minTolerance) {
            return false;
        }

        uint256 maxTolerance = average.add(toleranceAmount);
        if (self.max > maxTolerance) {
            return false;
        }
        return true;
    }
}
