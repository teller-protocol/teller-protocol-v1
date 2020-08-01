pragma solidity 0.5.17;

// Libraries
import "./ZeroCollateralCommon.sol";


/**
 * @dev Signature library of hash functions for interest and loans, responses and requests
 *
 * @author develop@teller.finance
 */

library SignatureLib {

    struct Signature {
       bytes32 responseHash;
       bytes32 requestHash;
       address callerAddress;
       uint256 chainId;
    }

    /**
        @notice Stores a hash for the interest request in the struct
        @param self current signature struct
     */
    function setInterestRequestHash(
        Signature storage self,
        ZeroCollateralCommon.InterestRequest memory request,
        address callerAddress,
        uint256 chainId
        )
        internal
    {
            self.chainId = chainId;
            self.callerAddress = callerAddress;
            self.requestHash = hashInterestRequest(self, request);
    }

    /**
        @notice It creates a hash value based on the lender request.
        @param self current signature struct
        @return a hash value.
     */
    function hashInterestRequest(
        Signature storage self,
        ZeroCollateralCommon.InterestRequest memory request
        )
        internal
        view
        returns (bytes32)
    {
        return keccak256(
                abi.encode(
                    self.callerAddress,
                    request.lender,
                    request.consensusAddress,
                    request.startTime,
                    request.endTime,
                    request.requestTime,
                    self.chainId
                )
            );
    }

    /**
        @notice It stores a hash based on a node response and lender request.
        @param self current signature struct
        @return a hash value.
     */
    function setHashInterestResponse(
        Signature storage self,
        ZeroCollateralCommon.InterestResponse memory response
        )
        internal
    {
        self.responseHash = hashInterestResponse(self, response);

    }

    /**
        @notice It creates a hash based on a node response and lender request.
        @param self current signature struct
        @return a hash value.
     */
    function hashInterestResponse(
        Signature storage self,
        ZeroCollateralCommon.InterestResponse memory response
    ) internal
      view
      returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interest,
                    response.signature.signerNonce,
                    self.chainId,
                    self.requestHash
                )
            );
    }

    /**
        @notice Stores a hash for the loan request in the struct
        @param self current signature struct
     */
    function setLoanRequestHash(
        Signature storage self,
        ZeroCollateralCommon.LoanRequest memory request,
        address callerAddress,
        uint256 chainId
        )
        internal
    {
            self.chainId = chainId;
            self.callerAddress = callerAddress;
            self.requestHash = hashLoanRequest(self, request);
    }

    /**
        @notice Generates a hash for the loan request
        @param self current signature struct
        @return bytes32 Hash of the loan request
     */
    function hashLoanRequest(
        Signature storage self,
        ZeroCollateralCommon.LoanRequest memory request
        )
        internal
        view
        returns (bytes32)
    {
        return keccak256(
                abi.encode(
                    self.callerAddress,
                    request.borrower,
                    request.recipient,
                    request.consensusAddress,
                    request.requestNonce,
                    request.amount,
                    request.duration,
                    request.requestTime,
                    self.chainId
                )
            );
    }

    /**
        @notice It creates a hash based on a node response and loan request.
        @param self current signature struct
        @return a hash value.
     */
    function setHashLoanResponse(
        Signature storage self,
        ZeroCollateralCommon.LoanResponse memory response
    ) internal
    {
        self.responseHash = hashLoanResponse(self, response);

    }

    /**
        @notice Generates a hash for the loan response
        @param self current signature struct
        @return bytes32 Hash of the loan response
     */
    function hashLoanResponse(
        Signature storage self,
        ZeroCollateralCommon.LoanResponse memory response
    ) internal
      view
      returns (bytes32)
    {
        return keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interestRate,
                    response.collateralRatio,
                    response.maxLoanAmount,
                    response.signature.signerNonce,
                    self.chainId,
                    self.requestHash
                )
            );
    }

    /**
        @notice Gets the current chain id using the opcode 'chainid()'.
        @return the current chain id.
     */
    function _getChainId() internal view returns (uint256) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

 }