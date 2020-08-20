pragma solidity 0.5.17;

interface EscrowInterface {
    function initialize(address loansAddress, uint256 loanID) external;
}
