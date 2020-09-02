pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EscrowFactory.sol";

contract EscrowFactoryMock is EscrowFactory {
    function externalCreateEscrow(address loansAddress, uint256 loanID) external {
        _createEscrow(loansAddress, loanID);
    }
}
