// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { PAUSER } from "../../shared/roles.sol";

// Storage
import { AppStorageLib } from "../../storage/app.sol";

contract PausableFacet is RolesMods {
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
        AppStorageLib.store().paused[id] = state;
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
        return AppStorageLib.store().paused[id];
    }
}
