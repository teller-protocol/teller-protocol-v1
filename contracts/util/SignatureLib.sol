pragma solidity 0.5.17;

// Libraries
import "../util/ZeroCollateralCommon.sol";

/**
 * @dev Signature library of hash functions for interest and loans, responses and requests
 *
 * @author develop@teller.finance
 */

library SignatureLib {
    // Struct for interest hashes
    struct InterestSignature {
        ZeroCollateralCommon.InterestResponse response;
        ZeroCollateralCommon.InterestRequest request;
        address callerAddress;
        bytes32 requestHash;
        uint256 chainId;
    }
    // Struct for loan hashes
    struct LoanSignature {
        ZeroCollateralCommon.LoanResponse response;
        ZeroCollateralCommon.LoanRequest request;
        address callerAddress;
        bytes32 requestHash;
        uint256 chainId;
    }

    /**
        @notice It creates a hash based on a node response and lender request.
        @param self current signature struct
        @return a hash value.
     */
    function hashInterestResponse(
        InterestSignature storage self
    ) internal
      view
      returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    self.response.consensusAddress,
                    self.response.responseTime,
                    self.response.interest,
                    self.response.signature.signerNonce,
                    self.chainId,
                    self.requestHash
                )
            );
    }

    function setInterestRequestHash(
        InterestSignature storage self
        )
        internal
    {
            self.requestHash = gethashInterestRequest(self);
    }

    /**
        @notice It creates a hash value based on the lender request.
        @param self current signature struct
        @return a hash value.
     */
    function gethashInterestRequest(
        InterestSignature storage self
        )
        internal
        view
        returns (bytes32)
    {
        return keccak256(
                abi.encode(
                    self.callerAddress,
                    self.request.lender,
                    self.request.consensusAddress,
                    self.request.startTime,
                    self.request.endTime,
                    self.request.requestTime,
                    self.chainId
                )
            );
        
    }

    /**
        @notice Generates a hash for the loan response
        @param self current signature struct
        @return bytes32 Hash of the loan response
     */
    function hashLoanTermsResponse(
        LoanSignature storage self
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
    function gethashLoanTermsRequest(
        LoanSignature storage self
        )
        internal
        view
        returns (bytes32)
    {
        return keccak256(
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
    }

    function setLoanTermsRequestHash(
        LoanSignature storage self
        )
        internal
    {
        self.requestHash = gethashLoanTermsRequest(self);
    }

 }