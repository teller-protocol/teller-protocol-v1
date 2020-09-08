pragma solidity 0.5.17;

library ATMLibrary {
     struct Reward {
        uint256 startBlockNumber;
        uint256 tlrPerBlockPertToken;
    }

    struct StakeMovement {
        uint256 blockNumber;
        uint256 amount;
        bool positiveAmount;
        uint256 accruedTLRSinceLastMovement;
        uint256 tTokenBalance;
        uint256 tlrBalance;
    }

    struct UserStakeInfo {
        uint256 lastRewardedBlock;
        uint256 tTokenStakedBalance;
        uint256 tlrBalance;
    }

}