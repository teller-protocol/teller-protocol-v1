pragma solidity ^0.5.17;

/**
    @notice This interface defines the different functions available for a CRV voting contract
    @author develop@teller.finance
 */

interface ICurveVoting {
    /**
        @notice Deposits a given amount of tokens and locks the deposit until the unlock_time
        @param amount Amount to deposit
        @param unlockTime Timestamp when tokens unlock, rounded down to whole weeks
     */
    function create_lock(uint256 amount, uint256 unlockTime) external;

    /**
        @notice Deposits an additional amount tokens without modifying the unlock time
        @param amount Amount of tokens to deposit and add to the lock
     */
    function increase_amount(uint256 amount) external;

    /**
        @notice Extends the unlock time to a new unlock time
        @param newUnlockTime New epoch time for unlocking
     */
    function increase_unlock_time(uint256 newUnlockTime) external;

    /**
        @notice Withdraws all tokens for the sender from the contract
        @notice Withdrawl is only possible once the lock has expired
     */
    function withdraw() external;

    /**
        @notice Get the current voting power for the sender
        @param voterAddress User wallet address
        @return uint256 The voter's voting power
     */
    function balanceOf(address voterAddress) external view returns (uint256);

    /**
        @notice Get timestamp when the voter's address lock ends
        @param voterAddress User wallet
        @return uint256 Timestamp of the when the lock ends
     */
    function locked__end(address voterAddress) external view returns (uint256);
}
