pragma solidity 0.5.17;

/**
 * @dev Library of structs common across the Teller protocol
 *
 * @author develop@teller.finance
 */
library ATMCommon {
    /**
        @notice TLR Reward data struct saved every time a new TLR Reward is added.
     */
    struct TLRReward {
        uint256 startBlockNumber;
        uint256 tlrPerBlockPertToken;
    }

    /**
        @notice User tToken staking balance information since last operation (Stake(), Unstake(), Withdraw()).
     */
    struct UserStakeInfo {
        uint256 lastRewardedBlock;
        uint256 tTokenStakedBalance;
        uint256 accruedTLRBalance; // Accumulated tlrTokens not assigned to user yet.
    }
}
