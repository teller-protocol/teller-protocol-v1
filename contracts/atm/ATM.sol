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

    bool constant public STAKE = true;
    bool constant public UNSTAKE = false;
    
    /* State Variables */

    ATMGovernanceInterface private governance;
    ATMTokenInterface private tlrToken;
    ATMLiquidityMiningInterface private liquidityMining;
    TTokenInterface public tToken;


    mapping( address => ATMLibrary.StakeMovement[] ) public stakeMovements;
    mapping( address => ATMLibrary.UserStakeInfo ) public userStakesInfo;

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
        @notice End users will stake their own tTokens on this ATM to earn TLR.
     */
    function stake(uint256 amount) 
        external 
    {
        // Checking tToken balance
        require(tToken.balanceOf(msg.sender) >= amount, "INSUFFICIENT_BALANCE_TO_STAKE");
        tToken.transfer(address(this), amount); // TODO: Change for safe
        // Calculate previously earned TLR tokens since last stake movement.
        uint256 currentBlock = block.number;
        // uint256 previoustTokenBalance = _getPrevioustTokenBalance();
        // uint256 previousTLRBalance = _getPreviousTLRBalance();
        uint256 previoustTokenBalance = _getPrevioustTokenBalance();
        uint256 previousTLRBalance = _getPreviousTLRBalance();
        uint256 accruedTLR = _calculateAccruedTLR(currentBlock);

        ATMLibrary.StakeMovement memory currentDeposit = ATMLibrary.StakeMovement ({
                blockNumber: currentBlock,
                amount: amount,
                positiveAmount: STAKE,
                accruedTLRSinceLastMovement: accruedTLR, // Earned from last movement
                tTokenBalance: previoustTokenBalance.add(amount), // Staking
                tlrBalance: previousTLRBalance.add(accruedTLR)
            });

        stakeMovements[msg.sender].push(currentDeposit);

        // TODO: emit staking event
    }

    /**
        @notice Unstake tTokens.
    */
    function unStake(uint256 amount)
        external
    {
        //ATMLibrary.StakeMovement[] memory stakes = stakeMovements[msg.sender];
        //uint256 tTokenBalance = stakes[stakes.length - 1].tTokenBalance;
        uint256 tTokenBalance = userStakesInfo[msg.sender].tTokenBalance;
        require(tTokenBalance >= amount, "NOT_ENOUGH_AMOUNT_OF_TTOKENS");

        // Calculate previously earned TLR tokens since last stake movement.
        uint256 currentBlock = block.number;
        //uint256 previoustTokenBalance = _getPrevioustTokenBalance();
        //uint256 currentTLRBalance = _getPreviousTLRBalance();
        uint256 tlrBalance = userStakesInfo[msg.sender].tlrBalance;
        uint256 accruedTLR = _calculateAccruedTLR(currentBlock);
        
        /*ATMLibrary.StakeMovement memory currentDeposit = ATMLibrary.StakeMovement ({
                blockNumber: currentBlock,
                amount: amount,
                positiveAmount: UNSTAKE,
                tTokenBalance: previoustTokenBalance.sub(amount), // Staking
                tlrBalance: currentTLRBalance.add(accruedTLR),
                accruedTLRSinceLastMovement: accruedTLR // Earned from last movement
            });*/
        ATMLibrary.UserStakeInfo memory userInfo = ATMLibrary.UserStakeInfo ( {
                lastRewardedBlock: currentBlock,
                tTokenBalance: tTokenBalance.sub(amount), // Staking
                tlrBalance: tlrBalance.add(accruedTLR)
            });
        //stakeMovements[msg.sender].push(currentDeposit);    
        userStakesInfo[msg.sender] = userInfo;
        tToken.transfer(msg.sender, amount);

    }

    function withdrawTLR(uint256 amount)
        external
    {
        uint256 tlrBalance = stakeMovements[msg.sender][stakeMovements[msg.sender].length - 1].tlrBalance;
        require(tlrBalance >= governance.getMinimumRedeem(), "NOT_ENOUGH_TLR_TOKENS_TO_REDEEM");
        
        ATMLibrary.StakeMovement memory currentDeposit = ATMLibrary.StakeMovement ({
                blockNumber: block.number,
                amount: amount,
                positiveAmount: UNSTAKE,
                tTokenBalance: previoustTokenBalance.sub(amount), // Staking
                tlrBalance: currentTLRBalance.add(accruedTLR),
                accruedTLRSinceLastMovement: accruedTLR // Earned from last movement
            });
        stakeMovements[msg.sender].push(currentDeposit);    
        
        // mint/assign TLR to user
        tlrToken.mint(msg.sender, amount); // TODO: ATM contract must be minter

    }

    function _calculateAccruedTLR(uint256 blockNumber)
        internal
        view
        returns (uint256 earned)
    {
        ATMLibrary.StakeMovement[] memory stakes = stakeMovements[msg.sender];
        if (stakes.length > 0) {
            // Getting latest stake movement info
            ATMLibrary.StakeMovement memory lastMovement = stakes[stakes.length - 1];
            uint256 tTokenBalance = lastMovement.tTokenBalance;  
            uint256 latestRewardBlock = lastMovement.blockNumber;  
            
            ATMLibrary.Reward[] memory rewards = governance.rewards();
            
            uint256 latestBlock = blockNumber;
            for (uint256 i = 1; 
                latestRewardBlock <= rewards[rewards.length - i].startBlockNumber; 
                i++)
            {
                ATMLibrary.Reward memory reward = rewards[rewards.length - i];
                uint256 accruedTLR = reward.tlrPerBlockPertToken
                    .mul(latestBlock.sub(reward.startBlockNumber))
                    .mul(tTokenBalance);
                earned.add(accruedTLR);
                latestBlock = reward.startBlockNumber;
            }
        }
        return earned;
    }

    function _getPreviousTLRBalance()
        internal
        view
        returns (uint256 tlrBalance)
    {
        ATMLibrary.StakeMovement[] memory stakes = stakeMovements[msg.sender];
        if (stakes.length > 0 ) {
            tlrBalance = stakes[stakes.length - 1].tlrBalance;
        }
        return tlrBalance;
    }
    function _getPrevioustTokenBalance()
        internal
        view
        returns (uint256 tTokenBalance)
    {
        ATMLibrary.StakeMovement[] memory stakes = stakeMovements[msg.sender];
        if (stakes.length > 0 ) {
            tTokenBalance = stakes[stakes.length - 1].tTokenBalance;
        }
        return tTokenBalance;
    }
}