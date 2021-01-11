pragma solidity 0.5.17;

/**
    @notice This interface defines the function to validate the interest to withdraw by lenders.

    @author develop@teller.finance
 */
interface InterestValidatorInterface {
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
