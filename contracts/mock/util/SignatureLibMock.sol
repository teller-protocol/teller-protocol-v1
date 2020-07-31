pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../util/SignatureLib.sol";

contract SignatureLibMock {
    using SignatureLib for SignatureLib.Signature;

    SignatureLib.Signature public signature;

    function setInterestReqHash(
        ZeroCollateralCommon.InterestRequest memory request
        )
        public
    {
        signature.setInterestRequestHash(request);
    }

    function gethashedInterestRequest(
        ZeroCollateralCommon.InterestRequest memory request
        )
        public
        view
        returns (bytes32)
    {
        return signature.hashInterestRequest(request);
    }

    function setHashInterestResponse(
        ZeroCollateralCommon.InterestResponse memory response
        )
        public
    {
        signature.setHashInterestResponse(response);
    }

    function gethashInterestResponse(
        ZeroCollateralCommon.InterestResponse memory response
        )
        public
        view
        returns (bytes32)
    {
        return signature.hashInterestResponse(response);
    }

    function setLoanRequestHash(
        ZeroCollateralCommon.LoanRequest memory request
        )
        public
    {
        signature.setLoanRequestHash(request);
    }

    function gethashedLoanRequest(
        ZeroCollateralCommon.LoanRequest memory request
        )
        public
        view
        returns (bytes32)
    {
        return signature.hashLoanRequest(request);
    }

    function setHashLoanResponse(
        ZeroCollateralCommon.LoanResponse memory response
        )
        public
    {
        signature.setHashLoanResponse(response);
    }

    function gethashLoanResponse(
        ZeroCollateralCommon.LoanResponse memory response
        )
        public
        view
        returns (bytes32)
    {
        return signature.hashLoanResponse(response);
    }

}