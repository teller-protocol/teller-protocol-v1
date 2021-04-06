import "./get-total-supplied.sol";
import "../../../libraries/NumbersLib.sol";

abstract contract int_getDebtRatioFor_Market_v1 is
    int_getTotalSupplied_LendingPool_v1
{
    using NumbersLib for uint256;

    function _getDebtRatioFor(uint256 newLoanAmount)
        internal
        view
        returns (uint256)
    {
        uint256 totalSupplied = _getTotalSupplied();

        return
            totalSupplied == 0
                ? 0
                : (getLendingPool().totalBorrowed +
                    newLoanAmount -
                    getLendingPool().totalRepaid)
                    .ratioOf(totalSupplied);
    }
}
