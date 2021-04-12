// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { MarketStorageLib } from "../storage/market.sol";
import { AddressArrayLib } from "../shared/libraries/AddressArrayLib.sol";

contract SignersFacet {
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
        @notice It adds a new account as a signer.
        @param account address to add.
        @dev The sender must be the owner.
        @dev It throws a require error if the sender is not the owner.
     */
    function addSigner(address account) external {
        _addSigner(account);
    }

    /**
        @notice It adds a list of account as signers.
        @param accounts addresses to add.
        @dev The sender must be the owner.
        @dev It throws a require error if the sender is not the owner.
     */
    function addSigners(address[] calldata accounts) external {
        for (uint256 index = 0; index < accounts.length; index++) {
            address account = accounts[index];
            _addSigner(account);
        }
    }

    function _addSigner(address account) internal {
        if (!_isSigner(account)) {
            MarketStorageLib.marketStore().signers.add(account);
        }
    }

    function _isSigner(address account) internal view returns (bool isSigner_) {
        (isSigner_, ) = MarketStorageLib.marketStore().signers.getIndex(
            account
        );
    }
}
