pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Consensus.sol";

contract ConsensusMock is Consensus {

    function externalSignatureValid(
        ZeroCollateralCommon.Signature calldata signature,
        bytes32 dataHash,
        address expectedSigner
    ) external view returns (bool) {
        return _signatureValid(signature, dataHash, expectedSigner);
    }

}