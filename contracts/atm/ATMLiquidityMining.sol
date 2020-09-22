pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

// Common
import "../util/AddressLib.sol";
import "../base/TInitializable.sol";

// Contracts
import "../base/BaseUpgradeable.sol";

// Interfaces
import "./ATMGovernanceInterface.sol";
import "./ATMGovernance.sol";
import "./TLRTokenInterface.sol";
import "./ATMLiquidityMiningInterface.sol";
import "../interfaces/TTokenInterface.sol";

// Libraries
import "./ATMLibrary.sol";

contract ATMLiquidityMining is 
    ATMLiquidityMiningInterface,
    TInitializable,
    BaseUpgradeable
{
    using SafeMath for uint256;

    /* State Variables */

    ATMGovernanceInterface private governance;

    TLRTokenInterface private tlrToken;

    mapping( address => ATMLibrary.UserStakeInfo ) public userStakesInfo;

    mapping ( address => bool ) public forbiddenAddresses; // Apply to all 

    function initialize(
        address atmGovernanceProxy, 
        address tlrTokenProxy
    ) 
        external
        isNotInitialized()
    {
        governance = ATMGovernanceInterface(atmGovernanceProxy);
        tlrToken = TLRTokenInterface(tlrTokenProxy);
        TInitializable._initialize();
    }

    
    /**
        @notice End users stake their own tTokens on this ATM to earn TLR.
     */
    function stake(address tToken, uint256 amount) 
        external 
        isInitialized() 
    {
        // Checking tToken balance
        require(IERC20(tToken).balanceOf(msg.sender) >= amount, "INSUFFICIENT_TTOKENS_TO_STAKE");
        IERC20(tToken).transfer(address(this), amount); // TODO: Change for safe
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
    function unStake(address tToken, uint256 amount)
        external
        isInitialized() 
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
        IERC20(tToken).transfer(msg.sender, amount);

        // TODO: emit unstake event
    }

    /**
        @notice Users can withdraw their accrued TLR tokens to their own accounts.
     */
    function withdrawTLR(uint256 amount)
        external
        isInitialized() 
    {
        uint256 accruedTLRBalance = userStakesInfo[msg.sender].accruedTLRBalance;
        uint256 minimumTLRToRedeem = governance.getGeneralSetting("MIN_TLR_TO_REDEEM");
        require(accruedTLRBalance >= minimumTLRToRedeem, "NOT_ENOUGH_TLR_TOKENS_TO_REDEEM");
        // Minted tokens are reduced from accrued balance
        userStakesInfo[msg.sender].accruedTLRBalance.sub(amount);
        // mint/assign TLR to user
        // TODO: validate we don't overflow TLR max cap
        tlrToken.mint(msg.sender, amount); // TODO: ATM contract must be minter

        // TODO: emit TLR withdraw event
    }
    function gettTokenTotalBalance(address tToken) external view returns (uint256) {
        return IERC20(tToken).balanceOf(address(this));
    }

    /**
        @notice Returns sender's accrued TLR token amount since last stake operation (stake or unstake)
            until param blockNumber. 
    */
    function _calculateAccruedTLR(uint256 blockNumber)
        internal
        view
        isInitialized() 
        returns (uint256 earned)
    {
        // Getting latest stake movement info
        ATMLibrary.UserStakeInfo memory userStakeInfo = userStakesInfo[msg.sender];
        uint256 tTokenStakedBalance = userStakeInfo.tTokenStakedBalance;  
        uint256 latestRewardedBlock = userStakeInfo.lastRewardedBlock;  
        require(latestRewardedBlock < blockNumber, "BLOCK_TOO_OLD");
        ATMLibrary.TLRReward[] memory rewards = governance.getRewardsTLR();
        
        uint256 newestRewardBlock = blockNumber;
        uint256 interval = 0;
        
        for (uint256 i = 1; 
            latestRewardedBlock <= newestRewardBlock; 
            i++)
        {
            ATMLibrary.TLRReward memory reward = rewards[rewards.length - i];
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