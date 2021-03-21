pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";

/**
    @notice This interface defines the function to process the loan terms through the Teller protocol

    @author develop@teller.finance
 */
interface LoanTermsConsensusInterface {
    /**
        @notice Processes the loan request
        @param request Struct of the protocol loan request
        @param responses List of structs of the protocol loan responses
        @return uint256 Interest rate
        @return uint256 Collateral ratio
        @return uint256 Maximum loan amount
     */
    function processRequest(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    /**
        @notice It initializes this loan terms consensus contract.
        @dev The caller address is the loan manager address for the loan terms consensus implementation.
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
