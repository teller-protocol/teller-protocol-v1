pragma solidity ^0.8.0;
import "../internal/get-debt-ratio-for.sol";

abstract contract ext_getDebtRatioFor_Market_v1 is
    int_getDebtRatioFor_Market_v1
{
    function getDebtRatioFor(uint256 newLoanAmount) external view returns (uint256) {
        return _getDebtRatioFor(newLoanAmount);
    }
}
