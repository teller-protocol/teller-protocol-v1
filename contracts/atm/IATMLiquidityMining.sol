pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

/**
    @notice This interface defines all function to interact with Liquidity Mining program.

    @author develop@teller.finance
 */
interface IATMLiquidityMining {
    /**
        @notice Event emitted every time a user stakes tTokens on this ATM Liquidity Mining program.
        @param sender sender of this transaction.
        @param tToken tToken address that has been staked.
        @param amount amount of tToken that has been staked.
        @param lastRewardedBlock latest reward block included on TLR token struct assignment.
        @param tTokenStakedBalance total amount of tTokens after stake on this Liquidity Mining program.
        @param accruedTLRBalance total amount of accrued TLR tokens assigned to user.   
     */
    event Stake(
        address indexed sender,
        address indexed tToken,
        uint256 amount,
        uint256 lastRewardedBlock,
        uint256 tTokenStakedBalance,
        uint256 accruedTLRBalance
    );

    /**
        @notice Event emitted every time a user unstakes tTokens on this ATM Liquidity Mining program.
        @param sender sender of this transaction.
        @param tToken tToken address that has been unstaked.
        @param amount amount of tToken that has been unstaked.
        @param lastRewardedBlock latest reward block included on TLR token struct assignment.
        @param tTokenStakedBalance total amount of tTokens after unstake on this Liquidity Mining program.
        @param accruedTLRBalance total amount of accrued TLR tokens assigned to user.   
     */
    event UnStake(
        address indexed sender,
        address indexed tToken,
        uint256 amount,
        uint256 lastRewardedBlock,
        uint256 tTokenStakedBalance,
        uint256 accruedTLRBalance
    );

    /**
        @notice Event emitted every time a user withdraws TLR Tokens on this ATM Liquidity Mining program.
        @param sender sender of this transaction.
        @param amount amount of TLR Tokens that have been withdrawn.
        @param lastRewardedBlock latest reward block included on TLR token struct assignment.
        @param tTokenStakedBalance total amount of tTokens staked on this Liquidity Mining program.
        @param accruedTLRBalance total amount of accrued TLR tokens assigned to user.   
     */
    event TLRWithdrawn(
        address indexed sender,
        uint256 amount,
        uint256 lastRewardedBlock,
        uint256 tTokenStakedBalance,
        uint256 accruedTLRBalance
    );

    /**
        @notice Event emitted when a new address was added to the blacklist.
        @param sender address of the transaction sender.
        @param addressAdded address newly added to the blacklist.
     */
    event NotAllowedAddressAdded(address indexed sender, address indexed addressAdded);

    /**
        @notice Event emitted when an address was removed from the blacklist.
        @param sender address of the transaction sender.
        @param addressRemoved address removed from the blacklist.
     */
    event NotAllowedAddressRemoved(
        address indexed sender,
        address indexed addressRemoved
    );

    /**
        @notice Initializes this ATM Liquidity Mining instance using configuration params from other contracts. 
        @param settingsAddress Settings contract address.
        @param atmGovernanceAddress ATM Governance proxy instance associated with this Liquidity Mining instance.
        @param tlrTokenAddress TLR Token instance associated with this ATM Liquidity Mining program.
     */
    function initialize(
        address settingsAddress,
        address atmGovernanceAddress,
        address tlrTokenAddress
    ) external;

    /**
        @notice Withdraws accrued TLR tokens by sending them to msg.sender owned account. This operation updates
         the user stake info for the sender (userStakeInfo[msg.sender]).
        @param amount amount of accrued TLR Tokens to withdraw.
     */
    function withdrawTLR(address tToken, uint256 amount) external;

    /**
        @notice Adds a new address to the blacklisted list. This address will no longer be able to 
        stake on this ATM Liquidity Mining program intance. 
        @param notAllowed address we will blacklist.
    */
    function addNotAllowedAddress(address notAllowed) external;

    /**
        @notice Removes an address from the blacklisted list. This address will now start
        being able to stake on this ATM Liquidity Mining program intance. 
        @param notAllowed address we will blacklist.
    */
    function removeNotAllowedAddress(address notAllowed) external;

    /**
        @notice Returns TLR floating accrued balance since last Stake(), UnStake(), Withdraw() operation
            until current block. Floating indicates this balance is part of users TLR balance but is not yet 
            assigned on userStakeInfo[msg.sender].accruedTLRBalance until any of the following operations
            takes place (Stake(), UnStake(), Withdraw()). 
     */
    function getTLRFloatingBalance(address tToken) external view returns (uint256);

    /**
        @notice Returns TLR total balance ( assigned + floating ) until current block.
     */
    function getTLRTotalBalance(address tToken) external view returns (uint256);
}
