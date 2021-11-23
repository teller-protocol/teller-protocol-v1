// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TToken_V2 } from "./TToken_V2.sol";

//import { CONTROLLER, ADMIN } from "./data.sol";
//import { ITTokenStrategy } from "./strategies/ITTokenStrategy.sol";
//
//// Libraries
//import {
//    SafeERC20
//} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
//import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";

/**
 * @notice This contract represents a lending pool for an asset within Teller protocol.
 * @author develop@teller.finance
 */
contract TToken_V2_Alpha is TToken_V2 {
    //    /**
    //     * @notice The event is emitted when interest has been claimed at the end of Teller's Alpha
    //     * @param recipient The address who has claimed the interest
    //     * @param userReward The amount of interest claimed by the Alpha participant
    //     */
    //    event AlphaInterestClaimed(address recipient, uint256 userReward);
    //
    //    /**
    //     * @notice Gets the amount of interest that was generated during the Alpha launch.
    //     */
    //    function getAlphaInterestEarned() external view returns (uint256) {
    //        return s().alphaInterestEarned;
    //    }
    //
    //    /**
    //     * @notice Called by the Teller Diamond contract at the end of the protocol's Alpha.
    //     */
    //    function markEndOfAlpha() external authorized(ADMIN, _msgSender()) {
    //        require(!s().alphaEnded, "Teller: alpha already ended");
    //        s().alphaEnded = true;
    //        s().alphaInterestEarned = s().totalInterestRepaid; // mark the amount of interest earned to date
    //        s().totalInterestRepaid = 0; // reset the amount of interest that was earned
    //    }
    //
    //    /**
    //     * @notice Called by the Teller Diamond contract at the end of Alpha for recipient's earned interest.
    //     * @param recipient The address of the alpha participant claiming the interest.
    //     * @param interestRatio The proportional amount of interest earned by the recipient to the total interest earned.
    //     */
    //
    //    function claimAlphaInterest(address recipient, uint16 interestRatio)
    //        external
    //        authorized(CONTROLLER, _msgSender())
    //    {
    //        require(s().alphaEnded, "Teller: alpha not ended");
    //        require(
    //            !s().alphaInterestClaimed[recipient],
    //            "Teller: interest already claimed"
    //        );
    //        require(interestRatio > 0, "Teller: interest percent cannot be 0");
    //
    //        uint256 userReward = NumbersLib.percent(
    //            s().alphaInterestEarned,
    //            interestRatio
    //        );
    //        SafeERC20.safeTransfer(s().underlying, recipient, userReward);
    //        s().alphaInterestClaimed[recipient] = true;
    //
    //        emit AlphaInterestClaimed(recipient, userReward);
    //    }
}
