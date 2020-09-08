pragma solidity 0.5.17;

interface ATMLiquidityMiningInterface {

    event ATMTokensAssigned(
        address indexed sender,
        uint256 blockNumber,
        address indexed atmGovernance,
        address indexed atmToken,
        uint256 amount,
        uint256 newBalance
    );


}