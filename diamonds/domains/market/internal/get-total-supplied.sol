// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../storage/lending-pool.sol";
import "../../../providers/compound/CErc20Interface.sol";
import "../../../providers/compound/CompoundRatesLib.sol";

abstract contract int_getTotalSupplied_LendingPool_v1 is sto_lendingPool {
    using CompoundRatesLib for CErc20Interface;

    /**

        @notice It calculates the total supply of the lending token across all markets.
        @return totalSupplied the total supply denoted in the lending token.
     */
    function _getTotalSupplied() internal view returns (uint256 totalSupplied) {
        ERC20 lendingToken = getLendingPool().lendingToken;

        totalSupplied =
            lendingToken.balanceOf(address(this)) +
            getLendingPool().totalBorrowed -
            getLendingPool().totalRepaid;

        CErc20Interface cToken = CErc20Interface(getLendingPool().cToken);

        if (address(cToken) != address(0)) {
            totalSupplied =
                totalSupplied +
                cToken.valueInUnderlying(cToken.balanceOf(address(this)));
        }
    }
}
