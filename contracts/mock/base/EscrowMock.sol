pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Escrow.sol";

contract EscrowMock is Escrow {
    bool internal __isBorrower;

    function isBorrower() internal returns (bool) {
        return __isBorrower;
    }

    function setBorrower(bool _isBorrower) external {
        __isBorrower = _isBorrower;
    }

    function initialize() external {
        _initialize();
    }

    function setFactory(address _factory) external {
        factory = EscrowFactoryInterface(_factory);
    }
}
