pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";


/**
    @notice This interface defines the functions for interactions between lenders and the interests.

    @author develop@teller.finance
 */
interface LendersInterface {
    /**
        @notice It tracks the interest amount for a recipient/lender.
        @param recipient address.
        @param amount to track.
        @return the interest amount to withdraw.
     */
    function withdrawInterest(address recipient, uint256 amount)
        external
        returns (uint256);

    /**
        @notice It sets the accrued interest for a lender.
        @param request interest request sent by the lender.
        @param responses node responses to get a consensus value for the interest.
     */
    function setAccruedInterest(
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse[] calldata responses
    ) external;

    /**
        @notice This event is emitted when an accrued interest is updated.
        @param lender address.
        @param totalNotWithdrawn total amount not withdrawn by the lender.
        @param totalAccruedInterest total accrued interest amount.
     */
    event AccruedInterestUpdated(
        address indexed lender,
        uint256 totalNotWithdrawn,
        uint256 totalAccruedInterest
    );

    /**
        @notice This event is emitted when a lender withdraws an accrued interest amount.
        @param recipient lender address.
        @param amount withdrawn.
     */
    event AccruedInterestWithdrawn(address indexed recipient, uint256 amount);
}
