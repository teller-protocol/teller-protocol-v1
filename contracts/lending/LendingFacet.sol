// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Data
import "../shared/roles.sol";

// Contracts
import "../contexts2/access-control/roles/RolesMods.sol";
import "../contexts2/access-control/reentry/ReentryMods.sol";
import "../contexts2/pausable/PausableMods.sol";
import { EscrowLib } from "../escrow/manager/EscrowLib.sol";
import { EscrowLogic } from "../escrow/manager/EscrowLogic.sol";

// Storage
import { AppStorageLib, AppStorage } from "../storage/app.sol";
import { LendingStorageLib, LendingStorage } from "../storage/lending.sol";

contract LendingFacet is RolesMods, ReentryMods, PausableMods {
    bytes32 internal constant FACET_ID = keccak256("LendingFacet");

    /**
     * @notice This event is emitted when an user deposits tokens into the pool.
     * @param sender address.
     * @param amount of tokens.
     */
    event TokenDeposited(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    /**
     * @notice This event is emitted when an user withdraws tokens from the pool.
     * @param sender address that withdrew the tokens.
     * @param amount of tokens.
     */
    event TokenWithdrawn(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    /**
     * @notice It allows users to deposit tokens into the pool.
     * @dev the user must call ERC20.approve function previously.
     * @dev If the cToken is available (not 0x0), it deposits the lending token amount into Compound directly.
     * @param asset Asset address to deposit into the lending pool.
     * @param amount Amount of {asset} to deposit in the pool.
     */
    function deposit(address asset, uint256 amount)
        external
        paused(FACET_ID, false)
        authorized(USER, msg.sender)
        nonReentry(FACET_ID)
    {
        EscrowLogic escrow =
            EscrowLogic(EscrowLib.getAssetEscrow(address(this), asset));
        escrow.deposit(msg.sender, amount);
        //        ITToken tToken = getLendingPool().tToken;
        //        uint256 previousSupply = _getTotalSupplied();
        //        uint256 exchangeRate = _exchangeRate();

        // Transferring tokens to the LendingPool
        // FundsEscrowLib.deposit(FACET_ID, asset, amount, msg.sender);
        //        lendingTokenAmount = tokenTransferFrom(msg.sender, lendingTokenAmount);

        //        require(
        //            previousSupply + lendingTokenAmount <=
        //                IAssetSettings(PROTOCOL).getMaxTVLAmount(
        //                    getLendingPool().lendingToken
        //                ),
        //            "MAX_TVL_REACHED"
        //        );
        //        // Depositing to Compound accrues interest which changes the exchange rate.
        //        _depositToCompoundIfSupported(lendingTokenAmount);
        //
        //        // Mint tToken tokens
        //        uint256 tTokenAmount =
        //            _tTokensFromLendingTokens(lendingTokenAmount, exchangeRate);
        //
        //        tToken.mint(msg.sender, tTokenAmount);
        //
        //        // Emit event
        //        emit TokenDeposited(msg.sender, lendingTokenAmount, tTokenAmount);
    }

    //    function withdraw(uint256 lendingTokenAmount)
    //        external
    //        nonReentry(FACET_ID)
    //        paused(FACET_ID, false)
    //    {
    //        IERC20 tToken = IERC20(getLendingPool().tToken);
    //        uint256 exchangeRate = _exchangeRate();
    //        uint256 tTokenAmount =
    //            _tTokensFromLendingTokens(lendingTokenAmount, exchangeRate);
    //
    //        require(tTokenAmount > 0, "WITHDRAW_TTOKEN_DUST");
    //        require(
    //            IERC20(address(tToken)).balanceOf(msg.sender) > tTokenAmount,
    //            "TTOKEN_NOT_ENOUGH_BALANCE"
    //        );
    //
    //        _withdraw(lendingTokenAmount, tTokenAmount);
    //    }
    //
    //    function withdrawAll()
    //        external
    //        nonReentry(FACET_ID)
    //        paused(FACET_ID, false)
    //        returns (uint256)
    //    {
    //        IERC20 tToken = IERC20(getLendingPool().tToken);
    //        uint256 tTokenAmount = IERC20(address(tToken)).balanceOf(msg.sender);
    //        uint256 exchangeRate = _exchangeRate();
    //        uint256 lendingTokenAmount =
    //            _lendingTokensFromTTokens(tTokenAmount, exchangeRate);
    //
    //        _withdraw(lendingTokenAmount, tTokenAmount);
    //
    //        return lendingTokenAmount;
    //    }
    //
    //    function _withdraw(uint256 lendingTokenAmount, uint256 tTokenAmount)
    //        private
    //    {
    //        ERC20 lendingToken = getLendingPool().lendingToken;
    //        ITToken tToken = ITToken(getLendingPool().tToken);
    //
    //        uint256 lendingTokenBalance = lendingToken.balanceOf(address(this));
    //
    //        _withdrawFromCompoundIfSupported(
    //            lendingTokenAmount - lendingTokenBalance
    //        );
    //
    //        // Burn tToken tokens.
    //        tToken.burn(msg.sender, tTokenAmount);
    //
    //        // Transfers tokens
    //        tokenTransfer(msg.sender, lendingTokenAmount);
    //
    //        // Emit event.
    //        emit TokenWithdrawn(msg.sender, lendingTokenAmount, tTokenAmount);
    //    }
}
