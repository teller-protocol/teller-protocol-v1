// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../../../contexts/access-control/modifiers/entry.sol";
import "../modifiers/when-not-paused.sol";
import "../internal/exchange-rates.sol";
import "../internal/conversions.sol";
import "../internal/compound.sol";
import "../../protocol/modifiers/protocol-authorized.sol";
import "../internal/token.sol";

abstract contract ent_deposit_LendingPool_v1 is
    mod_entry_AccessControl_v1,
    mod_whenNotPaused_Market_v1,
    int_exchangeRates_LendingPool_v1,
    int_conversions_LendingPool_v1,
    mod_protocolAuthorized_Protocol_v1,
    int_compound_LendingPool_v1,
    int_TokenTx_Market_v1
{
    /**
        @notice This event is emitted when an user withdraws tokens from the pool.
        @param sender address that withdrew the tokens.
        @param amount of tokens.
     */
    event TokenWithdrawn(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    function withdraw(uint256 lendingTokenAmount)
        external
        entry
        whenNotPaused
        protocolAuthorized(msg.sender)
    {
        IERC20 tToken = IERC20(getLendingPool().tToken);
        uint256 exchangeRate = _exchangeRate();
        uint256 tTokenAmount =
            _tTokensFromLendingTokens(lendingTokenAmount, exchangeRate);

        require(tTokenAmount > 0, "WITHDRAW_TTOKEN_DUST");
        require(
            IERC20(address(tToken)).balanceOf(msg.sender) > tTokenAmount,
            "TTOKEN_NOT_ENOUGH_BALANCE"
        );

        _withdraw(lendingTokenAmount, tTokenAmount);
    }

    function withdrawAll()
        external
        entry
        whenNotPaused
        protocolAuthorized(msg.sender)
        returns (uint256)
    {
        IERC20 tToken = IERC20(getLendingPool().tToken);
        uint256 tTokenAmount = IERC20(address(tToken)).balanceOf(msg.sender);
        uint256 exchangeRate = _exchangeRate();
        uint256 lendingTokenAmount =
            _lendingTokensFromTTokens(tTokenAmount, exchangeRate);

        _withdraw(lendingTokenAmount, tTokenAmount);

        return lendingTokenAmount;
    }

    function _withdraw(uint256 lendingTokenAmount, uint256 tTokenAmount)
        private
    {
        ERC20 lendingToken = getLendingPool().lendingToken;
        ITToken tToken = ITToken(getLendingPool().tToken);

        uint256 lendingTokenBalance = lendingToken.balanceOf(address(this));

        _withdrawFromCompoundIfSupported(
            lendingTokenAmount - lendingTokenBalance
        );

        // Burn tToken tokens.
        tToken.burn(msg.sender, tTokenAmount);

        // Transfers tokens
        tokenTransfer(msg.sender, lendingTokenAmount);

        // Emit event.
        emit TokenWithdrawn(msg.sender, lendingTokenAmount, tTokenAmount);
    }
}
