pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

//Contracts
import "../../BaseEscrowDapp.sol";

// Interfaces
import "./ICurve.sol";
import "../../../providers/curve/ICurvePool.sol";
import "../../../providers/curve/ICurveGauge.sol";
import "../../../providers/curve/ICurveMinter.sol";
import "../../../providers/curve/ICurveVoting.sol";
import "../../../providers/curve/ICurveFeeDistribution.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                      DAPP CONTRACT IS AN EXTENSION OF THE ESCROW CONTRACT                       **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Because there are multiple dApp contracts, and they all extend the Escrow contract that is     **/
/**  itself upgradeable, they cannot have their own storage variables as they would cause the the   **/
/**  storage slots to be overwritten on the Escrow proxy contract!                                  **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used to define Curve dApp actions available. All dapp actions are invoked via
        delegatecalls from Escrow contract, so this contract's state is really Escrow.
    @author develop@teller.finance
 */
contract Curve is ICurve, BaseEscrowDapp {
    using Address for address;
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /** External functions */
    /**
        @notice Deposits tokens into a Curve pool, and then stakes the LP tokens received in a Curve Gauge contract
        @param tokenAddress address of the asset token contract to deposit
        @param amount amount of tokens to deposit
    */
    function deposit(address tokenAddress, uint256 amount) public onlyOwner() {
        // Check underlying balance
        require(_balanceOf(tokenAddress) >= amount, "CURVE_INSUFFICIENT_UNDERLYING");
        // Get Curve Pool instance
        ICurvePool crvPool = _getCRVPool(tokenAddress);
        // Check if token being desposited matches the one in the pool {DAI is the first asset in both the 3pool and sUSD pool, and USDC is the second}
        require(
            tokenAddress == crvPool.underlying_coins()[0],
            "UNDERLYING_NOT_SUPPORTED"
        );
        // Safe approve deposit amount
        IERC20(tokenAddress).safeApprove(address(crvPool), amount);
        // Check LP token balance before despositing
        uint256 lpTokenBalanceBeforeDeposit = _balanceOf(crvPool.token());
        // Deposit into Curve Pool
        crvPool.add_liquidity([amount, 0, 0, 0], 0);
        // Check LP balance - should have increased upon successful deposit
        uint256 lpTokenBalanceAfterDeposit = _balanceOf(crvPool.token());
        require(
            lpTokenBalanceAfterDeposit > lpTokenBalanceBeforeDeposit,
            "LP_BALANCE_NOT_INCREASED"
        );

        _tokenUpdated(crvPool.token()); // LP token address received
        _tokenUpdated(tokenAddress);

        uint256 tokenBalanceAfterDeposit = _balanceOf(tokenAddress);
        emit CurvePoolDeposit(
            tokenAddress,
            crvPool.token(),
            amount,
            tokenBalanceAfterDeposit,
            lpTokenBalanceAfterDeposit
        );
    }

    /**
        @notice Stakes received LP tokens into an associated asset Curve Liquidity Gauge contract
        @param tokenAddress address of the asset token contract to stake
     */
    function stake(address tokenAddress) public onlyOwner() {
        // Get Curve Liquidity Gauge instance
        ICurveGauge crvGauge = _getCRVGauge(tokenAddress);
        uint256 LPBalance = _balanceOf(crvGauge.lp_token());
        // Check LP token balance
        require(LPBalance > 0, "INSUFFICIENT_LP");
        // Approve the instance for the LP tokens
        IERC20(crvGauge.lp_token()).safeApprove(address(crvGauge), LPBalance);
        // Stake the LP tokens into the Gauge
        crvGauge.deposit(LPBalance);
        // Check if LP tokens were deposited
        require(crvGauge.balanceOf(address(this)) == LPBalance, "LP_NOT_DEPOSITED");
        emit CurveLPStaked(tokenAddress, crvGauge.lp_token(), LPBalance);
    }

    /**
        @notice Claims the available CRV rewards
        @param tokenAddress address of the asset token contract to claim for
     */
    function claim(address tokenAddress) public onlyOwner() {
        uint256 claimableTokens = _getCRVGauge(tokenAddress).claimable_tokens(
            address(this)
        );
        require(claimableTokens > 0, "NO_CRV_TO_CLAIM");
        _getCRVMinter(tokenAddress).mint(_getCRVGauge(tokenAddress));
        require(
            _balanceOf(_getCRVGauge(tokenAddress).crv_token()) == claimableTokens,
            "CRV_CLAIM_UNSUCCESSFUL"
        );
        emit CRVClaimed(tokenAddress, claimableTokens);
    }

    /**
        @notice Creates a time lock for CRV tokens held by the escrow
        @param tokenAddress Address of the asset token contract
        @param amount The amount of CRV tokens to lock
        @param unlockTime The length of time (in seconds) after which tokens can be unlocked
     */
    function lock(
        address tokenAddress,
        uint256 amount,
        uint256 unlockTime
    ) public onlyOwner() {
        ICurveVoting crvVoting = _getCRVVoting(tokenAddress);
        uint256 crvBalance = IERC20(_getCRVGauge(tokenAddress).lp_token()).balanceOf(
            address(this)
        );
        require(amount > crvBalance, "INSUFFICIENT_CRV_BALANCE");
        crvVoting.create_lock(amount, unlockTime);
        uint256 stakedBalance = crvVoting.balanceOf(address(this));
        require(amount == stakedBalance, "CRV_NOT_LOCKED");
        emit CRVLocked(tokenAddress, stakedBalance, unlockTime);
    }

    /**
        @notice Withdraws tokens from a Curve pool
        @param tokenAddress address of the asset token contract to withdraw
        @param amount amount of tokens to withdraw
    */
    function withdraw(address tokenAddress, uint256 amount) public onlyOwner() {
        // Get Curve Pool instance
        ICurvePool crvPool = _getCRVPool(tokenAddress);
        // Check if token being withdrawn matches the one in the pool {DAI is the first asset in both the 3pool and sUSD pool, and USDC is the second}
        require(
            tokenAddress == crvPool.underlying_coins()[0],
            "UNDERLYING_NOT_SUPPORTED"
        );
        uint256 tokenBalanceBeforeWithdraw = _balanceOf(tokenAddress);

        crvPool.remove_liquidity(amount, [uint256(0), 0, 0, 0]);
        _tokenUpdated(crvPool.token()); // LP token address received
        _tokenUpdated(tokenAddress);

        // Check if balance has increased
        uint256 tokenBalanceAfterWithdraw = _balanceOf(tokenAddress);
        require(
            tokenBalanceAfterWithdraw > tokenBalanceBeforeWithdraw,
            "BALANCE_NOT_INCREASED"
        );
        emit CurvePoolWithdrawal(
            tokenAddress,
            crvPool.token(),
            amount,
            tokenBalanceAfterWithdraw
        );
    }

    /**
        @notice Unstakes LP tokens from an associated asset Curve Liquidity Gauge contract
        @param tokenAddress address of the asset token contract to unstake
     */
    function unstake(address tokenAddress) public onlyOwner() {
        // Get Curve Liquidity Gauge instance
        ICurveGauge crvGauge = _getCRVGauge(tokenAddress);
        uint256 LPBalance = crvGauge.balanceOf(address(this));
        // Check LP token balance
        require(LPBalance > 0, "INSUFFICIENT_LP_STAKED");
        // Unstake the LP tokens from the Gauge contract
        crvGauge.withdraw(LPBalance);
        // Check if LP tokens were deposited
        require(_balanceOf(crvGauge.lp_token()) == LPBalance, "LP_NOT_WITHDRAWN");
        emit CurveLPUnstaked(tokenAddress, crvGauge.lp_token(), LPBalance);
    }

    /**
        @notice Withdraws any eligible time locked CRV tokens at the time of the call
        @param tokenAddress Address of the asset token contract
     */
    function releaseLocked(address tokenAddress) public onlyOwner() {
        ICurveVoting crvVoting = _getCRVVoting(tokenAddress);
        uint256 stakedBalance = crvVoting.balanceOf(address(this));
        require(stakedBalance > 0, "INSUFFICIENT_CRV_STAKED");
        crvVoting.withdraw();
        uint256 crvBalance = IERC20(_getCRVGauge(tokenAddress).lp_token()).balanceOf(
            address(this)
        );
        require(crvBalance == stakedBalance, "CRV_NOT_RELEASED");
        emit CRVUnlocked(tokenAddress, crvBalance);
    }

    /** Internal functions */
    /**
        @notice Grabs the curve pool address for an token from the asset settings.
        @notice This instance is used to deposit and wihdraw from a Curve Pool
        @notice The curve underlying address must match the supplied token address.
        @param tokenAddress The token address to get the curve pool address for.
        @return Curve Pool instance.
     */
    function _getCRVPool(address tokenAddress) internal view returns (ICurvePool) {
        return ICurvePool(_getSettings().getCRVPool(tokenAddress));
    }

    /**
        @notice Grabs the curve staking gauge contract address from the asset settings.
        @notice This instance is used to stake Curve LP tokens to earn CRV tokens.
        @notice The curve underlying address must match the supplied token address.
        @param tokenAddress The token address to get the curve staking gauge contract address for.
        @return Curve Gauge instance.
     */
    function _getCRVGauge(address tokenAddress) internal view returns (ICurveGauge) {
        return ICurveGauge(_getSettings().getCRVGauge(tokenAddress));
    }

    /**
        @notice Grabs the curve minter address for an token from the asset settings.
        @notice This instance is used to claim CRV earned by a lender.
        @notice The curve underlying address must match the supplied token address.
        @param tokenAddress The token address to get the curve minter address for.
        @return Curve Minter instance
     */
    function _getCRVMinter(address tokenAddress) internal view returns (ICurveMinter) {
        return ICurveMinter(_getSettings().getCRVMinter(tokenAddress));
    }

    /**
        @notice Grabs the curve voting contract address for an token from the asset settings.
        @notice This instance is used to lock CRV tokens for a period of time to earn a greater return.
        @notice The curve underlying address must match the supplied token address.
        @param tokenAddress The token address to get the curve voting contract address for.
        @return Curve Voting instance
     */
    function _getCRVVoting(address tokenAddress) internal view returns (ICurveVoting) {
        return ICurveVoting(_getSettings().getCRVVoting(tokenAddress));
    }

    /**
        @notice Grabs the curve pool address for an token from the asset settings.
        @notice This instance is used to claim the earned trading fees from depositng funds into a Curve Pool.
        @notice The curve underlying address must match the supplied token address.
        @param tokenAddress The token address to get the curve pool address for.
        @return Curve Fee Distribution instance
     */
    function _getCRVFeeDistribution(address tokenAddress)
        internal
        view
        returns (ICurveDistribution)
    {
        return ICurveDistribution(_getSettings().getCRVFeeDistribution(tokenAddress));
    }
}
