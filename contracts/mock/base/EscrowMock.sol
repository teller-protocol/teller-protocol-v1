pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Escrow.sol";


contract EscrowMock is Escrow {
    bool internal __isBorrower;

    function _isBorrower() internal view returns (bool) {
        return __isBorrower;
    }

    function setBorrower(bool isBorrower) external {
        __isBorrower = isBorrower;
    }

    function setFactory(address _factory) external {
        factory = EscrowFactoryInterface(_factory);
    }
}
