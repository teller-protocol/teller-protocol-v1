// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IComptroller.sol";

interface ICErc20 {
    /*** User Interface ***/

    /**
        @notice The mint function transfers an asset into the protocol, which begins accumulating interest based on the current Supply Rate for the asset. The user receives a quantity of cTokens equal to the underlying tokens supplied, divided by the current Exchange Rate.
        @param mintAmount The amount of the asset to be supplied, in units of the underlying asset.
        @return 0 on success, otherwise an Error code
        @dev msg.sender The account which shall supply the asset, and own the minted cTokens.
        @dev Before supplying an asset, users must first approve the cToken to access their token balance.
     */
    function mint(uint256 mintAmount) external returns (uint256);

    /**
        @notice The redeem function converts a specified quantity of cTokens into the underlying asset, and returns them to the user. The amount of underlying tokens received is equal to the quantity of cTokens redeemed, multiplied by the current Exchange Rate. The amount redeemed must be less than the user's Account Liquidity and the market's available liquidity.
        @param redeemTokens The number of cTokens to be redeemed.
        @return 0 on success, otherwise an Error code
        @dev msg.sender The account to which redeemed funds shall be transferred.
     */
    function redeem(uint256 redeemTokens) external returns (uint256);

    /**
        @notice The redeem underlying function converts cTokens into a specified quantity of the underlying asset, and returns them to the user. The amount of cTokens redeemed is equal to the quantity of underlying tokens received, divided by the current Exchange Rate. The amount redeemed must be less than the user's Account Liquidity and the market's available liquidity.
        @param redeemAmount The amount of underlying to be redeemed.
        @return 0 on success, otherwise an Error code
        @dev msg.sender The account to which redeemed funds shall be transferred.
     */
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    /**
        @notice The borrow function transfers an asset from the protocol to the user, and creates a borrow balance which begins accumulating interest based on the Borrow Rate for the asset. The amount borrowed must be less than the user's Account Liquidity and the market's available liquidity.
        @param borrowAmount The amount of the underlying asset to be borrowed.
        @return 0 on success, otherwise an Error code
        @dev msg.sender The account to which borrowed funds shall be transferred.
     */
    function borrow(uint256 borrowAmount) external returns (uint256);

    /**
        @notice The repay function transfers an asset into the protocol, reducing the user's borrow balance.
        @param repayAmount The amount of the underlying borrowed asset to be repaid. A value of -1 (i.e. 2^256 - 1) can be used to repay the full amount.
        @return 0 on success, otherwise an Error code
        @dev msg.sender The account which borrowed the asset, and shall repay the borrow.
        @dev Before repaying an asset, users must first approve the cToken to access their token balance.
     */
    function repayBorrow(uint256 repayAmount) external returns (uint256);

    /**
        @notice The repay function transfers an asset into the protocol, reducing the target user's borrow balance.
        @param borrower The account which borrowed the asset to be repaid.
        @param repayAmount The amount of the underlying borrowed asset to be repaid. A value of -1 (i.e. 2^256 - 1) can be used to repay the full amount.
        @return 0 on success, otherwise an Error code
        @dev msg.sender The account which shall repay the borrow.
        @dev Before repaying an asset, users must first approve the cToken to access their token balance.
     */
    function repayBorrowBehalf(address borrower, uint256 repayAmount)
        external
        returns (uint256);

    /*** Admin Functions ***/

    function _addReserves(uint256 addAmount) external returns (uint256);

    /** End Admin Functions */

    function underlying() external view returns (address);

    /**
        @notice Each cToken is convertible into an ever increasing quantity of the underlying asset, as interest accrues in the market. The exchange rate between a cToken and the underlying asset is
        equal to: exchangeRate = (getCash() + totalBorrows() - totalReserves()) / totalSupply()
        @return The current exchange rate as an unsigned integer, scaled by 1e18.
     */
    function exchangeRateCurrent() external returns (uint256);

    function exchangeRateStored() external view returns (uint256);

    /**
     * @notice Applies accrued interest to total borrows and reserves
     * @dev This calculates interest accrued from the last checkpointed block
     *   up to the current block and writes new checkpoint to storage.
     */
    function accrueInterest() external;

    function decimals() external view returns (uint8);

    function balanceOf(address account) external view returns (uint256);

    /**
        @notice The user's underlying balance, representing their assets in the protocol, is equal to the user's cToken balance multiplied by the Exchange Rate.
        @param account The account to get the underlying balance of.
        @return The amount of underlying currently owned by the account.
     */
    function balanceOfUnderlying(address account) external returns (uint256);

    function comptroller() external view returns (IComptroller);
}
