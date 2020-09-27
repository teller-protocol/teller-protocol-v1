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
    
    event TLRWithdrawn(
        address indexed sender,
        uint256 amount,
        uint256 lastRewardedBlock,
        uint256 tTokenStakedBalance,
        uint256 accruedTLRBalance
    );

    function initialize(address settingsAddress, address atmGovernanceProxy, address atmTLRTokenProxy) external;

    function getTLRBalance() external 
        //view 
        returns (uint256);
    
    function withdrawTLR(uint256) external;

}