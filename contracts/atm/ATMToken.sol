pragma solidity 0.5.17;

/* Import */

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./ATMTokenInterface.sol";


/**
 *  @title ATM Token for Teller DAO
 *
 *  @author develop@teller.finance
 */

contract ATMToken is ATMTokenInterface, ERC20Detailed, ERC20Mintable, ERC20Burnable {
    /**
     *  @notice ATMToken implements an ERC20 token with a supply cap and a vesting scheduling
     */
    using SafeMath for uint256;

    /* Modifiers */
    /**
        @notice Checks if sender is owner
        @dev Throws an error if the sender is not the owner
     */
    modifier onlyOwner() {
        require(msg.sender == _owner, "CALLER_IS_NOT_OWNER");
        _;
    }

    /* State Variables */
    uint256 private _cap;
    uint256 private _maxVestingsPerWallet;
    address private _owner;

    /* Structs */
    struct VestingTokens {
        address account;
        uint256 amount;
        uint256 start;
        uint256 cliff;
        uint256 deadline;
    }

    /* Mappings */
    mapping(address => mapping(uint256 => VestingTokens)) private _vestingBalances; // Mapping user address to vestings id, which in turn is mapped to the VestingTokens struct
    mapping(address => uint256) public vestingsCount;
    mapping(address => uint256) public assignedTokens;

    /* Constructor */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 cap,
        uint256 maxVestingsPerWallet
    ) public ERC20Detailed(_name, _symbol, _decimals) {
        require(cap > 0, "CAP_CANNOT_BE_ZERO");
        _cap = cap;
        _maxVestingsPerWallet = maxVestingsPerWallet;
        _owner = msg.sender;
    }

    /* Functions */
    /**
     * @notice Returns the cap on the token's total supply
     * @return The supply capped amount
     */
    function cap() external view returns (uint256) {
        return _cap;
    }

    /**
     * @notice Sets a new cap on the token's total supply.
     * @param newCap The new capped amount of tokens
     */
    function setCap(uint256 newCap) external onlyOwner() {
        _cap = newCap;
        emit NewCap(_cap);
    }

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens for
     * @param amount The amount of tokens to mint
     * @return true if successful
     */
    function mint(address account, uint256 amount) public onlyOwner() returns (bool) {
        require(account != address(0x0), "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED");
        _beforeTokenTransfer(address(0x0), account, amount);
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
     * @param cliff The length of time (in seconds) after which the tokens will start vesting
     * @param vestingTime The length of the vesting period (in seconds)
     */
    function mintVesting(
        address account,
        uint256 amount,
        uint256 cliff,
        uint256 vestingTime
    ) public onlyOwner() {
        require(account != address(0x0), "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED");
        require(vestingsCount[account] < _maxVestingsPerWallet, "MAX_VESTINGS_REACHED");
        _beforeTokenTransfer(address(0x0), account, amount);
        uint256 vestingId = vestingsCount[account]++;
        vestingsCount[account] += 1;
        VestingTokens memory vestingTokens = VestingTokens(
            account,
            amount,
            block.timestamp,
            block.timestamp + cliff,
            block.timestamp + vestingTime
        );
        _mint(address(this), amount);
        assignedTokens[account] += amount;
        _vestingBalances[account][vestingId] = vestingTokens;
        emit NewVesting(account, amount, vestingTime);
    }

    /**
     * @notice Revokes the amount vested to an account
     * @param account The account for which vesting is to be revoked
     * @param vestingId The Id of the vesting being revoked
     *
     */
    function revokeVesting(address account, uint256 vestingId) public onlyOwner() {
        require(assignedTokens[account] > 0, "ACCOUNT_DOESNT_HAVE_VESTING");
        VestingTokens memory vestingTokens = _vestingBalances[account][vestingId];

        uint256 unvestedTokens = _returnUnvestedTokens(
            vestingTokens.amount,
            block.timestamp,
            vestingTokens.start,
            vestingTokens.cliff,
            vestingTokens.deadline
        );
        assignedTokens[account] -= unvestedTokens;
        _burn(address(this), unvestedTokens);
        emit RevokeVesting(account, unvestedTokens, vestingTokens.deadline);
        delete _vestingBalances[account][vestingId];
    }

    /**
     *  @notice Withdrawl of tokens upon completion of vesting period
     *  @return true if successful
     *
     */
    function withdrawVested() public {
        require(assignedTokens[msg.sender] > 0, "ACCOUNT_DOESNT_HAVE_VESTING");

        uint256 transferableTokens = _transferableTokens(msg.sender, block.timestamp);
        approve(msg.sender, transferableTokens);
        assignedTokens[msg.sender] -= transferableTokens;
        emit VestingClaimed(msg.sender, transferableTokens);
    }

    /**
     * @notice See {ERC20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - minted tokens must not cause the total supply to go over the cap.
     */
    function _beforeTokenTransfer(address from, address, uint256 amount)
        internal
        view
    {
        require(
            from == address(0) && totalSupply().add(amount) <= _cap,
            "ERC20_CAP_EXCEEDED"
        ); // When minting tokens
    }

    /**
     * @notice Checks the balance of an assigned vesting that is eligible for withdrawal
     * @param _account The account for which the vesting is being queried
     * @param _time The
     * @return The amount of tokens eligible for withdrawal
     */
    function _transferableTokens(address _account, uint256 _time)
        internal
        view
        returns (uint256)
    {
        uint256 totalVestings = vestingsCount[_account];
        uint256 totalAssigned = assignedTokens[_account];
        uint256 nonTransferable = 0;
        for (uint256 i = 0; i < totalVestings; i++) {
            VestingTokens storage vestingTokens = _vestingBalances[_account][i];
            nonTransferable = _returnUnvestedTokens(
                vestingTokens.amount,
                _time,
                vestingTokens.start,
                vestingTokens.cliff,
                vestingTokens.deadline
            );
        }
        uint256 transferable = totalAssigned - nonTransferable;
        return transferable;
    }

    /**
     * @notice Returns the amount of unvested tokens at a given time
     * @param amount The total number of vested tokens
     * @param time The time at which vested is being checked
     * @param start The starting time of the vesting
     * @param cliff The cliff period
     * @param deadline The time when vesting is complete
     * @return The amount of unvested tokens
     */
    function _returnUnvestedTokens(
        uint256 amount,
        uint256 time,
        uint256 start,
        uint256 cliff,
        uint256 deadline
    ) internal pure returns (uint256) {
        if (time >= deadline) {
            return 0;
        } else if (time < cliff) {
            return amount;
        } else {
            uint256 eligibleTokens = amount.mul(time.sub(start) / deadline.sub(start));
            return amount.sub(eligibleTokens);
        }
    }
}
