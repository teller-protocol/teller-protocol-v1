// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Libraries
import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { MarketStorageLib } from "../storage/market.sol";

contract SignersFacet is RolesMods {
    /**
     * @dev Emitted when `account` is added as a consensus signer.
     *
     * `sender` is the account that originated the contract call with an admin role.
     */
    event SignerAdded(address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is removed as a consensus signer.
     *
     * `sender` is the account that originated the contract call with an admin role.
     */
    event SignerRemoved(address indexed account, address indexed sender);

    /**
     * @notice It adds a list of account as signers for an asset market. See {SignerFacet._addSigner}
     * @param asset Token address to add signers for.
     * @param accounts addresses to add.
     *
     * Requirements:
     *  - Sender must have the role ADMIN
     */
    function addSigners(address asset, address[] calldata accounts)
        external
        authorized(ADMIN, msg.sender)
    {
        for (uint256 i; i < accounts.length; i++) {
            _addSigner(asset, accounts[i]);
        }
    }

    /**
     * @notice It removes a list of account as signers for an asset market. See {SignerFacet._removeSigner}
     * @param asset Token address to remove signers for.
     * @param accounts addresses to remove.
     *
     * Requirements:
     *  - Sender must have the role ADMIN
     */
    function removeSigners(address asset, address[] calldata accounts)
        external
        authorized(ADMIN, msg.sender)
    {
        for (uint256 i; i < accounts.length; i++) {
            _removeSigner(asset, accounts[i]);
        }
    }

    /**
     * @notice it checks if an account is already in the list of the asset's signers
     * @param asset the asset to check for if the signer exists
     * @param account the account to check in the list of the asset's signers
     */
    function isSigner(address asset, address account)
        public
        view
        returns (bool isSigner_)
    {
        isSigner_ = EnumerableSet.contains(
            MarketStorageLib.store().signers[asset],
            account
        );
    }

    /**
     * @notice It adds an account as a signer for an asset market. Emits an event if new account is added.
     * @param asset Token address to add signers for.
     * @param account address to add.
     */
    function _addSigner(address asset, address account) internal {
        bool added = EnumerableSet.add(
            MarketStorageLib.store().signers[asset],
            account
        );
        if (added) {
            emit SignerAdded(account, msg.sender);
        }
    }

    /**
     * @notice It adds an account as a signer for an asset market. Emits an event if account is removed.
     * @param asset Token address to add signers for.
     * @param account address to add.
     */
    function _removeSigner(address asset, address account) internal {
        bool removed = EnumerableSet.remove(
            MarketStorageLib.store().signers[asset],
            account
        );
        if (removed) {
            emit SignerRemoved(account, msg.sender);
        }
    }
}
