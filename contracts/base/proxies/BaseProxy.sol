// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../interfaces/IBaseProxy.sol";

// Contracts
import "@openzeppelin/contracts/proxy/Proxy.sol";

/**
    @notice It is the base Proxy contract for all other Proxy contracts.
    @dev It makes the current logic implementation address publicly available.

    @author develop@teller.finance
 */
abstract contract BaseProxy is IBaseProxy, Proxy {
    /**
        @notice Returns the current implementation.
        @return Address of the current implementation
     */
    function implementation() external view override returns (address) {
        return _implementation();
    }
}
