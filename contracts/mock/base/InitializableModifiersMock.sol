pragma solidity 0.5.17;

import "../../base/Initializable.sol";


/**
    This contract is created ONLY for testing purposes.
 */
contract InitializableModifiersMock is Initializable {
    /** State Variables */

    /** Constructor */

    function externalIsNotInitialized() external isNotInitialized() {}

    function externalIsInitialized() external isInitialized() {}

    function externalInitialize() external {
        _initialize();
    }
}
