// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../contracts/util/TellerCommon.sol";

abstract contract int_hash_request_v1 is TellerCommon {
    function _hashRequest(
        TellerCommon.LoanRequest memory request,
        uint256 chainId
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    request.borrower,
                    request.recipient,
                    request.consensusAddress,
                    request.requestNonce,
                    request.amount,
                    request.duration,
                    request.requestTime,
                    chainId
                )
            );
    }
}

abstract contract int_hash_request is int_hash_request_v1 {}
