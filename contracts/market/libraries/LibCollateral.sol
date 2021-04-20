// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IWETH } from "../../shared/interfaces/IWETH.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ICollateralEscrow } from "../collateral/ICollateralEscrow.sol";

// Libraries
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { LibDapps } from "../../dapps/libraries/LibDapps.sol";
import { PriceAggLib } from "../../price-aggregator/PriceAggLib.sol";

// Storage
import { AppStorageLib } from "../../storage/app.sol";
import { MarketStorageLib, Loan, LoanStatus } from "../../storage/market.sol";

library LibCollateral {
    function l(uint256 loanID) internal view returns (Loan storage l_) {
        l_ = MarketStorageLib.store().loans[loanID];
    }

    /**
     * @notice This event is emitted when collateral has been deposited for the loan
     * @param loanID ID of the loan for which collateral was deposited
     * @param borrower Account address of the borrower
     * @param depositAmount Amount of collateral deposited
     */
    event CollateralDeposited(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 depositAmount
    );

    /**
     * @notice This event is emitted when collateral has been withdrawn
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param recipient Account address of the recipient
     * @param amount Value of collateral withdrawn
     */
    event CollateralWithdrawn(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed recipient,
        uint256 amount
    );

    function depositCollateral(uint256 loanID, uint256 amount) internal {
        require(amount > 0, "Teller: zero deposit");

        // Check if ETH deposit and wrap in WETH
        if (msg.value > 0) {
            require(msg.value == amount, "Teller: incorrect eth deposit");
            IWETH(l(loanID).collateralToken).deposit{ value: amount }();
        } else {
            // Check if collateral escrow exists
            if (
                address(
                    MarketStorageLib.store().collateralEscrows[
                        l(loanID).collateralToken
                    ]
                ) == address(0)
            ) {
                // Create escrow if non-existent
                createCollateralEscrow(l(loanID).collateralToken);
            }
            // Transfer collateral to token escrow
            MarketStorageLib.store().collateralEscrows[
                l(loanID).collateralToken
            ]
                .depositCollateral(amount, l(loanID).loanTerms.borrower);
        }

        l(loanID).collateral += amount;
        l(loanID).lastCollateralIn = block.timestamp;

        emit CollateralDeposited(loanID, msg.sender, amount);
    }

    function createCollateralEscrow(address collateralToken)
        internal
        returns (address escrow_)
    {
        // Create escrow
        escrow_ = AppStorageLib.store().collateralEscrowBeacon.cloneProxy(
            abi.encode(ICollateralEscrow.init.selector, collateralToken)
        );
        // Save escrow address for loan
        MarketStorageLib.store().collateralEscrows[
            collateralToken
        ] = ICollateralEscrow(escrow_);
    }

    function withdrawCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        l(loanID).collateral -= amount;
        // Check if ETH deposit and wrap in WETH
        address weth = AppStorageLib.store().assetAddresses["WETH"];
        if (weth == l(loanID).collateralToken) {
            IWETH(weth).withdraw(amount);
            recipient.transfer(amount);
        } else {
            // Withdraw collateral from token escrow
            MarketStorageLib.store().collateralEscrows[
                l(loanID).collateralToken
            ]
                .withdrawCollateral(amount, l(loanID).loanTerms.borrower);
        }

        emit CollateralWithdrawn(
            loanID,
            l(loanID).loanTerms.borrower,
            recipient,
            amount
        );
    }

    /**
     * @notice Checks if the loan has an Escrow and claims any tokens then pays out the loan collateral.
     * @dev See Escrow.claimTokens for more info.
     * @param loanID The ID of the loan which is being liquidated
     * @param rewardInCollateral The total amount of reward based in the collateral token to pay the liquidator
     * @param liquidator The address of the liquidator where the liquidation reward will be sent to
     */
    function payOutLiquidator(
        uint256 loanID,
        int256 rewardInCollateral,
        address payable liquidator
    ) internal {
        if (rewardInCollateral <= 0) {
            return;
        }
        uint256 reward = uint256(rewardInCollateral);
        if (reward < l(loanID).collateral) {
            withdrawCollateral(loanID, reward, liquidator);
        } else if (reward >= l(loanID).collateral) {
            uint256 remainingCollateralAmount = reward - (l(loanID).collateral);
            // Payout whats available in the collateral token
            withdrawCollateral(loanID, l(loanID).collateral, liquidator);
            // If liquidator needs additional reward, claim tokens from the loan escrow
            if (
                remainingCollateralAmount > 0 &&
                address(MarketStorageLib.store().loanEscrows[loanID]) !=
                address(0)
            ) {
                claimEscrowTokensByCollateralValue(
                    loanID,
                    liquidator,
                    remainingCollateralAmount
                );
            }
        }
    }

    /**
     * @notice Send the equivalent of tokens owned by this escrow (in collateral value) to the recipient,
     * @dev The loan must be liquidated
     * @param recipient address to send the tokens to
     * @param value The value of escrow held tokens, to be claimed based on collateral value
     */
    function claimEscrowTokensByCollateralValue(
        uint256 loanID,
        address recipient,
        uint256 value
    ) private {
        require(
            l(loanID).status == LoanStatus.Liquidated,
            "Teller: loan not liquidated"
        );

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
            address collateralToken = l(loanID).collateralToken;
            // get value of token balance in collateral value
            if (balance > 0) {
                uint256 valueInCollateralToken =
                    (EnumerableSet.at(tokens, i) == collateralToken)
                        ? balance
                        : PriceAggLib.valueFor(
                            EnumerableSet.at(tokens, i),
                            collateralToken,
                            balance
                        );
                // if <= value, transfer tokens
                if (valueInCollateralToken <= valueLeftToTransfer) {
                    SafeERC20.safeTransfer(
                        IERC20(EnumerableSet.at(tokens, i)),
                        recipient,
                        valueInCollateralToken
                    );
                    valueLeftToTransfer =
                        valueLeftToTransfer -
                        (valueInCollateralToken);
                } else {
                    SafeERC20.safeTransfer(
                        IERC20(EnumerableSet.at(tokens, i)),
                        recipient,
                        valueLeftToTransfer
                    );
                    valueLeftToTransfer = 0;
                }
                LibDapps.tokenUpdated(loanID, EnumerableSet.at(tokens, i));
            }
        }
    }
}
