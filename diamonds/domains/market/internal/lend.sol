import "../storage/lending-pool.sol";
import "../internal/compound.sol";
import "../internal/token.sol";

abstract contract int_lend_LendingPool_v1 is
    sto_lendingPool,
    int_compound_LendingPool_v1,
    int_TokenTx_Market_v1
{
    function _lendingPoolLend(uint256 amount, address recipient) internal {
        ERC20 lendingToken = getLendingPool().lendingToken;

        uint256 lendingTokenBalance = lendingToken.balanceOf(address(this));
        if (lendingTokenBalance < amount) {
            _withdrawFromCompoundIfSupported(amount - lendingTokenBalance);
        }

        // Transfer tokens to the borrower.
        tokenTransfer(recipient, amount);

        getLendingPool().totalBorrowed += amount;
    }
}
