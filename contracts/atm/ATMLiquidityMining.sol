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
import "../base/TToken.sol";

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

    /* Constants */
    uint8 public constant NO_TTOKENS_STAKED = 0;
    uint8 public constant NO_TLR_ACCRUED = 0;

    /* State Variables */

    ATMGovernanceInterface private governance;

    TLRTokenInterface private tlrToken;

    mapping( address => ATMLibrary.UserStakeInfo ) public userStakeInfo;

    mapping ( address => bool ) public notAllowedAddresses;


    modifier onlyAllowed() {
        require(!notAllowedAddresses[msg.sender], "SENDER_NOT_ALLOWED");
        _;
    }
    /**
        @notice Checks if the platform is paused or not
        @dev Throws an error is the Teller platform is paused
     */
    modifier whenNotPaused() {
        require(!settings().atmSettings().isATMPaused(address(governance)), "ATM_IS_PAUSED");
        _;
    }

    function initialize(
        address settingsAddress,
        address atmGovernanceProxy, 
        address tlrTokenProxy
    ) 
        external
        isNotInitialized()
    {
        _setSettings(settingsAddress);
        governance = ATMGovernanceInterface(atmGovernanceProxy);
        tlrToken = TLRTokenInterface(tlrTokenProxy);
        TInitializable._initialize();
    }

    function addNotAllowedAddress(address notAllowed)
        external
        onlyPauser()
        isInitialized()
    {
        notAllowedAddresses[notAllowed] = true;
        // TODO: Emit event
    }
   
    function removeNotAllowedAddress(address notAllowed)
        external
        onlyPauser()
        isInitialized()
    {
        notAllowedAddresses[notAllowed] = false;
        // TODO: Emit event
    }
    
    /**
        @notice End users stake their own tTokens on this ATM to earn TLR.
     */
    function stake(address tToken, uint256 amount) 
        external 
        onlyAllowed()
        isInitialized() 
        whenNotPaused()
    {
        // TODO: Check tToken is a Teller whitelisted token on settings().
        //require(settings().tTokensRegistry().istTokenValid(tToken), "TTOKEN_IS_NOT_REGISTERED");
        // Checking tToken balance
        require(TToken(tToken).balanceOf(msg.sender) >= amount, "INSUFFICIENT_TTOKENS_TO_STAKE");
        // Transferring tTokens for staking
        require(TToken(tToken).transferFrom(msg.sender, address(this), amount), "STAKE_TTOKEN_TRANSFER_FAILED");
        // Calculate previously earned TLR tokens since last stake/unstake movement.
        uint256 currentBlock = block.number;
        uint256 tTokenStakedBalance = userStakeInfo[msg.sender].tTokenStakedBalance;
        uint256 accruedTLRBalance = userStakeInfo[msg.sender].accruedTLRBalance;
        uint256 accruedTLR = _calculateAccruedTLR(currentBlock);
        
        // Update use stake info
        ATMLibrary.UserStakeInfo memory userInfo = ATMLibrary.UserStakeInfo ( {
                lastRewardedBlock: currentBlock,
                tTokenStakedBalance: tTokenStakedBalance.add(amount), // Staking
                accruedTLRBalance: accruedTLRBalance.add(accruedTLR)
            });
        userStakeInfo[msg.sender] = userInfo;

        emit Stake(
            msg.sender,
            tToken,
            amount,
            userInfo.lastRewardedBlock,
            userInfo.tTokenStakedBalance,
            userInfo.accruedTLRBalance
        );
    }

    /**
        @notice Unstake tTokens from this ATM, no more TLR tokens will be accrued from those tTokens.
    */
    function unStake(address tToken, uint256 amount)
        external
        isInitialized() 
        whenNotPaused()
    {
        // TODO: Check tToken is a Teller whitelisted token on settings().
        //require(settings().tTokensRegistry().istTokenValid(tToken), "TTOKEN_IS_NOT_REGISTERED");
        uint256 tTokenStakedBalance = userStakeInfo[msg.sender].tTokenStakedBalance;
        require(tTokenStakedBalance >= amount, "NOT_ENOUGH_STAKED_TTOKENS");

        // Calculate previously earned TLR tokens since last stake/unstake movement.
        uint256 currentBlock = block.number;
        uint256 accruedTLRBalance = userStakeInfo[msg.sender].accruedTLRBalance;
        uint256 accruedTLR = _calculateAccruedTLR(currentBlock);
        
        // Update user stake info
        ATMLibrary.UserStakeInfo memory userInfo = ATMLibrary.UserStakeInfo ( {
                lastRewardedBlock: currentBlock,
                tTokenStakedBalance: tTokenStakedBalance.sub(amount), // UnStaking
                accruedTLRBalance: accruedTLRBalance.add(accruedTLR) // Accrued TLR are added
            });
        userStakeInfo[msg.sender] = userInfo;
        // Send tTokens back to user
        require(IERC20(tToken).transfer(msg.sender, amount), "UNSTAKE_TTOKEN_TRANSFER_FAILED");

        emit UnStake(
            msg.sender,
            tToken,
            amount,
            userInfo.lastRewardedBlock,
            userInfo.tTokenStakedBalance,
            userInfo.accruedTLRBalance
        );
    }

    /**
        @notice Users can withdraw their accrued TLR tokens to their own accounts.
     */
    function withdrawTLR(uint256 amount)
        external
        isInitialized() 
        whenNotPaused()
    {
        uint256 accruedTLRBalance = _getTLRTotalBalance();
        uint256 minimumTLRToRedeem = governance.getGeneralSetting("MIN_TLR_TO_REDEEM");
        require(accruedTLRBalance >= minimumTLRToRedeem, "NOT_ENOUGH_TLR_TOKENS_TO_REDEEM");
        require(accruedTLRBalance >= amount, "UNSUFFICIENT_TLR_TO_WITHDRAW");
        // Minted tokens are reduced from accrued balance
        userStakeInfo[msg.sender].accruedTLRBalance = accruedTLRBalance.sub(amount);
        userStakeInfo[msg.sender].lastRewardedBlock = block.number;
        // TODO: validate we don't overflow TLR max cap
        require(tlrToken.mint(msg.sender, amount), "WITHDRAW_FAILED_MINTING_TLR"); 
        
        emit TLRWithdrawn(
            msg.sender,
            amount,
            userStakeInfo[msg.sender].lastRewardedBlock,
            userStakeInfo[msg.sender].tTokenStakedBalance,
            userStakeInfo[msg.sender].accruedTLRBalance
        );
    }
    
    function gettTokenTotalBalance(address tToken) external view returns (uint256) {
        return IERC20(tToken).balanceOf(address(this));
    }

    /**
        @notice Returns TLR floating accrued balance since last Stake(), UnStake(), Withdraw() operation
            until current block.
     */
    function getTLRFloatingBalance() 
        external 
        view 
        returns (uint256)
    {
        return _calculateAccruedTLR(block.number);
    }
    
    /**
        @notice Returns TLR total balance ( accrued + floating ) until current block.
     */
    function getTLRTotalBalance() 
        external 
        view
        returns (uint256)
    {
        return _getTLRTotalBalance();
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
        uint256 tTokenStakedBalance = userStakeInfo[msg.sender].tTokenStakedBalance;
        // If nothing was staked return zero
        if (NO_TTOKENS_STAKED == tTokenStakedBalance ) {
            return NO_TLR_ACCRUED;
        }  
        uint256 latestRewardedBlock = userStakeInfo[msg.sender].lastRewardedBlock;  
        if (latestRewardedBlock >= blockNumber) {
            return NO_TLR_ACCRUED;
        }
        ATMLibrary.TLRReward[] memory rewards = governance.getTLRRewards();
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
            earned= earned.add(accruedTLR);
            newestRewardBlock = reward.startBlockNumber;
        }
        return earned;
    }

    function _getTLRTotalBalance()
        internal
        view
        returns (uint256)
    {
        return userStakeInfo[msg.sender].accruedTLRBalance.add(_calculateAccruedTLR(block.number));
    }
}