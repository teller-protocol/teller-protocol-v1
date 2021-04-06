// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/ECDSALib.sol";
import "diamonds/libraries/TellerCommon.sol";

abstract contract int_signature_valid_v1 is TellerCommon, ECDSA {
    function _signatureValid(
        TellerCommon.Signature memory signature,
        bytes32 dataHash,
        address expectedSigner
    ) internal pure returns (bool) {
        return
            expectedSigner ==
            recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        dataHash
                    )
                ),
                signature.v,
                signature.r,
                signature.s
            );
    }
}

abstract contract int_signature_valid is int_signature_valid_v1 {}
