// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./NumbersLib.sol";

/**
 * @dev Utility library of inline functions on NumbersList.Values
 *
 * @author develop@teller.finance
 */
library NumbersList {
    using NumbersLib for uint256;

    // Holds values to calculate the threshold of a list of numbers
    struct Values {
        uint256 count; // The total number of numbers added
        uint256 max; // The maximum number that was added
        uint256 min; // The minimum number that was added
        uint256 sum; // The total sum of the numbers that were added
    }

    /**
     * @dev Add to the sum while keeping track of min and max values
     * @param self The Value this function was called on
     * @param newValue Number to increment sum by
     */
    function addValue(Values memory self, uint256 newValue) internal pure {
        if (self.max < newValue) {
            self.max = newValue;
        }
        if (self.min > newValue || self.count == 0) {
            self.min = newValue;
        }
        self.sum = self.sum + (newValue);
        self.count = self.count + 1;
    }

    /**
     * @param self The Value this function was called on
     * @return the number of times the sum has updated
     */
    function valuesCount(Values memory self) internal pure returns (uint256) {
        return self.count;
    }

    /**
     * @dev Checks if the sum has been changed
     * @param self The Value this function was called on
     * @return boolean
     */
    function isEmpty(Values memory self) internal pure returns (bool) {
        return valuesCount(self) == 0;
    }

    /**
     * @param self The Value this function was called on
     * @return the average number that was used to calculate the sum
     */
    function getAverage(Values memory self) internal pure returns (uint256) {
        return isEmpty(self) ? 0 : self.sum / (valuesCount(self));
    }

    /**
     * @dev Checks if the min and max numbers are within the acceptable tolerance
     * @param self The Value this function was called on
     * @param tolerancePercentage Acceptable tolerance percentage as a whole number
     * The percentage should be entered with 2 decimal places. e.g. 2.5% should be entered as 250.
     * @return boolean
     */
    function isWithinTolerance(Values memory self, uint16 tolerancePercentage)
        internal
        pure
        returns (bool)
    {
        if (isEmpty(self)) {
            return false;
        }
        uint256 average = getAverage(self);
        uint256 toleranceAmount = average.percent(tolerancePercentage);

        uint256 minTolerance = average - toleranceAmount;
        if (self.min < minTolerance) {
            return false;
        }

        uint256 maxTolerance = average + toleranceAmount;
        if (self.max > maxTolerance) {
            return false;
        }
        return true;
    }
}
