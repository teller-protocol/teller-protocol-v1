pragma solidity 0.5.17;

// Libraries
import "../util/ZeroCollateralCommon.sol";

/**
 * @dev Signature library of hash functions for interest responses and requests
 *
 * @author develop@teller.finance
 */

 library InterestSignatureLib {
    using SafeMath for uint256;
    
    struct Signature {
        ZeroCollateralCommon.InterestResponse response;
        ZeroCollateralCommon.InterestRequest request;
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
        Signature storage self
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

    /**
        @notice It creates a hash value based on the lender request.
        @param self current signature struct
        @return a hash value.
     */
    function hashInterestRequest(
        Signature storage self
        )
        internal
        returns (bytes32)
    {
        bytes32 hashedResponse = keccak256(
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
        self.requestHash = hashedResponse;
        return self.requestHash;
    }
 }