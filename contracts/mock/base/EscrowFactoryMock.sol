pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EscrowFactory.sol";
import "../../base/Escrow.sol";

contract EscrowFactoryMock is EscrowFactory {
    function externalComputeEscrowAddress(uint256 loanID)
        external
        view
        returns (address result)
    {
        return super._computeEscrowAddress(loanID);
    }
}
