// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../contracts/util/TellerCommon.sol";

abstract contract int_hash_response_v1 is TellerCommon {
    function _hashResponse(
        TellerCommon.LoanResponse memory response,
        bytes32 requestHash,
        uint256 chainId
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interestRate,
                    response.collateralRatio,
                    response.maxLoanAmount,
                    chainId,
                    requestHash
                )
            );
    }
}

abstract contract int_hash_response is int_hash_response_v1 {}
