// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBaseEscrowDapp {
    /* Public Functions */

    /**
     * @notice Returns an array of token addresses, for which this Escrow contract has a balance.
     * @return The list of all tokens held by this contract.
     */
    function getTokens() external view returns (address[] memory);

    /* Events */

    /**
     * @notice This event is emitted when a new token is added to this Escrow.
     * @param tokenAddress address of the new token.
     * @param index Index of the added token.
     */
    event TokenAdded(address tokenAddress, uint256 index);

    /**
     * @notice This event is emitted when a new token is removed from this Escrow.
     * @param tokenAddress address of the removed token.
     * @param index Index of the removed token.
     */
    event TokenRemoved(address tokenAddress, uint256 index);
}
