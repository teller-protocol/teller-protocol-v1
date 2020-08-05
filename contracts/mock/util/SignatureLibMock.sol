pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../util/SignatureLib.sol";

contract SignatureLibMock {
    using SafeMath for uint256;
    using SignatureLib for SignatureLib.Signature;

    SignatureLib.Signature public signature;

    uint256 private _mockChainId = 1; // Mainnet

    function _getChainId() internal view returns (uint256) {
        return _mockChainId;
    }

    function mockChainId(uint256 newChainId) external {
        _mockChainId = newChainId;
    }

    function setInterestReqHash(
        ZeroCollateralCommon.InterestRequest memory request,
        address callerAddress
        )
        public
    {
        signature.setInterestRequestHash(request, callerAddress, _mockChainId);
    }

    function getHashedInterestRequest(
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

    function getHashInterestResponse(
        ZeroCollateralCommon.InterestResponse memory response
        )
        public
        view
        returns (bytes32)
    {
        return signature.responseHash;
    }

    function setLoanRequestHash(
        ZeroCollateralCommon.LoanRequest memory request,
        address callerAddress
        )
        public
    {
        signature.setLoanRequestHash(request, callerAddress, _mockChainId);
    }

    function getHashedLoanRequest(
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

    function getHashedLoanResponse(
        ZeroCollateralCommon.LoanResponse memory response
        )
        public
        view
        returns (bytes32)
    {
        return signature.hashLoanResponse(response);
    }

}
