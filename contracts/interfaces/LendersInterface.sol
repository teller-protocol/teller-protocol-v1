pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";

interface LendersInterface {
    function withdrawInterest(address recipient, uint256 amount)
        external
        returns (uint256);

    function setAccruedInterest(
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse[] calldata responses
    ) external;

    event AccruedInterestUpdated(
        address indexed lender,
        uint256 totalNotWithdrawn,
        uint256 totalAccruedInterest
    );

    event AccruedInterestWithdrawn(address indexed recipient, uint256 amount);
}
