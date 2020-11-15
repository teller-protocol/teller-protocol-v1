pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/**
 * @dev Utility library for uint256 numbers
 *
 * @author develop@teller.finance
 */
library NumbersLib {
    using SafeMath for uint256;

    // It represents 100% with 2 decimal places.
    function ONE_HUNDRED_PERCENT() internal pure returns (uint256) {
        return 10000;
    }

    /**
     * @notice Returns a percentage value of a number.
     * @param self The number to get a percentage of.
     * @param percentage The percentage value to calculate with 2 decimal places (10000 = 100%).
     */
    function percent(uint256 self, uint256 percentage) internal pure returns (uint256) {
        return self.mul(percentage).div(ONE_HUNDRED_PERCENT());
    }

    /**
     * @notice Returns a ratio of 2 numbers.
     * @param self The number to get a ratio of.
     * @param num The number to calculate the ratio for.
     * @return Ratio of 2 numbers with 2 decimal places (10000 = 100%).
     */
    function ratioOf(uint256 self, uint256 num) internal pure returns (uint256) {
        return self.mul(ONE_HUNDRED_PERCENT()).div(num);
    }
}
