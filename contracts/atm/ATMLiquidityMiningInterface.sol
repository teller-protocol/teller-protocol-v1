pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

interface ATMLiquidityMiningInterface {

    event Stake(
        address indexed sender,
        address indexed tToken,
        uint256 amount,
        uint256 lastRewardedBlock,
        uint256 tTokenStakedBalance,
        uint256 accruedTLRBalance
    );

    event UnStake(
        address indexed sender,
        address indexed tToken,
        uint256 amount,
        uint256 lastRewardedBlock,
        uint256 tTokenStakedBalance,
        uint256 accruedTLRBalance
    );

    function initialize(address settingsAddress, address atmGovernanceProxy, address atmTLRTokenProxy) external;

}