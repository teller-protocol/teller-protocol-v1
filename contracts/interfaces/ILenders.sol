pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";

/**
    @notice This interface defines the functions for interactions between lenders and the interests.

    @author develop@teller.finance
 */
interface ILenders {
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
        TellerCommon.InterestRequest calldata request,
        TellerCommon.InterestResponse[] calldata responses
    ) external;

    /**
        @notice It initializes this contract instance.
        @param tTokenAddress tToken contract address.
        @param lendingPoolAddress lending pool contract address.
        @param interestConsensusAddress interest consensus contract address.
        @param settingAddress settings contract address.
     */
    function initialize(
        address tTokenAddress,
        address lendingPoolAddress,
        address interestConsensusAddress,
        address settingAddress
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
