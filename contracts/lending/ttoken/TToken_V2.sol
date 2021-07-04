// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TToken_V1 } from "./TToken_V1.sol";
import {
    CONTROLLER,
    ADMIN,
    EXCHANGE_RATE_FACTOR,
    ONE_HUNDRED_PERCENT
} from "./data.sol";
import { ITTokenStrategy } from "./strategies/ITTokenStrategy.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Utils
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

// Interfaces
import { ITToken } from "./ITToken.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

// Libraries
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ERC165Checker
} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import { RolesLib } from "../../contexts2/access-control/roles/RolesLib.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";

// Storage
import "./storage.sol" as Storage;

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
