pragma solidity 0.5.17;

import "../../base/Initializable.sol";

/**
    This contract is created ONLY for testing purposes.
 */
contract InitializableModifiersMock is Initializable {
    
    /** State Variables */

    /** Constructor */

    function externalIsNotInitialized() isNotInitialized() external {}

    function externalIsInitialized() isInitialized() external {}

    function externalInitialize() external {
        _initialize();
    }

}
