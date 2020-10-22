// SPDX-License-Identifier: Unlicense
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/LoanTermsConsensus.sol";
import "../../util/TellerCommon.sol";

contract LoanTermsSignatureValidator is LoanTermsConsensus {

    function getChainId() public view returns (uint256) {
        return _getChainId();
    }

    function validateSignatureAndHashes(
        TellerCommon.LoanRequest memory request,
        TellerCommon.LoanResponse memory response
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
        requestHash = hashRequest(request);

        responseHash = hashResponse(response, requestHash);

        (validResponse, signer) = validateResponse(
            response.signer,
            responseHash,
            response.signature
        );
    }

    function mockCallerAddress(address aCallerAddress) public {
        callerAddress = aCallerAddress;
    }

    /**
        @notice The hash is calculated using the current caller address. So, for testing purposes, if you need to change the current caller address value, you will need to call the 'mockCallerAddress' function before calling this function.
     */
    function hashRequest(TellerCommon.LoanRequest memory request)
        public
        view
        returns (bytes32 requestHash)
    {
        return _hashRequest(request);
    }

    function hashResponse(TellerCommon.LoanResponse memory response, bytes32 requestHash)
        public
        view
        returns (bytes32 responseHash)
    {
        return _hashResponse(response, requestHash);
    }


    function validateResponse(
        address expectedSigner,
        bytes32 responseHash,
        TellerCommon.Signature memory signature
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
