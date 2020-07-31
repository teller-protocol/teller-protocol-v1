pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../util/LoanSignatureLib.sol";

contract LoanSignatureLibMock {
    using LoanSignatureLib for LoanSignatureLib.Signature;

    LoanSignatureLib.Signature public signature;

    constructor(
        ZeroCollateralCommon.LoanRequest memory request,
        ZeroCollateralCommon.LoanResponse memory response,
        address callerAddress,
        uint256 chainId
    ) public {
        signature.request = request;
        signature.response = response;
        signature.callerAddress = callerAddress;
        signature.chainId = chainId;
        signature.hashLoanTermsRequest();
    }

    function getHashLoanTermsResponse()
        public
        view
        returns (bytes32)
    {
        return signature.hashLoanTermsResponse();
    }

    function getRequestHash()
        public
        view
        returns (bytes32)
    {
        return signature.requestHash;
    }

}