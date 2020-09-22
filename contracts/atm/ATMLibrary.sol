pragma solidity 0.5.17;

library ATMLibrary {
     struct TLRReward {
        uint256 startBlockNumber;
        uint256 tlrPerBlockPertToken;
    }

    struct UserStakeInfo {
        uint256 lastRewardedBlock;
        uint256 tTokenStakedBalance;
        uint256 accruedTLRBalance; // Accumulated tlrTokens not assigned to user yet.
    }

}