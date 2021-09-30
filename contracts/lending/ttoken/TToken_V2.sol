// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TToken_V1 } from "./TToken_V1.sol";
import { CONTROLLER } from "./data.sol";
import { ITTokenStrategy } from "./strategies/ITTokenStrategy.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @notice This contract represents a lending pool for an asset within Teller protocol.
 * @author develop@teller.finance
 */
contract TToken_V2 is TToken_V1 {
    /**
     * @notice Called by the Teller Diamond contract when a loan has been taken out and requires funds.
     * @param recipient The account to send the funds to.
     * @param amount Funds requested to fulfil the loan.
     */
    function fundLoan(address recipient, uint256 amount)
        external
        override
        authorized(CONTROLLER, _msgSender())
    {
        // Call the strategy to ensure there is enough available funds to fund the loan
        _delegateStrategy(
            abi.encodeWithSelector(ITTokenStrategy.withdraw.selector, amount)
        );

        // Increase total borrowed amount
        s().totalBorrowed += amount;

        // Transfer tokens to recipient
        SafeERC20.safeTransfer(s().underlying, recipient, amount);
    }
}
