pragma solidity 0.5.17;

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This interface defines the available functions and events for the TLR Token

    @author develop@teller.finance
 */
interface ITLRToken {
    /* Events */

    /**
        @notice Emitted when a new supply cap has been set
        @param newCap The new supply cap 
      */
    event NewCap(uint256 newCap);

    /**
        @notice Emitted when an address has been granted a vesting schedule
        @param beneficiary The account address being granted the tokens
        @param amount The amount of tokens being granted
        @param deadline The length of time before when the tokens can be claimed
     */
    event NewVesting(address beneficiary, uint256 amount, uint256 deadline);

    /**
        @notice Emitted when a vested amount has been claimed
        @param beneficiary The address claiming the vested amount
        @param amount The amount that was claimed
     */
    event VestingClaimed(address beneficiary, uint256 amount);

    /**
        @notice Emitted when an account has had its vesting revoked
        @param account The account which had its vesting revoked
        @param unvestedTokens The amount of tokens being revoked
        @param deadline The previously set vesting deadline 
     */
    event RevokeVesting(address account, uint256 unvestedTokens, uint256 deadline);

    /**
    @notice Emitted when a snapshot is created
    @param id The id of the created snapshot
    */
    event Snapshot(uint256 id);

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
     * @param cliff The length of time (in seconds) after which the tokens will start vesting
     * @param vestingTime The length of the vesting period (in seconds)
     */
    function mintVesting(
        address account,
        uint256 amount,
        uint256 cliff,
        uint256 vestingTime
    ) external;

    /**
     * @notice Revokes the amount vested to an account
     * @param account The account for which vesting is to be revoked
     * @param vestingId The Id of the vesting being revoked
     *
     */
    function revokeVesting(address account, uint256 vestingId) external;

    /**
     *  @notice Withdrawl of tokens upon completion of vesting period
     *
     */
    function withdrawVested() external;

    /**
        @notice Returns the balance of an account at the time a snapshot was created
        @param account The account which is being queried
        @param snapshotId The id of the snapshot being queried
     */
    function balanceOfAt(address account, uint256 snapshotId)
        external
        view
        returns (uint256);

    /**
        @notice Returns the total supply at the time a snapshot was created
        @param snapshotId The id of the snapshot being queried
     */
    function totalSupplyAt(uint256 snapshotId) external view returns (uint256);

    /**
        @notice It initializes this token instance.
        @param name The name of the token
        @param symbol The symbol of the token
        @param decimals The amount of decimals for token
        @param cap The maximum number of tokens available
        @param maxVestingPerWallet The maximum number of times a wallet can mint their vesting
        @param settingsAddress The ATMSettings address
        @param atm The ATMGovernance address for this token
     */
    function initialize(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingPerWallet,
        address settingsAddress,
        address atm
    ) external;
}
