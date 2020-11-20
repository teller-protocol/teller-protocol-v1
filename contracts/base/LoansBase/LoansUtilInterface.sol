pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

interface LoansUtilInterface {
    /**
        @notice Checks whether a loan is allowed to be deposited to an Externally Owned Account.
        @param collateralRatio Collateral ratio required by loan.
        @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function canLoanGoToEOA(uint256 collateralRatio) external view returns (bool);
}
