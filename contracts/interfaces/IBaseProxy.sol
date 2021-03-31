// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBaseProxy {
    /**
        @notice Returns the current implementation.
        @return Address of the current implementation
     */
    function implementation() external view returns (address);
}
