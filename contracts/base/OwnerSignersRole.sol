pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Roles.sol";

/**
    @notice This contract manages the signer role for the consensus contracts.
    @notice It includes an owner role who has the ability to grant the signer role.
    @dev It uses the Roles contract from OpenZeppelin.

    @author develop@teller.finance
 */
contract OwnerSignersRole {
    using Roles for Roles.Role;

    /**
        @notice This event is emitted when a new signer is added.
        @param account added as a signer.
     */
    event SignerAdded(address indexed account);

    /**
        @notice This event is emitted when a signer is removed.
        @param account removed as a signer.
     */
    event SignerRemoved(address indexed account);

    Roles.Role private _signers;

    uint256 public _signerCount;

    address internal _owner;

    modifier onlyOwner() {
        require(msg.sender == _owner, "NOT_OWNER");
        _;
    }

    /**
        @notice Gets whether an account address is a signer or not.
        @param account address to test.
        @return true if account is a signer. Otherwise it returns false.
     */
    function isSigner(address account) public view returns (bool) {
        return _signers.has(account);
    }

    /**
        @notice It adds a new account as a signer.
        @param account address to add.
        @dev The sender must be the owner.
        @dev It throws a require error if the sender is not the owner.
     */
    function addSigner(address account) public onlyOwner {
        _addSigner(account);
    }

    /**
        @notice It adds a list of account as signers.
        @param accounts addresses to add.
        @dev The sender must be the owner.
        @dev It throws a require error if the sender is not the owner.
     */
    function addSigners(address[] memory accounts) public onlyOwner {
        require(accounts.length > 0, "ACCOUNTS_LIST_EMPTY");
        for (uint256 index = 0; index < accounts.length; index++) {
            address account = accounts[index];
            if (!isSigner(account)) {
                _addSigner(account);
            }
        }
    }

    function _initialize(address owner) internal {
        _owner = owner;
    }

    /**
        @notice It removes an account as signer.
        @param account address to remove.
        @dev The sender must be the owner.
        @dev It throws a require error if the sender is not the owner.
     */
    function removeSigner(address account) public onlyOwner {
        _removeSigner(account);
    }

    /**
        @notice It is an internal function to add a signer and emit an event.
        @param account to add as signer.
     */
    function _addSigner(address account) internal {
        _signers.add(account);
        _signerCount = _signerCount + 1;
        emit SignerAdded(account);
    }

    /**
        @notice It is an internal function to remove a signer and emit an event.
        @param account to remove as signer.
     */
    function _removeSigner(address account) internal {
        _signers.remove(account);
        _signerCount = _signerCount - 1;
        emit SignerRemoved(account);
    }
}
