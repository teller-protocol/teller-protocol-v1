pragma solidity ^0.5.17;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/lifecycle/Pausable.sol";
import "./ATMTokenInterface.sol";

/**
  *  @title ATM Token for Teller DAO
  *
  *  @author develop@teller.finance
 */

contract ATMToken is ATMTokenInterface, ERC20Detailed, Pausable, ERC20Mintable {
    /**
      *  @notice ATMToken implements an ERC20 token with a supply cap and a vesting scheduling
     */

    /* State Variables */
    uint256 private _cap;

    /* Structs */
    struct VestingTokens {
        address beneficiary;
        uint256 amount;
        uint256 deadline;
    }

    /* Mappings */
    mapping (address => VestingTokens) private _vestingBalances;

    /* Constructor */
    constructor (
        uint256 cap
    ) public
      ERC20Detailed("ATMToken", "ATM", 18)
    {
        _cap = cap;
    }

    /* Functions */
    /**
     * @notice Returns the cap on the token's total supply
     * @return The supply capped amount
     */
    function cap() public view returns (uint256) {
        return _cap;
    }

    /**
     * @notice Sets a new cap on the token's total supply.
     * @param newCap The new capped amount of tokens
     */
    function setCap(uint256 newCap) public onlyPauser() whenNotPaused() {
        _cap = newCap;
        emit NewCap(_cap);
    }

    /**
     *  @notice Checks if account has a vesting schedule
     *  @param account The account being checked
     *  @return true if successful
     * 
     */
    function isVested(address account) public returns (bool) {
        require(_vestingBalances[account].amount > 0, "ACCOUNT_DOESNT_HAVE_VESTING");
        return true;
     }

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens for
     * @param amount The amount of tokens to mint
     * @return true if successful
     */
    function mint(address account, uint256 amount) public onlyPauser() whenNotPaused() returns (bool) {
        require(account != address(0), "MINT_TO_ZERO_ADDRESS");
        _beforeTokenTransfer(address(0), account, amount);
        _mint(account, amount);
        return true;
    }

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
    function mintVesting(address account, uint256 amount, uint256 vestingTime) public onlyPauser() whenNotPaused() {
        require(account != address(0), "MINT_TO_ZERO_ADDRESS");

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
         require(_vestingBalances[account].amount > 0, "ACCOUNT_DOESNT_HAVE_VESTING");
         VestingTokens memory vestingTokens = _vestingBalances[account];
         uint256 revokedAmount = vestingTokens.amount;
         uint256 revokedDeadline = vestingTokens.deadline;
         emit RevokeVesting(account, revokedAmount, revokedDeadline);
         delete _vestingBalances[account];
         return true;
     }

    /**
     *  @notice Withdrawl of tokens upon completion of vesting period
     *  @return true if successful
     *
     */
    function withdrawVested() public returns (bool) {
        require(_vestingBalances[msg.sender].amount > 0, "ACCOUNT_DOESNT_HAVE_VESTING");
        VestingTokens storage vestingTokens = _vestingBalances[msg.sender];
        _beforeTokenTransfer(address(0), vestingTokens.beneficiary, vestingTokens.amount);
        require(vestingTokens.deadline <= block.timestamp, "VESTING_DEADLINE_NOT_PASSSED");
        uint256 claimedAmount = vestingTokens.amount;
        _mint(vestingTokens.beneficiary, claimedAmount);
        vestingTokens.amount = 0;
        _vestingBalances[msg.sender] = vestingTokens;
        emit VestingClaimed(vestingTokens.beneficiary, claimedAmount);
        return true;
     }

    /**
     * @notice See {ERC20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - minted tokens must not cause the total supply to go over the cap.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal returns (bool){
        require(from == address(0) && totalSupply().add(amount) <= _cap, "ERC20_CAP_EXCEEDED"); // When minting tokens
    }
}