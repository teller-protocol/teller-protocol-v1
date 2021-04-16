// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { MarketStorageLib } from "../storage/market.sol";
import { AppStorageLib } from "../storage/app.sol";

// Libraries
import { LibLoans } from "../market/libraries/LibLoans.sol";
import { LibDapps } from "../dapps/libraries/LibDapps.sol";
import { LibEscrow } from "./libraries/LibEscrow.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ICErc20 } from "../shared/interfaces/ICErc20.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";

contract EscrowDataFacet {
    using NumbersLib for uint256;

    /**
     * @notice Calculate the value of the loan by getting the value of all tokens the Escrow owns.
     * @return Escrow total value denoted in the lending token.
     */
    function calculateTotalValue(uint256 loanID) public view returns (uint256) {
        uint256 valueInWEth;
        address WETH_ADDRESS = AppStorageLib.store().assetAddresses["WETH"];
        EnumerableSet.AddressSet storage tokens =
            MarketStorageLib.store().escrowTokens[loanID];
        for (uint256 i = 0; i < EnumerableSet.length(tokens); i++) {
            if (EnumerableSet.at(tokens, i) == WETH_ADDRESS) {
                valueInWEth =
                    valueInWEth +
                    (LibDapps.balanceOf(loanID, EnumerableSet.at(tokens, i)));
            } else {
                valueInWEth =
                    valueInWEth +
                    (
                        LibEscrow.valueOfIn(
                            EnumerableSet.at(tokens, i),
                            WETH_ADDRESS,
                            LibDapps.balanceOf(
                                loanID,
                                EnumerableSet.at(tokens, i)
                            )
                        )
                    );
            }
        }
        address lendingToken =
            MarketStorageLib.store().loans[loanID].lendingToken;

        return LibEscrow.valueOfIn(WETH_ADDRESS, lendingToken, valueInWEth);
    }
}
