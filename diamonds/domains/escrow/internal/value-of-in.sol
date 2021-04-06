// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../data/escrow.sol";

abstract contract int_value_of_in_v1 is dat_Escrow {
    /**
     * @notice Calculate a value of a token amount.
     * @param baseAddress base token address.
     * @param quoteAddress quote token address.
     * @param baseAmount amount of base token.
     * @return Value of baseAmount in quote token.
     */
    function _valueOfIn(
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
            uint8 cTokenDecimals = CErc20Interface(baseAddress).decimals();
            uint256 exchangeRate = abi.decode(returnData, (uint256));
            uint256 diffFactor =
                uint256(10)**uint256(18).diff(uint256(cTokenDecimals));

            if (cTokenDecimals > uint256(18)) {
                exchangeRate = exchangeRate.mul(diffFactor);
            } else {
                exchangeRate = exchangeRate.div(diffFactor);
            }

            uint8 assetDecimals;
            if (baseAddress == PROTOCOL.getAsset("WETH")) {
                baseAddress = PROTOCOL.getAsset("ETH");
                assetDecimals = uint8(18);
            } else {
                baseAddress = CErc20Interface(baseAddress).underlying();
                assetDecimals = ERC20(baseAddress).decimals();
            }

            baseAmount = baseAmount.mul(exchangeRate).div(
                uint256(10)**assetDecimals
            );
        }
        return PROTOCOL.valueFor(baseAddress, quoteAddress, baseAmount);
    }
}

abstract contract int_value_of_in is int_value_of_in_v1 {}
