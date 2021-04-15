// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { MarketStorageLib } from "../storage/market.sol";

// Libraries
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract SignersFacet {
    /**
     * @notice It adds a new account as a signer.
     * @param asset Token address to add signers for.
     * @param account address to add.
     * @dev The sender must be the owner.
     * @dev It throws a require error if the sender is not the owner.
     */
    function addSigner(address asset, address account) external {
        _addSigner(asset, account);
    }

    /**
     * @notice It adds a list of account as signers.
     * @param asset Token address to add signers for.
     * @param accounts addresses to add.
     * @dev The sender must be the owner.
     * @dev It throws a require error if the sender is not the owner.
     */
    function addSigners(address asset, address[] calldata accounts) external {
        for (uint256 i; i < accounts.length; i++) {
            _addSigner(asset, accounts[i]);
        }
    }

    function _addSigner(address asset, address account) internal {
        if (!isSigner(asset, account)) {
            EnumerableSet.add(MarketStorageLib.store().signers[asset], account);
        }
    }

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
}
