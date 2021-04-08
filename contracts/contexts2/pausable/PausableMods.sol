// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PausableStorageLib } from "./storage.sol";

abstract contract PausableMods {
    /**
     * @notice Requires that the state of the protocol AND the given facet id equal {state}.
     * @param id id of the facet to check if is paused.
     * @param state Boolean that the protocol AND facet should be in.
     */
    modifier paused(bytes32 id, bool state) {
        require(
            isPaused("") == state && isPaused(id) == state,
            pausedMessage(state)
        );
        _;
    }

    /**
     * @dev Checks if the given id is paused.
     * @param id Encoded id of the facet to check if is paused.
     */
    function isPaused(bytes32 id) private view returns (bool) {
        return PausableStorageLib.store().paused[id];
    }

    /**
     * @dev Gets the message that should be reverted with given a state it should be in.
     * @param state Boolean that an id should be in.
     */
    function pausedMessage(bool state) private pure returns (string memory) {
        return state ? "Pausable: not paused" : "Pausable: paused";
    }
}
