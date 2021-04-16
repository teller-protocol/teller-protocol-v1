// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../contexts2/access-control/roles/RolesMods.sol";
import "../contexts2/access-control/reentry/ReentryMods.sol";
import "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";

// Interfaces
import { ILoansEscrow } from "./interfaces/ILoansEscrow.sol";
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { MarketStorageLib, LoanStatus } from "../storage/market.sol";

// Libraries
import { LibDapps } from "../dapps/libraries/LibDapps.sol";
import { LibLoans } from "../market/libraries/LibLoans.sol";
import { LibEscrow } from "./libraries/LibEscrow.sol";

contract EscrowClaimTokensFacet is RolesMods, ReentryMods, PausableMods {
    using SafeERC20 for IERC20;
    /**
     * @notice Notifies when the Escrow's tokens have been claimed.
     * @param recipient address where the tokens where sent to.
     */
    event TokensClaimed(address recipient);

    /**
     * @notice Sends the tokens owned by this escrow to the owner.
     * @dev The loan must not be active.
     * @dev The recipient must be the loan borrower AND the loan must be already liquidated.
     * @param loanID The id of the loan being used.
     */
    function claimTokens(uint256 loanID)
        external
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
        nonReentry("")
    {
        require(
            MarketStorageLib.store().loans[loanID].status == LoanStatus.Closed,
            "LOAN_NOT_CLOSED"
        );

        EnumerableSet.AddressSet storage tokens =
            MarketStorageLib.store().escrowTokens[loanID];
        for (uint256 i = 0; i < EnumerableSet.length(tokens); i++) {
            uint256 balance =
                LibDapps.balanceOf(loanID, EnumerableSet.at(tokens, i));
            if (balance > 0) {
                IERC20(EnumerableSet.at(tokens, i)).safeTransfer(
                    msg.sender,
                    balance
                );
            }
        }

        emit TokensClaimed(msg.sender);
    }

    /**
     * @notice Send the equivilant of tokens owned by this escrow (in collateral value) to the recipient,
     * @dev The loan must not be active
     * @dev The loan must be liquidated
     * @dev The recipeient must be the loan manager
     * @param recipient address to send the tokens to
     * @param value The value of escrow held tokens, to be claimed based on collateral value
     */
    function claimTokensByCollateralValue(
        uint256 loanID,
        address recipient,
        uint256 value
    )
        external
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
        nonReentry("")
    {
        require(
            MarketStorageLib.store().loans[loanID].status == LoanStatus.Closed,
            "LOAN_NOT_CLOSED"
        );
        require(
            MarketStorageLib.store().loans[loanID].status ==
                LoanStatus.Liquidated,
            "LOAN_NOT_LIQUIDATED"
        );
        require(msg.sender == address(this), "CALLER_MUST_BE_LOANS");

        EnumerableSet.AddressSet storage tokens =
            MarketStorageLib.store().escrowTokens[loanID];
        uint256 valueLeftToTransfer = value;
        // cycle through tokens
        for (uint256 i = 0; i < EnumerableSet.length(tokens); i++) {
            if (valueLeftToTransfer == 0) {
                break;
            }

            uint256 balance =
                LibDapps.balanceOf(loanID, EnumerableSet.at(tokens, i));
            address collateralToken =
                MarketStorageLib.store().loans[loanID].collateralToken;
            // get value of token balance in collateral value
            if (balance > 0) {
                uint256 valueInCollateralToken =
                    (EnumerableSet.at(tokens, i) == collateralToken)
                        ? balance
                        : LibEscrow.valueOfIn(
                            EnumerableSet.at(tokens, i),
                            collateralToken,
                            balance
                        );
                // if <= value, transfer tokens
                if (valueInCollateralToken <= valueLeftToTransfer) {
                    IERC20(EnumerableSet.at(tokens, i)).safeTransfer(
                        recipient,
                        valueInCollateralToken
                    );
                    valueLeftToTransfer =
                        valueLeftToTransfer -
                        (valueInCollateralToken);
                } else {
                    IERC20(EnumerableSet.at(tokens, i)).safeTransfer(
                        recipient,
                        valueLeftToTransfer
                    );
                    valueLeftToTransfer = 0;
                }
                LibDapps.tokenUpdated(loanID, EnumerableSet.at(tokens, i));
            }
        }
        emit TokensClaimed(recipient);
    }
}
