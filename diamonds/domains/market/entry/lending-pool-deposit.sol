// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../modifiers/when-not-paused.sol";
import "../../../contexts/access-control/modifiers/entry.sol";
import "../../protocol/interfaces/IAssetSettings.sol";
import "../internal/accrue-interest.sol";
import "../internal/exchange-rates.sol";
import "../internal/token.sol";
import "../storage/lending-pool.sol";
import "../../protocol/modifiers/protocol-authorized.sol";
import "../internal/compound.sol";
import "../internal/conversions.sol";

abstract contract ent_deposit_LendingPool_v1 is
    mod_entry_AccessControl_v1,
    mod_whenNotPaused_Market_v1,
    int_accrueInterest_LendingPool_v1,
    int_TokenTx_Market_v1,
    int_exchangeRates_LendingPool_v1,
    mod_protocolAuthorized_Protocol_v1,
    int_compound_LendingPool_v1,
    int_conversions_LendingPool_v1
{
    /**
        @notice This event is emitted when an user deposits tokens into the pool.
        @param sender address.
        @param amount of tokens.
     */
    event TokenDeposited(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    /**
        @notice It allows users to deposit tokens into the pool.
        @dev the user must call ERC20.approve function previously.
        @dev If the cToken is available (not 0x0), it deposits the lending token amount into Compound directly.
        @param lendingTokenAmount of tokens to deposit in the pool.
    */
    function deposit(uint256 lendingTokenAmount)
        external
        entry
        whenNotPaused
        protocolAuthorized(msg.sender)
    {
        ITToken tToken = getLendingPool().tToken;
        uint256 previousSupply = _getTotalSupplied();
        uint256 exchangeRate = _exchangeRate();

        // Transferring tokens to the LendingPool
        lendingTokenAmount = tokenTransferFrom(msg.sender, lendingTokenAmount);

        require(
            previousSupply + lendingTokenAmount <=
                IAssetSettings(PROTOCOL).getMaxTVLAmount(
                    getLendingPool().lendingToken
                ),
            "MAX_TVL_REACHED"
        );
        // Depositing to Compound accrues interest which changes the exchange rate.
        _depositToCompoundIfSupported(lendingTokenAmount);

        // Mint tToken tokens
        uint256 tTokenAmount =
            _tTokensFromLendingTokens(lendingTokenAmount, exchangeRate);

        tToken.mint(msg.sender, tTokenAmount);

        // Emit event
        emit TokenDeposited(msg.sender, lendingTokenAmount, tTokenAmount);
    }
}
