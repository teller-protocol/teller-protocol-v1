// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IsaLPPricer {
    /**
     * @notice It returns the exchange rate of the single asset liquidity provider token.
     * @param saLPToken address of the single asset liquidity provider token.
     * @return Exchange rate for 1 saLP token in the underlying asset.
     */
    function getRateFor(address saLPToken) external view returns (uint256);

    /**
     * @notice It calculates the value of the protocol token amount into the underlying asset.
     * @param saLPToken address of the single asset liquidity provider token
     * @param amount Amount of the token to convert into the underlying asset.
     * @return Value of the saLP token in the underlying asset.
     */
    function getValueOf(address saLPToken, uint256 amount)
        external
        view
        returns (uint256);

    /**
     * @notice It calculates the balance of the underlying asset for {account}.
     * @param saLPToken Address of the single asset liquidity provider token.
     * @param account Address of the account to get the balance of.
     * @return Balance of the underlying asset.
     */
    function getBalanceOfUnderlying(address saLPToken, address account)
        external
        returns (uint256);

    /**
     * @notice Gets the underlying asset address for the {saLPToken}.
     * @param saLPToken address of the single asset liquidity provider token.
     * @return Address of the underlying asset.
     */
    function getUnderlying(address saLPToken) external view returns (address);
}
