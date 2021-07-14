// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IsaLPPricer } from "../IsaLPPricer.sol";
import { IAToken } from "../../shared/interfaces/IAToken.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AavePricer is IsaLPPricer {
    /**
     * @notice It returns the exchange rate of the aToken to the underlying asset.
     * @dev The exchange ratio for Aave tokens is always 1:1, however the token balance is compounded silently
     *  using an index at the time of their last deposit. See {AavePricer.getBalanceOfUnderlying}
     * @param saLPToken address of the single asset liquidity provider token.
     * @return Exchange rate for 1 saLP token in the underlying asset.
     */
    function getRateFor(address saLPToken)
        public
        view
        override
        returns (uint256)
    {
        return 10**ERC20(saLPToken).decimals();
    }

    /**
     * @notice It calculates the value of the protocol token amount into the underlying asset.
     * @dev The value of an Aave token is always the same as the underlying asset amount. See {AavePricer.getRateFor}
     * @param saLPToken address of the single asset liquidity provider token
     * @param amount Amount of the token to convert into the underlying asset.
     * @return Value of the saLP token in the underlying asset.
     */
    function getValueOf(address saLPToken, uint256 amount)
        external
        view
        override
        returns (uint256)
    {
        return amount;
    }

    /**
     * @notice It calculates the balance of the underlying asset for {account}.
     * @param saLPToken Address of the single asset liquidity provider token.
     * @param account Address of the account to get the balance of.
     * @return Balance of the underlying asset.
     */
    function getBalanceOfUnderlying(address saLPToken, address account)
        external
        override
        returns (uint256)
    {
        return IAToken(saLPToken).balanceOf(account);
    }

    /**
     * @notice Gets the underlying asset address for the Compound token.
     * @dev cETH is the only Compound token that does not support the {underlying} function.
     * @param saLPToken address of the Compound token.
     * @return address of the underlying saLPToken asset.
     */
    function getUnderlying(address saLPToken)
        public
        view
        override
        returns (address)
    {
        return IAToken(saLPToken).UNDERLYING_ASSET_ADDRESS();
    }
}
