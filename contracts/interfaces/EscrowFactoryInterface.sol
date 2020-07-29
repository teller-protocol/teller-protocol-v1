pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "./LoansInterface.sol";


interface EscrowFactoryInterface {
    function createEscrow(uint256 loanID) external returns (address);

    function computeEscrowAddress(uint256 loanID) external returns (address result);

    event EscrowCreated(address escrowAddress);
}
