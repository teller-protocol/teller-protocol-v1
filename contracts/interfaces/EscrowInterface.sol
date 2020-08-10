pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;


interface EscrowInterface {
    function _initialize(address _loans, uint256 _loanID) external;
}
