pragma solidity 0.5.17;

import "../../base/TInitializable.sol";


/**
    This contract is created ONLY for testing purposes.
 */
contract TInitializableModifiersMock is TInitializable {
    /** State Variables */

    /** Constructor */

    function externalIsNotInitialized() external isNotInitialized() {}

    function externalIsInitialized() external isInitialized() {}

    function externalInitialize() external {
        _initialize();
    }
}
