pragma solidity ^0.5.17;

/**
    @notice This interface defines the different functions available for a Curve Pool
    @author develop@teller.finance
 */

interface ICurvePool {
    /**
        @notice Deposits an array of amounts into a Curve pool and a minimum number of pool tokens required to be received in return
        @notice The method throws if the minted tokens returned are less than the specified min_mint_amount
        @notice The min_mint_amount can be calculated with the calc_token_amount for the same inputs
        @param amounts The array of amounts to be deposited. Example [1000, 0, 0, 0] to deposit 1000 DAI the Curve sUSD pool [DAI, USDC, USDT, sUSD]
        @param min_mint_amount The minimum number of pool tokens expected to be received
     */
    function add_liquidity(uint256[4] calldata amounts, uint256 min_mint_amount) external;

    /**
        @notice Withdraws a specified amount from the Curve pool given an array of minimum coin amounts to recieve.
        @notice This method will revert if any of the received coin amounts is less than specified
        @param amount The amount of funds to withdraw
        @param min_amounts The array of minimum amounts of each token to be received
     */
    function remove_liquidity(uint256 amount, uint256[4] calldata min_amounts) external;

    /**
        @notice Removes liquidity from the Curve pool in uneven amounts, which can give slippage or a 'bonus' depending on if the coin is low or high in the pool
        @param amounts The array of amounts to be withdrawn
        @param max_burn_amount The maximum number of pool tokens to burn in return for withdrawal. The method reverts if the number is higher
     */

    function remove_liquidity_imbalance(
        uint256[4] calldata amounts,
        uint256 max_burn_amount
    ) external;

    /**
        @notice Returns an approximate number of pool tokens that would be recieved in return for an array of deposit amounts
        @param amounts The array of amounts to be deposited into the pool
        @return uint256 The number of pool tokens expected to be received
     */
    function calc_token_amount(uint256[4] calldata amounts)
        external
        view
        returns (uint256);

    /**
        @notice Returns the calcuated price of each liquidity share. This method doesn't measure the real price in dollars, but rather profit on top of what would have been observed with fee-less exchanges
        @return uint256 The price of the share
     */
    function get_virtual_price() external view returns (uint256);

    /**
        @notice Returns the contract addresses of the underlying tokens in the Curve pool
        @return address[4] The array of token addresses
     */
    function underlying_coins() external view returns (address[4] memory);

    /**
        @notice Returns the contract address of the LP token being used by the Curve pool
        @return address The LP token contract address
     */
    function token() external view returns (address);
}
