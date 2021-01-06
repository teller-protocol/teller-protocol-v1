pragma solidity 0.5.17;

/**
    @notice This interface define the functio to validate the interest to withdraw by lenders.

    @author develop@teller.finance
 */
interface IInterestValidator {
    /**
        @notice It tests whether an interest for a given lender and market is valid or not.
        @return true if the amount is valid. Otherwise it returns false.
     */
    function isInterestValid(
        address borrowedAsset,
        address collateralAsset,
        address lender,
        uint256 amount
    ) external view returns (bool);
}
