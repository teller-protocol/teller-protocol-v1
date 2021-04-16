// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import { PriceAggLib } from "../../price-aggregator/PriceAggLib.sol";

// Interfaces
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

// Storage
import { AppStorageLib } from "../../storage/app.sol";

library LibEscrow {
    using NumbersLib for uint256;

    /**
     * @notice Calculate a value of a token amount.
     * @param baseAddress base token address.
     * @param quoteAddress quote token address.
     * @param baseAmount amount of base token.
     * @return Value of baseAmount in quote token.
     */
    function valueOfIn(
        address baseAddress,
        address quoteAddress,
        uint256 baseAmount
    ) internal view returns (uint256) {
        bool success;
        bytes memory returnData;
        // call function to base address for function signature of underlying
        (success, returnData) = baseAddress.staticcall(
            abi.encodeWithSignature("exchangeRateStored()")
        );
        require(success, "EXCHANGE_RATE_CALL_FAIL");
        if (returnData.length > 0) {
            uint8 cTokenDecimals = ICErc20(baseAddress).decimals();
            uint256 exchangeRate = abi.decode(returnData, (uint256));
            uint256 diffFactor =
                uint256(10)**uint256(18).diff(uint256(cTokenDecimals));

            if (cTokenDecimals > uint256(18)) {
                exchangeRate = exchangeRate * (diffFactor);
            } else {
                exchangeRate = exchangeRate / (diffFactor);
            }

            address WETH_ADDRESS = AppStorageLib.store().assetAddresses["WETH"];
            address CETH_ADDRESS = AppStorageLib.store().assetAddresses["CETH"];

            uint8 assetDecimals;
            if (baseAddress == CETH_ADDRESS) {
                baseAddress = WETH_ADDRESS;
                assetDecimals = uint8(18);
            } else {
                baseAddress = ICErc20(baseAddress).underlying();
                assetDecimals = ERC20(baseAddress).decimals();
            }

            baseAmount =
                (baseAmount * (exchangeRate)) /
                (uint256(10)**assetDecimals);
        }
        return PriceAggLib.valueFor(baseAddress, quoteAddress, baseAmount);
    }
}
