pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/LoanTermsConsensus.sol";

contract LoanTermsConsensusMock is LoanTermsConsensus {
    uint256 private _mockChainId = 1; // Mainnet

    function mockInterestRateSubmissions(
        address borrower,
        uint256 requestNonce,
        uint256 totalSubmissions,
        uint256 maxValue,
        uint256 minValue,
        uint256 sumOfValues
    ) external {
        termSubmissions[borrower][requestNonce].interestRate = NumbersList.Values({
            count: totalSubmissions,
            min: minValue,
            max: maxValue,
            sum: sumOfValues
        });
    }

    function mockCollateralRatioSubmissions(
        address borrower,
        uint256 requestNonce,
        uint256 totalSubmissions,
        uint256 maxValue,
        uint256 minValue,
        uint256 sumOfValues
    ) external {
        termSubmissions[borrower][requestNonce].collateralRatio = NumbersList.Values({
            count: totalSubmissions,
            min: minValue,
            max: maxValue,
            sum: sumOfValues
        });
    }

    function mockMaxAmountSubmissions(
        address borrower,
        uint256 requestNonce,
        uint256 totalSubmissions,
        uint256 maxValue,
        uint256 minValue,
        uint256 sumOfValues
    ) external {
        termSubmissions[borrower][requestNonce].maxLoanAmount = NumbersList.Values({
            count: totalSubmissions,
            min: minValue,
            max: maxValue,
            sum: sumOfValues
        });
    }

    function mockHasSubmitted(
        address signer,
        address lender,
        uint256 blockNumber,
        bool hasSub
    ) external {
        hasSubmitted[signer][lender][blockNumber] = hasSub;
    }

    function mockSignerNonce(
        address signer,
        uint256 signerNonce,
        bool taken
    ) external {
        signerNonceTaken[signer][signerNonce] = taken;
    }

    function mockBorrowerToLastLoanTermRequest(address borrower, uint256 lastTime)
        external
    {
        borrowerToLastLoanTermRequest[borrower] = lastTime;
    }

    function mockRequestNonce(
        address borrower,
        uint256 borrowerNonce,
        bool taken
    ) external {
        requestNonceTaken[borrower][borrowerNonce] = taken;
    }

    function mockChainId(uint256 newChainId) external {
        _mockChainId = newChainId;
    }

    function externalProcessResponse(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse calldata response,
        bytes32 requestHash
    ) external {
        _processResponse(request, response, requestHash);
    }

    function externalHashResponse(
        TellerCommon.LoanResponse calldata response,
        bytes32 requestHash
    ) external view returns (bytes32) {
        return _hashResponse(response, requestHash);
    }

    function externalHashRequest(TellerCommon.LoanRequest calldata request)
        external
        view
        returns (bytes32)
    {
        return _hashRequest(request);
    }

    function _getChainId() internal view returns (uint256) {
        return _mockChainId;
    }

    function externalRequireRequestLoanTermsRateLimit(
        TellerCommon.LoanRequest calldata request
    ) external view returns (bool) {
        super._requireRequestLoanTermsRateLimit(request);
        return true;
    }

    function _isCaller(address) internal view returns (bool) {
        return true;
    }
}
