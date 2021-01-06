pragma solidity 0.5.17;

/* Import */

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Arrays.sol";
import "./ITLRToken.sol";

import "../base/TInitializable.sol";
import "../base/BaseUpgradeable.sol";

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
 *  @title TLR Token for the Teller Platform
 *
 *  @author develop@teller.finance
 */

contract TLRToken is
    ITLRToken,
    ERC20Detailed,
    ERC20Mintable,
    ERC20Burnable,
    TInitializable,
    BaseUpgradeable
{
    /**
     *  @notice TLRToken implements an ERC20 token with a supply cap and a vesting scheduling
     */
    using SafeMath for uint256;
    using Arrays for uint256[];
    using Address for address;

    /* Modifiers */

    /**
        @notice Checks if the platform is paused or not
        @dev Throws an error is the Teller platform is paused
     */
    modifier whenNotPaused() {
        require(!_getSettings().atmSettings().isATMPaused(atmAddress), "ATM_IS_PAUSED");
        _;
    }

    /* State Variables */
    uint256 private _cap;
    uint256 private _maxVestingPerWallet;
    Snapshots private _totalSupplySnapshots;
    uint256 private _currentSnapshotId;
    address public atmAddress;

    /* Structs */
    struct VestingTokens {
        address account;
        uint256 amount;
        uint256 start;
        uint256 cliff;
        uint256 deadline;
    }

    struct Snapshots {
        uint256[] ids;
        uint256[] values;
    }

    /* Mappings */
    mapping(address => mapping(uint256 => VestingTokens)) private _vestingBalances; // Mapping user address to vesting id, which in turn is mapped to the VestingTokens struct
    mapping(address => uint256) public vestingCount;
    mapping(address => uint256) public assignedTokens;
    mapping(address => Snapshots) private _accountBalanceSnapshots;

    /* Functions */

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
    ) external initializer() isNotInitialized() {
        require(cap > 0, "CAP_CANNOT_BE_ZERO");
        require(atm.isContract(), "ATM_CANNOT_BE_ZERO_ADDRESS");
        require(settingsAddress.isContract(), "SETTINGS_SHOULD_BE_A_CONTRACT");
        ERC20Detailed.initialize(name, symbol, decimals);
        ERC20Mintable.initialize(msg.sender);
        TInitializable._initialize();
        _cap = cap;
        _maxVestingPerWallet = maxVestingPerWallet;
        atmAddress = atm;
        _setSettings(settingsAddress);
    }

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
    function setCap(uint256 newCap)
        external
        onlyPauser()
        whenNotPaused()
        isInitialized()
    {
        require(_cap > 0, "CAP_CANNOT_BE_ZERO");
        _cap = newCap;
        emit NewCap(_cap);
    }

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens for
     * @param amount The amount of tokens to mint
     * @return true if successful
     */
    function mint(address account, uint256 amount)
        public
        onlyMinter()
        whenNotPaused()
        isInitialized()
        returns (bool)
    {
        require(account != address(0x0), "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED");
        _beforeTokenTransfer(address(0x0), account, amount);
        _mint(account, amount);
        _snapshot();
        _updateAccountSnapshot(account);
        _updateTotalSupplySnapshot();
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
    ) public onlyPauser() whenNotPaused() isInitialized() {
        require(account != address(0x0), "MINT_TO_ZERO_ADDRESS_NOT_ALLOWED");
        require(vestingCount[account] < _maxVestingPerWallet, "MAX_VESTINGS_REACHED");
        require(vestingTime != 0, "VESTING_CANNOT_BE_ZERO");
        _beforeTokenTransfer(address(0x0), account, amount);
        vestingCount[account] = vestingCount[account].add(1);
        uint256 vestingId = vestingCount[account];
        VestingTokens memory vestingTokens = VestingTokens(
            account,
            amount,
            block.timestamp,
            block.timestamp.add(cliff),
            block.timestamp.add(vestingTime)
        );
        _mint(address(this), amount);
        _snapshot();
        _updateAccountSnapshot(address(this));
        _updateTotalSupplySnapshot();
        assignedTokens[account] = assignedTokens[account].add(amount);
        _vestingBalances[account][vestingId] = vestingTokens;
        emit NewVesting(account, amount, vestingTime);
    }

    /**
     * @notice Revokes the amount vested to an account
     * @param account The account for which vesting is to be revoked
     * @param vestingId The Id of the vesting being revoked
     *
     */
    function revokeVesting(address account, uint256 vestingId)
        public
        onlyPauser()
        whenNotPaused()
        isInitialized()
    {
        require(assignedTokens[account] > 0, "ACCOUNT_DOESNT_HAVE_VESTING");
        VestingTokens memory vestingTokens = _vestingBalances[account][vestingId];

        uint256 unvestedTokens = _returnUnvestedTokens(
            vestingTokens.amount,
            block.timestamp,
            vestingTokens.start,
            vestingTokens.cliff,
            vestingTokens.deadline
        );
        assignedTokens[account] = assignedTokens[account].sub(unvestedTokens);
        _burn(address(this), unvestedTokens);
        _snapshot();
        _updateAccountSnapshot(address(this));
        _updateTotalSupplySnapshot();
        emit RevokeVesting(account, unvestedTokens, vestingTokens.deadline);
        delete _vestingBalances[account][vestingId];
    }

    /**
     *  @notice Withdrawal of tokens upon completion of vesting period
     *
     */
    function withdrawVested() public whenNotPaused() isInitialized() {
        require(assignedTokens[msg.sender] > 0, "ACCOUNT_DOESNT_HAVE_VESTING");

        uint256 transferableTokens = _transferableTokens(msg.sender, block.timestamp);
        _transfer(address(this), msg.sender, transferableTokens);
        _snapshot();
        _updateAccountSnapshot(msg.sender);
        _updateAccountSnapshot(address(this));
        assignedTokens[msg.sender] = assignedTokens[msg.sender].sub(transferableTokens);
        emit VestingClaimed(msg.sender, transferableTokens);
    }

    /**
     * @dev See {IERC20-transfer}.
     * @param recipient The address of the account receiving the tokens
     * @param amount The amount to send
     * Requirements:
     *
     * - `recipient` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address recipient, uint256 amount)
        public
        isInitialized()
        returns (bool)
    {
        _snapshot();
        _updateAccountSnapshot(msg.sender);
        _updateAccountSnapshot(recipient);
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    /**
     * @notice See {ERC20-_beforeTokenTransfer}.
     * @param from The address from which tokens are being transfered/minted
     * @param , Placeholder for to address
     * @param amount The amount of tokens being transfered
     * Requirements:
     *
     * - minted tokens must not cause the total supply to go over the cap.
     */
    function _beforeTokenTransfer(
        address from,
        address,
        uint256 amount
    ) internal view {
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
        uint256 totalVesting = vestingCount[_account];
        uint256 totalAssigned = assignedTokens[_account];
        uint256 nonTransferable = 0;
        for (uint256 i = 0; i < totalVesting; i++) {
            VestingTokens storage vestingTokens = _vestingBalances[_account][i];
            nonTransferable = nonTransferable.add(
                _returnUnvestedTokens(
                    vestingTokens.amount,
                    _time,
                    vestingTokens.start,
                    vestingTokens.cliff,
                    vestingTokens.deadline
                )
            );
        }
        uint256 transferable = totalAssigned.sub(nonTransferable);
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
            uint256 tokens = amount.mul(time.sub(start));
            uint256 eligibleTokens = tokens.div(deadline.sub(start));
            return amount.sub(eligibleTokens);
        }
    }

    /**
        @notice Creates a new snapshot and returns its snapshot id
        @return The id of the snapshot created
     */
    function _snapshot() internal returns (uint256) {
        _currentSnapshotId = _currentSnapshotId.add(1);
        uint256 currentId = _currentSnapshotId;
        emit Snapshot(currentId);
        return currentId;
    }

    /**
        @notice Returns the balance of an account at the time a snapshot was created
        @param account The account which is being queried
        @param snapshotId The id of the snapshot being queried
     */
    function balanceOfAt(address account, uint256 snapshotId)
        external
        view
        returns (uint256)
    {
        (bool snapshotted, uint256 value) = _valueAt(
            snapshotId,
            _accountBalanceSnapshots[account]
        );

        return snapshotted ? value : balanceOf(account);
    }

    /**
        @notice Returns the total supply at the time a snapshot was created
        @param snapshotId The id of the snapshot being queried
     */
    function totalSupplyAt(uint256 snapshotId) external view returns (uint256) {
        (bool snapshotted, uint256 value) = _valueAt(snapshotId, _totalSupplySnapshots);

        return snapshotted ? value : totalSupply();
    }

    /**
        @notice Returns the element from the id array with the index of the smallest value that is larger if not found, unless it doesn't exist
        @param snapshotId The id of the snapshot being createc
        @param snapshots The struct of the snapshots being queried
     */
    function _valueAt(uint256 snapshotId, Snapshots storage snapshots)
        private
        view
        returns (bool, uint256)
    {
        uint256 index = snapshots.ids.findUpperBound(snapshotId);

        if (index == snapshots.ids.length) {
            return (false, 0);
        } else {
            return (true, snapshots.values[index]);
        }
    }

    /**
        @notice Creates a snapshot of a given account
        @param account The account for which the snapshot is being created
     */
    function _updateAccountSnapshot(address account) private {
        _updateSnapshot(_accountBalanceSnapshots[account], balanceOf(account));
    }

    /**
        @notice Creates a snapshot of the total supply of tokens
     */
    function _updateTotalSupplySnapshot() private {
        _updateSnapshot(_totalSupplySnapshots, totalSupply());
    }

    /**
        @notice Updates the given snapshot struct with the latest snapshot
        @param snapshots The snapshot struct being updated
        @param currentValue The current value at the time of snapshot creation
     */
    function _updateSnapshot(Snapshots storage snapshots, uint256 currentValue) private {
        uint256 currentId = _currentSnapshotId;
        snapshots.ids.push(currentId);
        snapshots.values.push(currentValue);
    }
}
