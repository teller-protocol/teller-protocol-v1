pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

// Common
import "../util/AddressLib.sol";
import "../base/TInitializable.sol";

// Contracts
import "../base/BaseUpgradeable.sol";

// Interfaces
import "./IATMGovernance.sol";
import "./ITLRToken.sol";
import "./IATMLiquidityMining.sol";
import "../interfaces/ITToken.sol";

// Libraries
import "./ATMCommon.sol";

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
    @notice This contract implements all the functions needed on Liquidity Mining program.
    @dev It uses specific configuration from ATM Governance instance. 
    @author develop@teller.finance
 */
contract ATMLiquidityMining is IATMLiquidityMining, TInitializable, BaseUpgradeable {
    using SafeMath for uint256;

    /* Constants */
    // Minimum amout of accrued TLR tokens required to be able to withdraw.
    bytes32 public constant MIN_TLR_TO_REDEEM = "MIN_TLR_TO_REDEEM";
    uint8 public constant NO_TTOKENS_STAKED = 0;
    uint8 public constant NO_TLR_ACCRUED = 0;

    /* State Variables */

    IATMGovernance private governance;

    ITLRToken private tlrToken;

    // List of staking information for every user divided by tToken.
    mapping(address => mapping(address => ATMCommon.UserStakeInfo)) public userStakeInfo;

    // List of addresses not allowed to stake on this ATM Liquidity Mining program.
    mapping(address => bool) public notAllowedAddresses;

    // All users except those contained in notAllowedAddresses will be able to use
    // Liquidity Mining program.
    modifier onlyAllowed() {
        require(!notAllowedAddresses[msg.sender], "SENDER_NOT_ALLOWED");
        _;
    }
    /**
        @notice Checks if the platform or ATM either is paused or not
        @dev Throws an error if the Teller platform is paused
     */
    modifier whenNotPaused() {
        require(
            !_getSettings().isPaused() &&
                !_getSettings().atmSettings().isATMPaused(address(governance)),
            "ATM_IS_PAUSED"
        );
        _;
    }

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
    ) external isNotInitialized() {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        require(atmGovernanceAddress.isContract(), "GOVERNANCE_MUST_BE_A_CONTRACT");
        require(tlrTokenAddress.isContract(), "TLRTOKEN_MUST_BE_A_CONTRACT");
        _setSettings(settingsAddress);
        governance = IATMGovernance(atmGovernanceAddress);
        tlrToken = ITLRToken(tlrTokenAddress);
        TInitializable._initialize();
    }

    /**
        @notice Adds a new address to the blacklisted list. This address will no longer be able to 
        stake on this ATM Liquidity Mining program intance. 
        @param notAllowed address we will blacklist.
     */
    function addNotAllowedAddress(address notAllowed)
        external
        onlyPauser()
        isInitialized()
    {
        notAllowedAddresses[notAllowed] = true;
        emit NotAllowedAddressAdded(msg.sender, notAllowed);
    }

    /**
        @notice Removes an address from the blacklisted list. This address will now start
        being able to stake on this ATM Liquidity Mining program intance. 
        @param notAllowed address we will blacklist.
     */
    function removeNotAllowedAddress(address notAllowed)
        external
        onlyPauser()
        isInitialized()
    {
        notAllowedAddresses[notAllowed] = false;
        emit NotAllowedAddressRemoved(msg.sender, notAllowed);
    }

    /**
        @notice End users stake their own tTokens on this ATM Liquidity Mining program to 
            earn TLR. This operation updates the user stake info for the sender (userStakeInfo[msg.sender]).
        @param tToken address of the tToken they will stake.
        @param amount amount of tToken to stake.
     */
    function stake(address tToken, uint256 amount)
        external
        onlyAllowed()
        isInitialized()
        whenNotPaused()
    {
        // TODO: Check tToken is a Teller whitelisted token on _getSettings().
        //require(_getSettings().tTokensRegistry().istTokenValid(tToken), "TTOKEN_IS_NOT_REGISTERED");
        require(amount > 0, "STAKING_ZERO_NOT_ALLOWED");
        // Checking tToken balance
        require(
            ITToken(tToken).balanceOf(msg.sender) >= amount,
            "INSUFFICIENT_TTOKENS_TO_STAKE"
        );
        // Update use stake info
        ATMCommon.UserStakeInfo memory userInfo = ATMCommon.UserStakeInfo({
            lastRewardedBlock: block.number,
            tTokenStakedBalance: _incrementTTokenBalance(tToken, amount), // Staking
            accruedTLRBalance: _getTLRTotalBalance(tToken)
        });
        // Transferring tTokens for staking
        require(
            ITToken(tToken).transferFrom(msg.sender, address(this), amount),
            "STAKE_TTOKEN_TRANSFER_FAILED"
        );
        userStakeInfo[msg.sender][tToken] = userInfo;

        emit Stake(
            msg.sender,
            tToken,
            amount,
            userInfo.lastRewardedBlock,
            userInfo.tTokenStakedBalance,
            userInfo.accruedTLRBalance
        );
    }

    /**
        @notice Unstake tTokens from this ATM, no more TLR tokens will be accrued from those 
            tTokens anymore. This operation updates the user stake info for the sender (userStakeInfo[msg.sender]).
        @param tToken address of the tToken they will unstake.
        @param amount amount of tToken to unstake.
    */
    function unStake(address tToken, uint256 amount)
        external
        isInitialized()
        whenNotPaused()
    {
        // TODO: Check tToken is a Teller whitelisted token on _getSettings().
        //require(_getSettings().tTokensRegistry().istTokenValid(tToken), "TTOKEN_IS_NOT_REGISTERED");
        require(amount > 0, "UNSTAKING_ZERO_NOT_ALLOWED");
        uint256 tTokenStakedBalance = userStakeInfo[msg.sender][tToken]
            .tTokenStakedBalance;
        require(tTokenStakedBalance >= amount, "NOT_ENOUGH_STAKED_TTOKENS");

        // Update user stake info
        ATMCommon.UserStakeInfo memory userInfo = ATMCommon.UserStakeInfo({
            lastRewardedBlock: block.number,
            tTokenStakedBalance: tTokenStakedBalance.sub(amount), // UnStaking
            accruedTLRBalance: _getTLRTotalBalance(tToken) // Accrued TLR are added
        });
        userStakeInfo[msg.sender][tToken] = userInfo;
        // Send tTokens back to user
        require(
            ITToken(tToken).transfer(msg.sender, amount),
            "UNSTAKE_TTOKEN_TRANSFER_FAILED"
        );

        emit UnStake(
            msg.sender,
            tToken,
            amount,
            userInfo.lastRewardedBlock,
            userInfo.tTokenStakedBalance,
            userInfo.accruedTLRBalance
        );
    }

    /**
        @notice Withdraws accrued TLR tokens by sending them to msg.sender owned account. This operation updates
         the user stake info for the sender (userStakeInfo[msg.sender]).
        @param amount amount of accrued TLR Tokens to withdraw.
     */
    function withdrawTLR(address tToken, uint256 amount)
        external
        isInitialized()
        whenNotPaused()
    {
        uint256 accruedTLRBalance = _getTLRTotalBalance(tToken);
        uint256 minimumTLRToRedeem = governance.getGeneralSetting(MIN_TLR_TO_REDEEM);
        require(
            accruedTLRBalance >= minimumTLRToRedeem,
            "NOT_ENOUGH_TLR_TOKENS_TO_REDEEM"
        );
        require(accruedTLRBalance >= amount, "UNSUFFICIENT_TLR_TO_WITHDRAW");
        // Minted tokens are reduced from accrued balance
        userStakeInfo[msg.sender][tToken].accruedTLRBalance = accruedTLRBalance.sub(
            amount
        );
        userStakeInfo[msg.sender][tToken].lastRewardedBlock = block.number;
        require(tlrToken.mint(msg.sender, amount), "WITHDRAW_FAILED_MINTING_TLR");

        emit TLRWithdrawn(
            msg.sender,
            amount,
            userStakeInfo[msg.sender][tToken].lastRewardedBlock,
            userStakeInfo[msg.sender][tToken].tTokenStakedBalance,
            userStakeInfo[msg.sender][tToken].accruedTLRBalance
        );
    }

    /**
        @notice Helper function to obtain the total balance of a tToken available on this Liquidity Mining instance.
        @param tToken tToken address we want to obtain the balance.
     */
    function gettTokenTotalBalance(address tToken) external view returns (uint256) {
        return ITToken(tToken).balanceOf(address(this));
    }

    /**
        @notice Returns TLR floating accrued balance since last Stake(), UnStake(), Withdraw() operation
            until current block. Floating indicates this balance is part of users TLR balance but is not yet 
            assigned on userStakeInfo[msg.sender].accruedTLRBalance until any of the following operations
            takes place (Stake(), UnStake(), Withdraw()). 
     */
    function getTLRFloatingBalance(address tToken) external view returns (uint256) {
        return _calculateAccruedTLR(tToken, block.number);
    }

    /**
        @notice Returns TLR total balance ( assigned + floating ) until current block.
     */
    function getTLRTotalBalance(address tToken) external view returns (uint256) {
        return _getTLRTotalBalance(tToken);
    }

    /**
        @notice Returns tToken sender balance plus the amount specified. 
        @param amount amount of tTokens to add to current tToken balance. 
     */
    function _incrementTTokenBalance(address tToken, uint256 amount)
        internal
        view
        returns (uint256)
    {
        return userStakeInfo[msg.sender][tToken].tTokenStakedBalance.add(amount);
    }

    /**
        @notice Returns sender's accrued TLR token amount since last operation (Stake(), UnStake(), Withdraw())
            until param blockNumber. 
        @param blockNumber most recent block number to be consider in this calculation.
    */
    function _calculateAccruedTLR(address tToken, uint256 blockNumber)
        internal
        view
        isInitialized()
        returns (uint256 earned)
    {
        // Getting latest stake movement info
        uint256 tTokenStakedBalance = userStakeInfo[msg.sender][tToken]
            .tTokenStakedBalance;
        // If nothing was staked return zero
        if (NO_TTOKENS_STAKED == tTokenStakedBalance) {
            return NO_TLR_ACCRUED;
        }
        uint256 latestRewardedBlock = userStakeInfo[msg.sender][tToken].lastRewardedBlock;
        if (latestRewardedBlock >= blockNumber) {
            return NO_TLR_ACCRUED;
        }
        ATMCommon.TLRReward[] memory rewards = governance.getTLRRewards();
        uint256 newestRewardBlock = blockNumber;
        uint256 interval = 0;

        for (uint256 i = 1; latestRewardedBlock <= newestRewardBlock; i++) {
            ATMCommon.TLRReward memory reward = rewards[rewards.length - i];
            if (reward.startBlockNumber < latestRewardedBlock) {
                interval = newestRewardBlock.sub(latestRewardedBlock);
            } else {
                interval = newestRewardBlock.sub(reward.startBlockNumber);
            }
            uint256 accruedTLR = reward.tlrPerBlockPertToken.mul(interval).mul(
                tTokenStakedBalance
            );
            earned = earned.add(accruedTLR);
            newestRewardBlock = reward.startBlockNumber;
        }
        return earned;
    }

    /**
        @notice Internal helper to return TLR total balance ( assigned + floating ) until current block.
     */
    function _getTLRTotalBalance(address tToken) internal view returns (uint256) {
        return
            userStakeInfo[msg.sender][tToken].accruedTLRBalance.add(
                _calculateAccruedTLR(tToken, block.number)
            );
    }
}
