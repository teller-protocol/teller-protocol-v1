// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { ITellerDiamond } from "../shared/interfaces/ITellerDiamond.sol";

// Storage
import {
    LoanRequest,
    LoanResponse,
    LoanStatus,
    LoanTerms,
    Loan,
    MarketStorageLib
} from "../storage/market.sol";

contract ReentryTest {
    struct CreateAndTakeOutArgs {
        LoanRequest request;
        LoanResponse[] responses;
        address collateralToken;
        uint256 collateralAmount;
    }

    ITellerDiamond diamond;
    uint256 loanID;
    CreateAndTakeOutArgs args;

    function createAndTakeOutLoan(
        address diamondAddress,
        CreateAndTakeOutArgs calldata _args
    ) external payable {
        diamond = ITellerDiamond(diamondAddress);
        args = _args;
        diamond.createLoanWithTerms{ value: msg.value }(
            args.request,
            args.responses,
            args.collateralToken,
            args.collateralAmount
        );

        uint256[] memory loanIDs = diamond.getBorrowerLoans(address(this));
        loanID = loanIDs[loanIDs.length - 1];

        diamond.withdrawCollateral(1 ether, loanID);
    }

    fallback() external payable {
        diamond.takeOutLoan(loanID, args.request.amount);
    }
}
