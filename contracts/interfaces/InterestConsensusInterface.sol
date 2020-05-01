pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";

interface InterestConsensusInterface {
    event InterestSubmitted(
        address indexed signer,
        address indexed lender,
        uint256 endTime,
        uint256 interest
    );

    event InterestAccepted(address lender, uint256 endTime, uint256 interest);

    function processRequest(
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse[] calldata responses
    ) external returns (uint256);
}
