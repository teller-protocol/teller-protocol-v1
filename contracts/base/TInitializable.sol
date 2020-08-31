pragma solidity 0.5.17;


// Libraries

// Commons

// Interfaces

/**
    @notice This contract is used to initialize the contract variables using a function (initialize) instead of constructor.
    @notice It makes the creation process easier avoiding circular dependencies.

    @author develop@teller.finance
 */
contract TInitializable {
    /* State Variables */

    bytes32 internal constant IS_INITIALIZED_SLOT = keccak256("TInitializable.isInitialized");

    /** Modifiers */

    /**
        @notice Checks whether the contract is initialized or not.
        @dev It throws a require error if the contract is initialized.
     */
    modifier isNotInitialized() {
        require(!initialized(), "CONTRACT_ALREADY_INITIALIZED");
        _;
    }

    /**
        @notice Checks whether the contract is initialized or not.
        @dev It throws a require error if the contract is not initialized.
     */
    modifier isInitialized() {
        require(initialized(), "CONTRACT_NOT_INITIALIZED");
        _;
    }

    /* Constructor */

    /** Public Functions */

    /**
        @notice Gets if the contract is initialized.
        @return true if contract is initialized. Otherwise it returns false.
     */
    function initialized() public view returns (bool value) {
        bytes32 slot = IS_INITIALIZED_SLOT;
        assembly {
            value := sload(slot)
        }
    }

    /** Internal functions */

    /**
        @notice It initializes this contract.
     */
    function _initialize() internal {
        bytes32 slot = IS_INITIALIZED_SLOT;
        bool value = true;
        assembly {
            sstore(slot, value)
        }
    }

    /** Private functions */
}
