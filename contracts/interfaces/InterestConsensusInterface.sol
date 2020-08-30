pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";


/**
    @notice This interface defines the functions to process node responses and get consensus in the lender interest.

    @author develop@teller.finance
 */
interface InterestConsensusInterface {
    /**
        @notice This event is emitted when an interest response is submitted or processed.
        @param signer node signer
        @param lender address.
        @param requestNonce request nonce.
        @param endTime request end time.
        @param interest value in  the node response.
     */
    event InterestSubmitted(
        address indexed signer,
        address indexed lender,
        uint256 requestNonce,
        uint256 endTime,
        uint256 interest
    );

    /**
        @notice This event is emitted when an interest value is accepted as consensus.
        @param lender address.
        @param requestNonce request nonce.
        @param endTime request end time.
        @param interest consensus interest value.
     */
    event InterestAccepted(
        address indexed lender,
        uint256 requestNonce,
        uint256 endTime,
        uint256 interest
    );

    /**
        @notice It processes all the node responses for a request in order to get a consensus value.
        @param request the interest request sent by the lender.
        @param responses all node responses to process.
        @return the consensus interest.
     */
    function processRequest(
        TellerCommon.InterestRequest calldata request,
        TellerCommon.InterestResponse[] calldata responses
    ) external returns (uint256);

    /**
        @notice It initializes this interest consensus contract.
        @dev The caller address is the lenders address for the interest consensus implementation.
        @param owner the owner address.
        @param aCallerAddress the contract that will call it.
        @param aSettingAddress the settings contract address.
     */
    function initialize(
        address owner,
        address aCallerAddress,
        address aSettingAddress
    ) external;
}
