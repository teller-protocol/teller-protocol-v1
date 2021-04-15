// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { MarketStorageLib } from "../storage/market.sol";

contract SignersFacet {
    /**
     * @notice It adds a new account as a signer.
     * @param account address to add.
     * @dev The sender must be the owner.
     * @dev It throws a require error if the sender is not the owner.
     */
    function addSigner(address account) external {
        _addSigner(account);
    }

    /**
     * @notice It adds a list of account as signers.
     * @param accounts addresses to add.
     * @dev The sender must be the owner.
     * @dev It throws a require error if the sender is not the owner.
     */
    function addSigners(address[] calldata accounts) external {
        for (uint256 i; i < accounts.length; i++) {
            _addSigner(accounts[i]);
        }
    }

    function _addSigner(address asset, address account) internal {
        if (!_isSigner(account)) {
            MarketStorageLib.store().signers[asset].add(account);
        }
    }

    function _isSigner(address asset, address account)
        internal
        view
        returns (bool isSigner_)
    {
        isSigner_ = MarketStorageLib.store().signers[asset].contains(account);
    }
}
