// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../contexts2/access-control/roles/RolesMods.sol";
import "../contexts2/access-control/reentry/ReentryMods.sol";
import "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";

// Libraries
import { LendingLib } from "./libraries/LendingLib.sol";
import { MaxTVLAmountLib } from "../settings/asset/MaxTVLAmountLib.sol";
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LendingDepositFacet is RolesMods, ReentryMods, PausableMods {
    bytes32 constant FACET_ID = keccak256("LendingFacet");

    /**
     * @notice This event is emitted when an user deposits tokens into the pool.
     * @param sender address.
     * @param amount of tokens.
     */
    event LendingPoolDeposit(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    /**
     * @notice It allows users to deposit tokens into the pool.
     * @dev the user must call ERC20.approve function previously.
     * @dev If the cToken is available (not 0x0), it deposits the lending asset amount into Compound directly.
     * @param asset Token address to deposit into the lending pool.
     * @param amount Amount of {asset} to deposit in the pool.
     */
    function lendingPoolDeposit(address asset, uint256 assetAmount)
        external
        paused(FACET_ID, false)
        authorized(AUTHORIZED, msg.sender)
        nonReentry(FACET_ID)
    {
        // Check the max TVL
        (uint256 previousRate, uint256 previousSupply) =
            LendingLib.exchangeRateSupply(asset);
        require(
            previousSupply + assetAmount <= MaxTVLAmountLib.get(asset),
            "Teller: max tvl reached"
        );

        // Transferring tokens to the LendingPool
        // TODO: get escrow
        SafeERC20(IERC20(asset)).safeTransferFrom(
            msg.sender,
            escrow,
            assetAmount
        );
        // Update the store amount of lender supply
        LendingLib.s(asset).lenderTotalSupplied[msg.sender] += assetAmount;

        // Depositing to Compound accrues interest which changes the exchange rate.
        _depositToCompoundIfSupported(assetAmount);

        // Calculate Teller token value to mint
        uint256 tTokenAmount =
            LendingLib.tTokenValue(assetAmount, previousRate);
        // Mint lender their tokens
        // TODO: get tToken
        tToken.mint(msg.sender, tTokenAmount);

        // Emit event
        emit LendingPoolDeposit(msg.sender, assetAmount, tTokenAmount);
    }
}
