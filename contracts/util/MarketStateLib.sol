pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./NumbersLib.sol";

/**
 * @notice Utility library of inline functions on the MarketState struct.
 *
 * @author develop@teller.finance
 */
library MarketStateLib {
    using SafeMath for uint256;
    using NumbersLib for uint256;

    struct MarketState {
        uint256 totalSupplied;
        uint256 totalRepaid;
        uint256 totalBorrowed;
    }

    /**
        @notice It increases the repayment amount for a given market.
        @param self the current market state reference.
        @param amount amount to add.
     */
    function increaseRepayment(MarketState storage self, uint256 amount) internal {
        self.totalRepaid = self.totalRepaid.add(amount);
    }

    /**
        @notice It increases the supply amount for a given market.
        @param self the current market state reference.
        @param amount amount to add.
     */
    function increaseSupply(MarketState storage self, uint256 amount) internal {
        self.totalSupplied = self.totalSupplied.add(amount);
    }

    /**
        @notice It decreases the supply amount for a given market.
        @param self the current market state reference.
        @param amount amount to add.
     */
    function decreaseSupply(MarketState storage self, uint256 amount) internal {
        self.totalSupplied = self.totalSupplied.sub(amount);
    }

    /**
        @notice It increases the borrowed amount for a given market.
        @param self the current market state reference.
        @param amount amount to add.
     */
    function increaseBorrow(MarketState storage self, uint256 amount) internal {
        self.totalBorrowed = self.totalBorrowed.add(amount);
    }

    /**
        @notice It gets the current debt ratio for a given market.
        @dev The formula to calculate debt ratio is the same as the one in `getDebtRatioFor` with 0 as the new loan amount.
        @param self the current market state reference.
        @return the debt ratio value.
     */
    function getDebtRatio(MarketState storage self) internal view returns (uint256) {
        return getDebtRatioFor(self, 0);
    }

    /**
        @notice It gets the debt ratio for a given market, including a new loan amount.
        @notice The formula to calculate debt ratio (including a new loan amount) is:
            debtRatio =  (SUM(total borrowed) + newLoanAmount - SUM(total repaid)) / SUM(total supplied)
        @notice The value has 2 decimal places.
            Example:
                100 => 1%
        @param self the current market state reference.
        @param loanAmount a new loan amount to consider in the ratio.
        @return the debt ratio value.
     */
    function getDebtRatioFor(MarketState storage self, uint256 loanAmount)
        internal
        view
        returns (uint256)
    {
        if (
            self.totalSupplied == 0 ||
            self.totalBorrowed.add(loanAmount) <= self.totalRepaid
        ) {
            return 0;
        }

        uint256 debt = self.totalBorrowed.add(loanAmount).sub(self.totalRepaid);
        return debt.ratioOf(self.totalSupplied);
    }
}
