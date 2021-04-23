// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Utility library for uint256 numbers
 *
 * @author develop@teller.finance
 */
library NumbersLib {
    /**
     * @dev It represents 100% with 2 decimal places.
     */
    uint256 internal constant ONE_HUNDRED_PERCENT = 10000;

    /**
     * @notice Returns a percentage value of a number.
     * @param self The number to get a percentage of.
     * @param percentage The percentage value to calculate with 2 decimal places (10000 = 100%).
     */
    function percent(uint256 self, uint256 percentage)
        internal
        pure
        returns (uint256)
    {
        return (self * percentage) / ONE_HUNDRED_PERCENT;
    }

    function percent(int256 self, uint256 percentage)
        internal
        pure
        returns (int256)
    {
        return (self * int256(percentage)) / int256(ONE_HUNDRED_PERCENT);
    }

    function abs(int256 self) internal pure returns (uint256) {
        return self >= 0 ? uint256(self) : uint256(-1 * self);
    }

    /**
     * @notice Returns a ratio of 2 numbers.
     * @param self The number to get a ratio of.
     * @param num The number to calculate the ratio for.
     * @return Ratio of 2 numbers with 2 decimal places (10000 = 100%).
     */
    function ratioOf(uint256 self, uint256 num)
        internal
        pure
        returns (uint256)
    {
        return (self * ONE_HUNDRED_PERCENT) / num;
    }
}
