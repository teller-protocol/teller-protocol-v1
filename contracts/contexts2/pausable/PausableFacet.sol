// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PausableStorageLib } from "./storage.sol";
import { RolesMods } from "../access-control/roles/RolesMods.sol";

contract PausableFacet is RolesMods {
    bytes32 constant PAUSER = keccak256("PAUSER");

    /**
     * @dev Emitted when an {id} is paused by {sender}.
     */
    event Paused(bytes32 indexed id, address sender);

    /**
     * @dev Emitted when an {id} is unpaused by {sender}.
     */
    event UnPaused(bytes32 indexed id, address sender);

    /**
     * @notice Puts an id in the given state.
     * @dev A blank id ("") is equivalent to the whole protocol. If a specific facet should be paused, pass its encoded id.
     * @param id Encoded id of a facet to {pause}.
     * @param state The new state that {id} should be in.
     *
     * Requirements:
     *  - Sender must have the PAUSER role.
     */
    function pause(bytes32 id, bool state)
        external
        authorized(PAUSER, msg.sender)
    {
        if (isPaused(id) == state) return;
        PausableStorageLib.store().paused[id] = state;
        if (state) {
            emit Paused(id, msg.sender);
        } else {
            emit UnPaused(id, msg.sender);
        }
    }

    /**
     * @notice Checks if an id is paused.
     * @dev A blank id ("") is equivalent to the whole protocol. If a specific facet should be paused, pass its encoded id.
     * @param id Encoded id of a facet to {pause}.
     * @return The state that {id} is in.
     */
    function isPaused(bytes32 id) public view returns (bool) {
        return PausableStorageLib.store().paused[id];
    }
}
