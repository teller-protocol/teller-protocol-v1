pragma solidity 0.5.17;

/**
    @notice Curve dApp interface. 

    @author develop@teller.finance
 */
interface ICurve {
    /**
        @notice This event is emitted every time CurvePool deposit is invoked successfully
        @param tokenAddress address of the underlying token
        @param crvPoolToken crv LP token address
        @param amount amount of tokens to Deposit
        @param tokenBalance underlying token balance after Deposit
        @param lpTokenBalance balance of LP tokens received after deposit
     */
    event CurvePoolDeposit(
        address tokenAddress,
        address crvPoolToken,
        uint256 amount,
        uint256 tokenBalance,
        uint256 lpTokenBalance
    );

    /**
        @notice This event is emitted every time CurveGauge deposit is invoked successfully
        @param tokenAddress address of the underlying token
        @param crvLPToken crv LP token address
        @param lpTokenBalance amount of LP tokens staked
     */
    event CurveLPStaked(address tokenAddress, address crvLPToken, uint256 lpTokenBalance);

    /**
        @notice This event is emitted every time CurveMinter mint is invoked successfully
        @param tokenAddress address of the underlying token
        @param claimedTokens amount of CRV tokens claimed successfully
     */
    event CRVClaimed(address tokenAddress, uint256 claimedTokens);

    /**
        @notice This event is emitted every time CurveVoting create_lock is invoked successfully
        @param tokenAddress address of the underlying token
        @param stakedBalance amount of CRV tokens locked successfully
        @param unlockTime length of time (in seconds) after which tokens can be claimed
     */
    event CRVLocked(address tokenAddress, uint256 stakedBalance, uint256 unlockTime);

    /**
        @notice This event is emitted every time CurvePool withdraw is invoked successfully
        @param tokenAddress address of the underlying token
        @param crvPoolToken crv LP token address
        @param amount amount of tokens withdrawn
        @param tokenBalance underlying token balance after Withdrawal
     */
    event CurvePoolWithdrawal(
        address tokenAddress,
        address crvPoolToken,
        uint256 amount,
        uint256 tokenBalance
    );

    /**
        @notice This event is emitted every time CurveGauge withdraw is invoked successfully
        @param tokenAddress address of the underlying token
        @param crvLPToken crv LP token address
        @param lpTokenBalance amount of LP tokens unstaked
     */
    event CurveLPUnstaked(
        address tokenAddress,
        address crvLPToken,
        uint256 lpTokenBalance
    );

    /**
        @notice This event is emitted every time CurveVoting withdraw is invoked successfully
        @param tokenAddress address of the underlying token
        @param unstakedBalance amount of CRV tokens unlocked successfully
     */
    event CRVUnlocked(address tokenAddress, uint256 unstakedBalance);

    /**
        @notice Deposits tokens into a Curve pool, and then stakes the LP tokens received in a Curve Gauge contract
        @param tokenAddress address of the asset token contract to deposit
        @param amount amount of tokens to deposit
    */
    function deposit(address tokenAddress, uint256 amount) external;

    /**
        @notice Stakes received LP tokens into an associated asset Curve Liquidity Gauge contract
        @param tokenAddress address of the asset token contract to stake
     */
    function stake(address tokenAddress) external;

    /**
        @notice Claims the available CRV rewards
        @param tokenAddress address of the asset token contract to claim for
     */
    function claim(address tokenAddress) external;

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
    ) external;

    /**
        @notice Withdraws tokens from a Curve pool
        @param tokenAddress address of the asset token contract to withdraw
        @param amount amount of tokens to withdraw
    */
    function withdraw(address tokenAddress, uint256 amount) external;

    /**
        @notice Unstakes LP tokens from an associated asset Curve Liquidity Gauge contract
        @param tokenAddress address of the asset token contract to unstake
     */
    function unstake(address tokenAddress) external;

    /**
        @notice Withdraws any eligible time locked CRV tokens at the time of the call
        @param tokenAddress Address of the asset token contract
     */
    function releaseLocked(address tokenAddress) external;
}
