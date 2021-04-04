    function _calculateLenderInterestEarned(
        address lender,
        uint256 exchangeRate
    ) internal view returns (uint256) {
        uint256 lenderUnderlyingBalance =
            _lendingTokensFromTTokens(
                IERC20(address(tToken)).balanceOf(lender),
                exchangeRate
            );
        return
            lenderUnderlyingBalance.sub(_totalSuppliedUnderlyingLender[lender]);
    }







    /**
        @notice It deposits a given amount of tokens to Compound.
        @dev The cToken address must be defined in AssetSettings.
        @dev The underlying token value of the tokens to be deposited must be positive. Because the decimals of
            cTokens and the underlying asset can differ, the deposit of dust tokens may result in no cTokens minted.
        @param amount The amount of underlying tokens to deposit.
        @return difference The amount of underlying tokens deposited.
     */
    function _depositToCompoundIfSupported(uint256 amount)
        internal
        returns (uint256 difference)
    {
        if (address(cToken) == address(0)) {
            return 0;
        }

        // approve the cToken contract to take lending tokens
        lendingToken.safeApprove(address(cToken), amount);

        uint256 balanceBefore = lendingToken.balanceOf(address(this));

        // Now mint cTokens, which will take lending tokens
        uint256 mintResult = cToken.mint(amount);
        require(mintResult == 0, "COMPOUND_DEPOSIT_ERROR");

        uint256 balanceAfter = lendingToken.balanceOf(address(this));
        difference = balanceBefore.sub(balanceAfter);
        require(difference > 0, "DEPOSIT_CTOKEN_DUST");
    }

    /**
        @notice It withdraws a given amount of tokens from Compound.
        @param amount The amount of underlying tokens to withdraw.
        @return The amount of underlying tokens withdrawn.
     */
    function _withdrawFromCompoundIfSupported(uint256 amount)
        internal
        returns (uint256)
    {
        if (address(cToken) == address(0)) {
            return 0;
        }

        uint256 balanceBefore = lendingToken.balanceOf(address(this));

        uint256 redeemResult = cToken.redeemUnderlying(amount);
        require(redeemResult == 0, "COMPOUND_REDEEM_UNDERLYING_ERROR");

        uint256 balanceAfter = lendingToken.balanceOf(address(this));
        return balanceAfter.sub(balanceBefore);
    }



    /**
        @notice It validates whether transaction sender is the loan manager contract address.
        @dev This function is overriden in some mock contracts for testing purposes.
     */
    function _requireIsLoan() internal view {
        require(
            marketRegistry.loanManagerRegistry(address(this), msg.sender),
            "CALLER_NOT_LOANS_CONTRACT"
        );
    }

    /** Private functions */

