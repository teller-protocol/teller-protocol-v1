// SPDX-License-Identifier: Unlicense
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

contract SignatureValidator {
    struct Signature {
        uint256 signerNonce;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct LoanRequest {
        address payable borrower;
        address recipient;
        address consensusAddress;
        uint256 requestNonce;
        uint256 amount;
        uint256 duration;
        uint256 requestTime;
    }

    // Borrower response object to take out a loan
    struct LoanResponse {
        address signer;
        address consensusAddress;
        uint256 responseTime;
        uint256 interestRate;
        uint256 collateralRatio;
        uint256 maxLoanAmount;
        Signature signature;
    }

    function getChainId() public view returns (uint256) {
        return _getChainId();
    }

    function _getChainId() internal view returns (uint256) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    function createLoanWithTerms(
        address callerAddress,
        LoanRequest memory request,
        LoanResponse memory response
    )
        public
        view
        returns (
            bool validResponse,
            address signer,
            bytes32 requestHash,
            bytes32 responseHash
        )
    {
        requestHash = hashRequest(callerAddress, request);

        responseHash = hashResponse(response, requestHash);

        (validResponse, signer) = validateResponse(
            response.signer,
            responseHash,
            response.signature
        );
    }

    function hashRequest(address callerAddress, LoanRequest memory request)
        public
        view
        returns (bytes32 requestHash)
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
                    _getChainId()
                )
            );
    }

    function hashResponse(LoanResponse memory response, bytes32 requestHash)
        public
        view
        returns (bytes32 responseHash)
    {
        responseHash = keccak256(
            abi.encode(
                response.consensusAddress,
                response.responseTime,
                response.interestRate,
                response.collateralRatio,
                response.maxLoanAmount,
                response.signature.signerNonce,
                _getChainId(),
                requestHash
            )
        );
    }

    function validateResponse(
        address expectedSigner,
        bytes32 responseHash,
        Signature memory signature
    ) public pure returns (bool result, address signer) {
        signer = ecrecover(
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", responseHash)),
            signature.v,
            signature.r,
            signature.s
        );
        result = signer == expectedSigner;
    }
}
