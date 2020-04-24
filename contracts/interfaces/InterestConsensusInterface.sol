pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";


interface InterestConsensusInterface {
    event InterestSubmitted(
        address indexed signer,
        address indexed lender,
        uint256 blockNumber,
        uint256 interest
    );

    event InterestAccepted(address indexed lender, uint256 blockNumber, uint256 interest);

    function submitInterestResult(
        ZeroCollateralCommon.Signature calldata signature,
        address lender,
        uint256 blockNumber,
        uint256 interest
    ) external;
}
