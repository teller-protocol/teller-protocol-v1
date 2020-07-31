pragma solidity 0.5.17;

// Libraries
import "../util/ZeroCollateralCommon.sol";

/**
 * @dev Signature library of hash functions for loan responses and requests
 *
 * @author develop@teller.finance
 */

 library LoanSignatureLib {
    using SafeMath for uint256;

    struct Signature {
        ZeroCollateralCommon.LoanResponse response;
        ZeroCollateralCommon.LoanRequest request;
        address callerAddress;
        bytes32 requestHash;
        uint256 chainId;
    }
    /**
        @notice Generates a hash for the loan response
        @param self current signature struct
        @return bytes32 Hash of the loan response
     */
    function hashLoanTermsResponse(
        Signature storage self
    ) internal
      view
      returns (bytes32)
    {
        return keccak256(
                abi.encode(
                    self.response.consensusAddress,
                    self.response.responseTime,
                    self.response.interestRate,
                    self.response.collateralRatio,
                    self.response.maxLoanAmount,
                    self.response.signature.signerNonce,
                    self.chainId,
                    self.requestHash
                )
            );
    }

    /**
        @notice Generates a hash for the loan request
        @param self current signature struct
        @return bytes32 Hash of the loan request
     */
    function hashLoanTermsRequest(
        Signature storage self
        )
        internal
        returns (bytes32)
    {
        bytes32 hashedResponse = keccak256(
                abi.encode(
                    self.callerAddress,
                    self.request.borrower,
                    self.request.recipient,
                    self.request.consensusAddress,
                    self.request.requestNonce,
                    self.request.amount,
                    self.request.duration,
                    self.request.requestTime,
                    self.chainId
                )
            );
        self.requestHash = hashedResponse;
        return self.requestHash;
    }
 }