// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { ICErc20 } from "../interfaces/ICErc20.sol";

// Storage
import { AppStorageLib } from "../../storage/app.sol";

/**
 * @notice Utility library to calculate the value of a Compound cToken and its underlying asset.
 *
 * @author develop@teller.finance
 */
library CompoundLib {
    /**
     * @dev Compounds exchange rate is scaled by 18 decimals (10^18)
     */
    uint256 internal constant EXCHANGE_RATE_SCALE = 1e18;

    function exchangeRate(address cToken) internal view returns (uint256) {
        return ICErc20(cToken).exchangeRateStored();
    }

    /**
     * @notice Takes an amount of the Compound asset and calculates the underlying amount using the stored exchange rate.
     * @param cToken Address of the Compound token.
     * @param cTokenAmount Amount of the Compound asset.
     * @return value of the Compound token amount in underlying tokens.
     */
    function valueInUnderlying(address cToken, uint256 cTokenAmount)
        internal
        view
        returns (uint256)
    {
        return
            (cTokenAmount * ICErc20(cToken).exchangeRateStored()) /
            EXCHANGE_RATE_SCALE;
    }

    /**
     * @notice Takes an amount of the underlying Compound asset and calculates the cToken amount using the stored exchange rate.
     * @param cToken Address of the Compound token.
     * @param underlyingAmount Amount of the underlying asset for the Compound token.
     * @return value of the underlying amount in Compound tokens.
     */
    function valueOfUnderlying(address cToken, uint256 underlyingAmount)
        internal
        view
        returns (uint256)
    {
        return
            (underlyingAmount * EXCHANGE_RATE_SCALE) /
            ICErc20(cToken).exchangeRateStored();
    }

    function isCompoundToken(address token) internal view returns (bool) {
        return AppStorageLib.store().cTokenRegistry[token];
    }

    /**
     * @notice Tests the {underlying} function on the cToken and assumes its WETH otherwise.
     * @dev CETH is the only Compound token that does not support the {underlying} function.
     * @param cToken address of the compound token
     * @return address of the underlying cToken
     */
    function getUnderlying(address cToken) internal view returns (address) {
        (bool success, bytes memory data) =
            cToken.staticcall(abi.encode(ICErc20.underlying.selector));
        if (success) {
            return abi.decode(data, (address));
        }

        return AppStorageLib.store().assetAddresses["WETH"];
    }
}
