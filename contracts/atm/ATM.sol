pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

// Common
import "../util/AddressLib.sol";
//import "../base/TInitializable.sol";

// Contracts
import "./BaseATM.sol";

// Interfaces
import "./ATMGovernanceInterface.sol";
import "./ATMInterface.sol";
import "./ATMTokenInterface.sol";
import "./ATMLiquidityMiningInterface.sol";
import "../interfaces/TTokenInterface.sol";

// Libraries
import "./ATMLibrary.sol";

contract ATM is ATMInterface, BaseATM {
    using SafeMath for uint256;

    /* State Variables */

    ATMGovernanceInterface private governance;
    ATMTokenInterface private tlrToken;
    ATMLiquidityMiningInterface private liquidityMining;
    TTokenInterface public tToken;


    mapping( address => ATMLibrary.UserStakeInfo ) public userStakesInfo;

    mapping ( address => bool ) public forbiddenAddresses; // Apply to all 

    constructor(
        address atmGovernanceProxy, 
        address atmTokenProxy, 
        address atmLiquidityMining,
        address tTokenAddress
    ) 
        public
    {
        governance = ATMGovernanceInterface(atmGovernanceProxy);
        tlrToken = ATMTokenInterface(atmTokenProxy);
        liquidityMining = ATMLiquidityMiningInterface(atmLiquidityMining);
        tToken = TTokenInterface(tTokenAddress);
    }

    
    /**
        @notice End users stake their own tTokens on this ATM to earn TLR.
     */
    function stake(uint256 amount) 
        external 
    {
        // Checking tToken balance
        require(tToken.balanceOf(msg.sender) >= amount, "INSUFFICIENT_TTOKENS_TO_STAKE");
        tToken.transfer(address(this), amount); // TODO: Change for safe
        // Calculate previously earned TLR tokens since last stake/unstake movement.
        uint256 currentBlock = block.number;
        uint256 tTokenStakedBalance = userStakesInfo[msg.sender].tTokenStakedBalance;
        uint256 accruedTLRBalance = userStakesInfo[msg.sender].accruedTLRBalance;
        uint256 accruedTLR = _calculateAccruedTLR(currentBlock);
        
        ATMLibrary.UserStakeInfo memory userInfo = ATMLibrary.UserStakeInfo ( {
                lastRewardedBlock: currentBlock,
                tTokenStakedBalance: tTokenStakedBalance.add(amount), // Staking
                accruedTLRBalance: accruedTLRBalance.add(accruedTLR)
            });
        userStakesInfo[msg.sender] = userInfo;

        // TODO: emit stake event
    }

    /**
        @notice Unstake tTokens from this ATM, no more TLR tokens will be accrued from those tTokens.
    */
    function unStake(uint256 amount)
        external
    {
        uint256 tTokenStakedBalance = userStakesInfo[msg.sender].tTokenStakedBalance;
        require(tTokenStakedBalance >= amount, "NOT_ENOUGH_STAKED_TTOKENS");

        // Calculate previously earned TLR tokens since last stake/unstake movement.
        uint256 currentBlock = block.number;
        uint256 accruedTLRBalance = userStakesInfo[msg.sender].accruedTLRBalance;
        uint256 accruedTLR = _calculateAccruedTLR(currentBlock);
        
        ATMLibrary.UserStakeInfo memory userInfo = ATMLibrary.UserStakeInfo ( {
                lastRewardedBlock: currentBlock,
                tTokenStakedBalance: tTokenStakedBalance.sub(amount), // UnStaking
                accruedTLRBalance: accruedTLRBalance.add(accruedTLR) // Accrued TLR are added
            });
        userStakesInfo[msg.sender] = userInfo;
        tToken.transfer(msg.sender, amount);

        // TODO: emit unstake event
    }

    /**
        @notice Users can withdraw their accrued TLR tokens to their own accounts.
     */
    function withdrawTLR(uint256 amount)
        external
    {
        uint256 accruedTLRBalance = userStakesInfo[msg.sender].accruedTLRBalance;
        require(accruedTLRBalance >= governance.getMinimumRedeem(), "NOT_ENOUGH_TLR_TOKENS_TO_REDEEM");
        // Minted tokens are reduced from accrued balance
        userStakesInfo[msg.sender].accruedTLRBalance.sub(amount);
        // mint/assign TLR to user
        // TODO: validate we don't overflow TLR max cap
        tlrToken.mint(msg.sender, amount); // TODO: ATM contract must be minter

        // TODO: emit TLR withdraw event
    }

    /**
        @notice Returns sender's accrued TLR token amount since last stake operation (stake or unstake)
            until param blockNumber. 
    */
    function _calculateAccruedTLR(uint256 blockNumber)
        internal
        view
        returns (uint256 earned)
    {
        // Getting latest stake movement info
        ATMLibrary.UserStakeInfo memory userStakeInfo = userStakesInfo[msg.sender];
        uint256 tTokenStakedBalance = userStakeInfo.tTokenStakedBalance;  
        uint256 latestRewardedBlock = userStakeInfo.lastRewardedBlock;  
        require(latestRewardedBlock < blockNumber, "BLOCK_TOO_OLD");
        ATMLibrary.Reward[] memory rewards = governance.rewards();
        
        uint256 newestRewardBlock = blockNumber;
        uint256 interval = 0;
        
        for (uint256 i = 1; 
            latestRewardedBlock <= newestRewardBlock; 
            i++)
        {
            ATMLibrary.Reward memory reward = rewards[rewards.length - i];
            if (reward.startBlockNumber < latestRewardedBlock ) {
                interval = newestRewardBlock.sub(latestRewardedBlock);
            } else {
                interval = newestRewardBlock.sub(reward.startBlockNumber);
            }
            uint256 accruedTLR = reward.tlrPerBlockPertToken
                .mul(interval)
                .mul(tTokenStakedBalance);
            earned.add(accruedTLR);
            newestRewardBlock = reward.startBlockNumber;

        }
        return earned;
    }

   
}