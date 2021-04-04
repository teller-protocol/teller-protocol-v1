// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../data/escrow.sol";
import "../storage/escrow.sol";
import { int_tokenBalanceOf_Escrow } from "../internal/token-balance-of.sol";
import { int_tokenUpdated_Escrow } from "../internal/token-updated.sol";

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Libraries
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract ent_claimTokenByCollateralValue_Escrow is
    ent_claimTokensByCollateralValue_Escrow_v1
{}

abstract contract ent_claimTokensByCollateralValue_Escrow_v1 is
    dat_Escrow,
    sto_Escrow,
    int_tokenBalanceOf_Escrow,
    int_tokenUpdated_Escrow
{
    using SafeERC20 for IERC20;

    /**
     * @notice Send the equivalent of tokens owned by this escrow (in collateral value) to the recipient,
     * @dev The loan must not be active
     * @dev The loan must be liquidated
     * @dev The recipient must be the loan manager
     * @param recipient address to send the tokens to
     * @param value The value of escrow held tokens, to be claimed based on collateral value
     */
    function claimTokensByCollateralValue(address recipient, uint256 value)
        external
    {
        require(
            escrowStore().market.status(loanID) ==
                TellerCommon.LoanStatus.Liquidated,
            "Escrow: claim tokens by collateral: loan not liquidated"
        );
        require(
            msg.sender == address(escrowStore().market),
            "Escrow: claim tokens by collateral: invalid caller"
        );

        address ETH_ADDRESS = PROTOCOL.getAsset("ETH");

        address[] memory tokens = escrowStore().tokens;
        uint256 valueLeftToTransfer = value;
        // cycle through tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            if (valueLeftToTransfer == 0) {
                break;
            }

            uint256 balance = _balanceOf(tokens[i]);
            // get value of token balance in collateral value
            if (balance > 0) {
                uint256 valueInCollateralToken =
                    // TODO: ETH is hardcoded as collateral token. Should be able to have collateral as other tokens
                    //                    tokens[i] == escrowStore().market.collateralToken()
                    tokens[i] == ETH_ADDRESS
                        ? balance
                        : PROTOCOL.valueFor(
                            tokens[i],
                            ETH_ADDRESS, // TODO: same
                            balance
                        );
                // if <= value, transfer tokens
                if (valueInCollateralToken <= valueLeftToTransfer) {
                    IERC20(tokens[i]).safeTransfer(
                        recipient,
                        valueInCollateralToken
                    );
                    valueLeftToTransfer = valueLeftToTransfer.sub(
                        valueInCollateralToken
                    );
                } else {
                    IERC20(tokens[i]).safeTransfer(
                        recipient,
                        valueLeftToTransfer
                    );
                    valueLeftToTransfer = 0;
                }
                _tokenUpdated(tokens[i]);
            }
        }
        emit TokensClaimed(recipient);
    }
}
