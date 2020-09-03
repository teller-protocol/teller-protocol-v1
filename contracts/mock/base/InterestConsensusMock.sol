pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/InterestConsensus.sol";

contract InterestConsensusMock is InterestConsensus {
    uint256 private _mockChainId = 1; // Mainnet

    function mockInterestSubmissions(
        address lender,
        uint256 endTime,
        uint256 totalSubmissions,
        uint256 maxValue,
        uint256 minValue,
        uint256 sumOfValues
    ) external {
        interestSubmissions[lender][endTime] = NumbersList.Values({
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

    function mockChainId(uint256 newChainId) external {
        _mockChainId = newChainId;
    }

    function externalProcessResponse(
        TellerCommon.InterestRequest calldata request,
        TellerCommon.InterestResponse calldata response,
        bytes32 requestHash
    ) external {
        _processResponse(request, response, requestHash);
    }

    function externalHashResponse(
        TellerCommon.InterestResponse calldata response,
        bytes32 requestHash
    ) external view returns (bytes32) {
        return _hashResponse(response, requestHash);
    }

    function externalHashRequest(TellerCommon.InterestRequest calldata request)
        external
        view
        returns (bytes32)
    {
        return _hashRequest(request);
    }

    function _getChainId() internal view returns (uint256) {
        return _mockChainId;
    }

    function mockRequestNonce(
        address lender,
        uint256 requestNonce,
        bool taken
    ) external {
        requestNonceTaken[lender][requestNonce] = taken;
    }

    function _isCaller(address) internal view returns (bool) {
        return true;
    }
}
