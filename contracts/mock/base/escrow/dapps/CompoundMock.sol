pragma solidity 0.5.17;

import "../../../../base/escrow/dapps/Compound.sol";
import "./DappMock.sol";

/**
    @notice This mock is used to expose a payable fallback function on tests.f
 */
contract CompoundMock is DappMock, Compound {
    constructor() public {
        Ownable.initialize(msg.sender);
    }
}
