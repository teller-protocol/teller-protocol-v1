pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../util/InterestSignatureLib.sol";

contract InterestSignatureLibMock {
    using InterestSignatureLib for InterestSignatureLib.Signature;

    InterestSignatureLib.Signature public signature;

    constructor(
        ZeroCollateralCommon.InterestRequest memory request,
        ZeroCollateralCommon.InterestResponse memory response,
        address callerAddress,
        uint256 chainId
    ) public {
        signature.request = request;
        signature.response = response;
        signature.callerAddress = callerAddress;
        signature.chainId = chainId;
        signature.hashInterestRequest();
    }

    function getHashInterestResponse()
        public
        view
        returns (bytes32)
    {
        return signature.hashInterestResponse();
    }

    function getRequestHash()
        public
        view
        returns (bytes32)
    {
        return signature.requestHash;
    }

}