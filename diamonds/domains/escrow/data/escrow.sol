// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../protocol/interfaces/IProtocol.sol";

abstract contract dat_Escrow {
    IProtocol constant PROTOCOL = IProtocol(0);

    /**
     * @notice Notifies when the Escrow's tokens have been claimed.
     * @param recipient address where the tokens where sent to.
     */
    event TokensClaimed(address recipient);
}
