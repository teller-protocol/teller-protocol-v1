// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { LibDapps } from "../../dapps/libraries/LibDapps.sol";
import { PriceAggLib } from "../../price-aggregator/PriceAggLib.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Interfaces
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

// Storage
import { MarketStorageLib } from "../../storage/market.sol";
import { AppStorageLib } from "../../storage/app.sol";

library LibEscrow {
    /**
     * @notice Calculate the value of the loan by getting the value of all tokens the Escrow owns.
     * @return value_ Escrow total value denoted in the lending token.
     */
    function calculateTotalValue(uint256 loanID)
        internal
        view
        returns (uint256 value_)
    {
        EnumerableSet.AddressSet storage tokens =
            MarketStorageLib.store().escrowTokens[loanID];
        if (EnumerableSet.length(tokens) > 0) {
            address WETH_ADDRESS = AppStorageLib.store().assetAddresses["WETH"];
            for (uint256 i = 0; i < EnumerableSet.length(tokens); i++) {
                if (EnumerableSet.at(tokens, i) == WETH_ADDRESS) {
                    value_ += LibDapps.balanceOf(
                        loanID,
                        EnumerableSet.at(tokens, i)
                    );
                } else {
                    value_ += PriceAggLib.valueFor(
                        EnumerableSet.at(tokens, i),
                        WETH_ADDRESS,
                        LibDapps.balanceOf(loanID, EnumerableSet.at(tokens, i))
                    );
                }
            }
            address lendingToken =
                MarketStorageLib.store().loans[loanID].lendingToken;

            value_ = PriceAggLib.valueFor(WETH_ADDRESS, lendingToken, value_);
        }
    }
}
