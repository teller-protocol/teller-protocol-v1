// // SPDX-License-Identifier: MIT

// pragma solidity ^0.8.0;

// // import { TellerAssets } from "./utils.sol";
// import { LoanRequest } from "./Borrow.sol";

// interface IMarket {
//     // Called by teller.
//     function handler(bytes memory input) external;
// }

// contract BasicMarket is IMarket {
//     struct Storage {
//         mapping(uint256 => bool) supportedCollateralAssets;
//         mapping(uint256 => bool) supportedLoanAssets;
//     }

//     bytes32 internal constant POS = keccak256("teller.finance.market.storage");

//     function handler(bytes memory input) external override {
//         (address borrower, uint256 marketScore, LoanRequest memory request) =
//             abi.decode(input, (address, uint256, LoanRequest));

//         uint256 maxDebtRatio = 6666;
//         uint256 minLoanValue = 1000 * 10**18;
//         uint256 maxLoanValue = 5000 * 10**18;
//         uint256 minCollateralRatio = 2000;
//         uint256 maxCollateralRatio = 13500;
//         uint256 minDuration = 1 days;
//         uint256 maxDuration = 180 days;

//         require(s().supportedLoanAssets[request.loanToken], "ME00");
//         require(
//             getDebtRatioFor(request.loanToken, request.loanAmount) <=
//                 maxDebtRatio,
//             "ME06"
//         );
//         require(
//             request.duration >= minDuration && request.duration <= maxDuration,
//             "ME01"
//         );

//         uint256 collateralValue;

//         for (uint8 i = 0; i < request.collateralAssets.length; i++) {
//             require(
//                 s().supportedCollateralAssets[request.collateralAssets[i]],
//                 "ME03"
//             );
//             collateralValue += 100;
//             // collateralValue += priceFor(
//             // collateralAssets[i],
//             // collateralAmounts[i]
//             // );
//         }

//         uint256 loanValue = 100;
//         // uint256 loanValue = priceFor(loanAsset, loanAmount);
//         require(loanValue >= minLoanValue && loanValue <= maxLoanValue, "ME04");

//         uint256 collateralRatio = (collateralValue * 10000) / loanValue;
//         require(
//             collateralRatio >= minCollateralRatio &&
//                 collateralRatio <= maxCollateralRatio,
//             "ME05"
//         );

//         uint256 interestRate =
//             (((maxCollateralRatio - collateralRatio) / 10)) +
//                 ((30 - marketScore) * 20);

//         // teller.lend(
//         //     borrower,
//         //     loanAsset,
//         //     loanAmount,
//         //     collateralRatio,
//         //     interestRate,
//         //     duration
//         // );
//     }

//     function getDebtRatioFor(uint256 loanAsset, uint256 loanAmount)
//         internal
//         view
//         returns (uint256 debtRatio)
//     {
//         // TellerAssets.AssetType assetType = _assetType(loanAsset);
//         return 10000;
//     }

//     function s() internal pure returns (Storage storage s_) {
//         bytes32 pos = POS;
//         assembly {
//             s_.slot := pos
//         }
//     }
// }
