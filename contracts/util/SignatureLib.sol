pragma solidity 0.5.17;

// Libraries
import "../util/NumbersList.sol";
import "../util/ZeroCollateralCommon.sol";

/**
 * @dev Signature library of hash functions for loan responses and requests
 *
 * @author develop@teller.finance
 */

 library SignatureLib {
     using SafeMath for uint256;
    /**
        @notice Generates a hash for the loan response
        @param response Structs of the protocol loan responses
        @param requestHash Hash of the loan request
        @param chainId Current chain id
        @return bytes32 Hash of the loan response
     */
    function hashLoanTermsResponse(
        ZeroCollateralCommon.LoanResponse memory response,
        bytes32 requestHash,
        uint256 chainId
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interestRate,
                    response.collateralRatio,
                    response.maxLoanAmount,
                    response.signature.signerNonce,
                    chainId,
                    requestHash
                )
            );
    }

    /**
        @notice Generates a hash for the loan request
        @param request Struct of the protocol loan request
        @param callerAddress Address of the caller
        @param chainId Current chain id
        @return bytes32 Hash of the loan request
     */
    function hashLoanTermsRequest(
        ZeroCollateralCommon.LoanRequest memory request,
        address callerAddress,
        uint256 chainId
        )
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    callerAddress,
                    request.borrower,
                    request.recipient,
                    request.consensusAddress,
                    request.requestNonce,
                    request.amount,
                    request.duration,
                    request.requestTime,
                    chainId
                )
            );
    }

    /**
        @notice It creates a hash based on a node response and lender request.
        @param response a node response.
        @param requestHash a hash value that represents the lender request.
        @param chainId Current chain id
        @return a hash value.
     */
    function hashInterestResponse(
        ZeroCollateralCommon.InterestResponse memory response,
        bytes32 requestHash,
        uint256 chainId
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interest,
                    response.signature.signerNonce,
                    chainId,
                    requestHash
                )
            );
    }

    /**
        @notice It creates a hash value based on the lender request.
        @param request the interest request sent by the lender.
        @param callerAddress Address of the caller
        @param chainId Current chain id
        @return a hash value.
     */
    function hashInterestRequest(
        ZeroCollateralCommon.InterestRequest memory request,
        address callerAddress,
        uint256 chainId
        )
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    callerAddress,
                    request.lender,
                    request.consensusAddress,
                    request.startTime,
                    request.endTime,
                    request.requestTime,
                    chainId
                )
            );
    }
 }