// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IsaLPPricer } from "../IsaLPPricer.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CompoundPricer is IsaLPPricer {
    // Compounds exchange rate is scaled by 18 decimals (10^18)
    uint256 internal constant EXCHANGE_RATE_SCALE = 1e18;
    uint256 internal constant CTOKEN_DECIMALS = 1e8;
    address public immutable wETH;
    address public immutable cETH;

    constructor(address wETHAddress, address cETHAddress) {
        wETH = wETHAddress;
        cETH = cETHAddress;
    }

    /**
     * @notice It returns the exchange rate of the single asset liquidity provider token.
     * @param saLPToken address of the single asset liquidity provider token.
     * @return Exchange rate for 1 saLP token in the underlying asset.
     */
    function getRateFor(address saLPToken)
        public
        view
        override
        returns (uint256)
    {
        return
            (ICErc20(saLPToken).exchangeRateStored() * CTOKEN_DECIMALS) /
            EXCHANGE_RATE_SCALE;
    }

    /**
     * @notice It calculates the value of a token amount into another.
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
        return (amount * getRateFor(saLPToken)) / EXCHANGE_RATE_SCALE;
    }

    /**
     * @notice Gets the underlying asset address for the Compound token.
     * @dev cETH is the only Compound token that does not support the {underlying} function.
     * @param cToken address of the Compound token.
     * @return underlying_ address of the underlying cToken asset. Null address if token not supported.
     */
    function getUnderlying(address cToken)
        public
        view
        override
        returns (address underlying_)
    {
        if (cToken == cETH) {
            return wETH;
        }

        (bool success, bytes memory data) =
            cToken.staticcall(
                abi.encodeWithSelector(ICErc20.underlying.selector)
            );
        if (success) {
            underlying_ = abi.decode(data, (address));
        }
    }
}