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

    bool private _isInitialized;

    /** Modifiers */

    /**
        @notice Checks whether the contract is initialized or not.
        @dev It throws a require error if the contract is initialized.
     */
    modifier isNotInitialized() {
        require(!_isInitialized, "CONTRACT_ALREADY_INITIALIZED");
        _;
    }

    /**
        @notice Checks whether the contract is initialized or not.
        @dev It throws a require error if the contract is not initialized.
     */
    modifier isInitialized() {
        require(_isInitialized, "CONTRACT_NOT_INITIALIZED");
        _;
    }

    /* Constructor */

    /** External Functions */

    /**
        @notice Gets if the contract is initialized.
        @return true if contract is initialized. Otherwise it returns false.
     */
    function initialized() external view returns (bool) {
        return _isInitialized;
    }

    /** Internal functions */

    /**
        @notice It initializes this contract.
     */
    function _initialize() internal {
        _isInitialized = true;
    }

    /** Private functions */
}
