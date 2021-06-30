// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import { LoanRequest } from "../../../storage/market.sol";
import { Provider } from "../Provider.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { MarketHandler } from "./MarketHandler.sol";

contract TellerMarketHandler is MarketHandler {
    // teller market handler
    function handler(uint256 marketScore, LoanRequest memory request)
        external
        pure
        virtual
        override
        returns (
            uint16 userInterestRate,
            uint16 userCollateralRatio,
            uint256 userLoanAmount
        )
    {
        // get interest rate
        uint16 baseInterestRate = 1000;
        uint16 interestRate =
            baseInterestRate *
                ((maxCollateralRatio / request.request.collateralRatio + 1) /
                    2);
        userInterestRate = interestRate;

        // loan score multiplier
        uint16 scoreMultiplier = 100;
        // Illinois interest rate for testing
        uint16 sampleCappedInterestRate = 900;

        // get loan
        uint256 loanAmount =
            (marketScore * scoreMultiplier) /
                (interestRate / (sampleCappedInterestRate + 1));
        userLoanAmount = loanAmount;
    }
}
