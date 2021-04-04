// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/NumbersList.sol";

abstract contract int_get_consensus_v1 is NumbersList {
    function _getConsensus(NumbersList.Values memory values, uint256 tolerance)
        internal
        pure
        returns (uint256)
    {
        require(values.isWithinTolerance(tolerance), "RESPONSES_TOO_VARIED");

        return values.getAverage();
    }
}

abstract contract int_get_consensus is int_get_consensus_v1 {}
