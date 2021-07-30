// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TToken_V2 } from "./TToken_V2.sol";
import { CONTROLLER, ADMIN } from "./data.sol";
import { ITTokenStrategy } from "./strategies/ITTokenStrategy.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";

/**
 * @notice This contract represents a lending pool for an asset within Teller protocol.
 * @author develop@teller.finance
 */
contract TToken_V2_Alpha is TToken_V2 {
    /**
     * @notice Gets the amount of interest that was generated during the Alpha launch.
     */
    function getAlphaInterestEarned() external view returns (uint256) {
        return s().alphaInterestEarned;
    }

    /**
     * @notice Called by the Teller Diamond contract at the end of the protocol's Alpha.
     */
    function markEndOfAlpha() external authorized(ADMIN, _msgSender()) {
        require(!s().alphaEnded, "Teller: alpha already ended");
        s().alphaEnded = true;
        s().alphaInterestEarned = s().totalInterestRepaid; // mark the amount of interest earned to date
        s().totalInterestRepaid = 0; // reset the amount of interest that was earned
    }

    /**
     * @notice Called by the Teller Diamond contract at the end of Alpha for recipient's earned interest.
     * @param recipient The address of the alpha participant claiming the interest.
     * @param percent The proportional amount of interest earned by the recipient.
     */

    function claimAlphaInterest(address recipient, uint16 percent)
        external
        override
        authorized(CONTROLLER, _msgSender())
    {
        require(s().alphaEnded, "Teller: alpha not ended");
        require(
            !s().alphaInterestClaimed[recipient],
            "Teller: interest already claimed"
        );
        uint256 userReward = NumbersLib.percent(
            s().alphaInterestEarned,
            percent
        );
        SafeERC20.safeTransfer(s().underlying, recipient, userReward);
        s().alphaInterestClaimed[recipient] = true;

        emit AlphaInterestClaimed(recipient, userReward);
    }
}
