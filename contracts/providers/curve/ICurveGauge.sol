pragma solidity ^0.5.17;

/**
    @notice This interface defines the different functions available for a CRV staking Gauge contract
    @author develop@teller.finance
 */

interface ICurveGauge {
    /**
        @notice Returns the LP token accepted as a deposit in this staking gauge contract
     */
    function lp_token() external view returns (address);

    /**
        @notice Deposits a given amount LP tokens into the staking gauge contract
        @param amount The amount of tokens to deposit
     */
    function deposit(uint256 amount) external;

    /**
        @notice Withdraws a specified amount of LP tokens from the staking gauge contract
        @param amount The amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external;

    /**
        @notice Returns the balance of LP tokens for a address that has staked in this gauge contract
     */
    function balanceOf(address) external view returns (uint256);

    /**
        @notice Get the number of claimable tokens for the specified address
        @param stakingAddress The CRV staking address to check
        @return uint256 Amount of claimable tokens
     */
    function claimable_tokens(address stakingAddress) external view returns (uint256);

    /**
        @notice Returns the address of the token minting contract used for issuing new CRV
     */
    function minter() external view returns (address);

    /**
        @notice Returns the token address for the CRV issued
     */
    function crv_token() external view returns (uint256);
}
