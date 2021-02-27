pragma solidity 0.5.17;

// Contracts

/**
    @notice This contract is used to initialize the contract variables using a function (initialize) instead of constructor.
    @notice It makes the creation process easier avoiding circular dependencies.

    @author develop@teller.finance
 */
contract TInitializable {
    /* State Variables */

    bool private _initialized;

    /** Modifiers */

    /**
        @notice Checks whether the contract is initialized or not.
        @dev It throws a require error if the contract is initialized.
     */
    modifier isNotInitialized() {
        require(!_initialized, "CONTRACT_ALREADY_INITIALIZED");
        _;
    }

    /**
        @notice Checks whether the contract is initialized or not.
        @dev It throws a require error if the contract is not initialized.
     */
    modifier isInitialized() {
        require(_initialized, "CONTRACT_NOT_INITIALIZED");
        _;
    }

    /* Constructor */

    /** Public Functions */

    /**
        @notice Gets if the contract is initialized.
        @return true if contract is initialized. Otherwise it returns false.
     */
    function initialized() public view returns (bool) {
        return _initialized;
    }

    /** Internal functions */

    /**
        @notice It initializes this contract.
     */
    function _initialize() internal isNotInitialized {
        _initialized = true;
    }

    /** Private functions */
}
