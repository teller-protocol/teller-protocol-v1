pragma solidity 0.5.17;

/**
    @notice This interface defines the available functions and events for the ATM Token

    @author develop@teller.finance
 */

 interface ATMTokenInterface {

     /* Events */

     /**
        @notice Emitted when a new supply cap has been set
        @param newCap The new supply cap 
      */
    event NewCap(
        uint256 newCap
        );

    /**
        @notice Emitted when an address has been granted a vesting schedule
        @param beneficiary The account address being granted the tokens
        @param amount The amount of tokens being granted
        @param deadline The length of time before when the tokens can be claimed
     */
    event NewVesting(
        address beneficiary,
        uint256 amount,
        uint256 deadline
        );

    /**
        @notice Emitted when a vested amount has been claimed
        @param beneficiary The address claiming the vested amount
        @param amount The amount that was claimed
     */
    event VestingClaimed(
        address beneficiary,
        uint256 amount
        );

    /**
        @notice Emitted when an account has had its vesting revoked
        @param beneficiary The account which had its vesting revoked
        @param amount The amount being revoked
        @param deadline The previously set vesting deadline 
     */
    event RevokeVesting(
        address beneficiary,
        uint256 amount,
        uint256 deadline
        );

    /* External Functions */ 
    /**
     * @notice Sets a new cap on the token's total supply.
     * @param newcap The new capped amount of tokens
     */
    function setCap(uint256 newcap) external;

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens for
     * @param amount The amount of tokens to mint
     * @return true if successful
     */
    function mint(address account, uint256 amount) external returns (bool);

    /** @notice Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Includes a vesting period before address is allowed to use tokens
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements
     *
     * - `to` cannot be the zero address.
     *
     * @param account The account which tokens will be assigned to
     * @param amount The amount of tokens to be assigned
     * @param vestingTime The length of the vesting period (in seconds)
     */
    function mintVesting(address account, uint256 amount, uint256 vestingTime) external;

    /**
      * @notice Revokes the amount vested to an account
      * @param account The account for which vesting is to be revoked
      * @return true if successful
      *
     */
     function revokeVesting(address account) external returns (bool);

     /**
     *  @notice Checks if account has a vesting schedule
     *  @param account The account being checked
     *  @return true if successful
     * 
     */
     function isVested(address account) external returns (bool);

    /**
     *  @notice Withdrawl of tokens upon completion of vesting period
     *  @return true if successful
     *
     */
     function withdrawVested() external returns (bool);


 }