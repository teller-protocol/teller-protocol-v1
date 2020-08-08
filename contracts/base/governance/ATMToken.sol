pragma solidity ^0.5.17;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/lifecycle/Pausable.sol";

/**
  *  @title ATM Token for Teller DAO
  *
  *  @author develop@teller.finance
 */

contract ATMToken is ERC20Detailed, Pausable, ERC20Mintable {
    /**
      *  @dev ATMTestToken implements an ERC20 token with a supply cap and a vesting scheduling
     */

    // State Variables
    uint256 private _cap;

    // Struct
    struct VestingTokens {
        address beneficiary;
        uint256 amount;
        uint256 deadline;
    }

    // Mappings
    mapping (address => VestingTokens) private _vestingBalances;

    // Events
    event NewCap(uint256 newcap);
    event NewVesting(address beneficiary, uint256 amount, uint256 deadline);
    event VestingClaimed(address beneficiary, uint256 amount);
    event RevokeVesting(address beneficiary, uint256 amount, uint256 deadline);

    // Constructor
    constructor (
        uint256 cap
    ) public
      ERC20Detailed("ATMToken", "ATM", 18)
    {
        _cap = cap;
    }

    // Functions
    /**
     * @dev Returns the cap on the token's total supply
     * @return The supply capped amount
     */
    function cap() public view returns (uint256) {
        return _cap;
    }

    /**
     * @dev Sets a new cap on the token's total supply.
     * @param newcap The new capped amount of tokens
     */
    function setCap(uint256 newcap) external onlyPauser() whenNotPaused() {
        _cap = newcap;
        emit NewCap(_cap);
    }

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens for
     * @param amount The amount of tokens to mint
     * @return true if successful
     */
    function mint(address account, uint256 amount) public onlyPauser() whenNotPaused() returns (bool) {
        require(account != address(0), "ERC20: mint to the zero address");
        _beforeTokenTransfer(address(0), account, amount);
        _mint(account, amount);
        return true;
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
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
    function mintVesting(address account, uint256 amount, uint256 vestingTime) public onlyPauser() whenNotPaused() {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);
        // Should the totalsupply be updated here to avoid cap errors on successful vesting?
        VestingTokens memory vestingTokens = VestingTokens(account, amount, block.timestamp+vestingTime);
        _vestingBalances[account] = vestingTokens;
        emit NewVesting(account, amount, vestingTime);
    }

    /**
      * @notice Revokes the amount vested to an account
      * @param account The account for which vesting is to be revoked
      * @return true if successful
      *
     */
     function revokeVesting(address account) public onlyPauser() whenNotPaused() returns (bool){
         require(_vestingBalances[account].amount > 0, "Account does not have a vesting balance!");
         VestingTokens memory vestingTokens = _vestingBalances[account];
         uint256 revokedAmount = vestingTokens.amount;
         uint256 revokedDeadline = vestingTokens.deadline;
         delete _vestingBalances[account];
         emit RevokeVesting(account, revokedAmount, revokedDeadline);
         return true;
     }

    /**
     *  @notice Checks if account has a vesting schedule
     *  @param account The account being checked
     *  @return true if successful
     * 
     */
     function isVested(address account) public returns (bool) {
         require(_vestingBalances[account].amount > 0, "Account does not have a vesting balance!");
         return true;
     }

    /**
     *  @notice Withdrawl of tokens upon completion of vesting period
     *  @return true if successful
     *
     */
     function withdrawVested() public returns (bool) {
        VestingTokens storage vestingTokens = _vestingBalances[msg.sender];
        require(vestingTokens.amount > 0, "Account does not have a vesting balance!");
        _beforeTokenTransfer(address(0), vestingTokens.beneficiary, vestingTokens.amount);
        require(vestingTokens.deadline <= block.timestamp, "Vesting deadline has not passed");
        uint256 claimedAmount = vestingTokens.amount;
        _mint(vestingTokens.beneficiary, claimedAmount);
        vestingTokens.amount = 0;
        _vestingBalances[msg.sender] = vestingTokens;
        emit VestingClaimed(vestingTokens.beneficiary, claimedAmount);
        return true;
     }

    /**
     * @dev See {ERC20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - minted tokens must not cause the total supply to go over the cap.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
        if (from == address(0)) { // When minting tokens
            require(totalSupply().add(amount) <= _cap, "ERC20Capped: cap exceeded");
        }
    }
}
