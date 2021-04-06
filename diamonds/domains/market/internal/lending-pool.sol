// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../storage/lending-pool.sol";
import "diamonds/providers/compound/IComptroller.sol";
import "diamonds/providers/uniswap/UniSwapper.sol";
import "../../protocol/interfaces/IAssetRegistry.sol";

import "../../protocol/address.sol";

abstract contract int_LendingPool_v1 is sto_lendingPool, UniSwapper {
    using SafeERC20 for ERC20;

    function _swapAccumulatedComp() internal {
        address cToken = getLendingPool().cToken;
        IComptroller compound = IComptroller(getLendingPool().compound);
        ERC20 comp = getLendingPool().comp;
        address lendingToken = getLendingPool().lendingToken;
        address[] memory cTokens = new address[](1);
        cTokens[0] = address(cToken);

        compound.claimComp(address(this), cTokens);

        // Amount which goes into the swap is COMP balance of the lending pool.
        uint256 amountIn = comp.balanceOf(address(this));

        // Path of the swap is always COMP -> WETH -> LendingToken.
        address[] memory path = new address[](3);
        path[0] = address(comp);
        path[1] = IAssetRegistry(PROTOCOL).getAsset("WETH");
        path[2] = address(lendingToken);

        _uniswap(path, amountIn);
    }

    /**
        @notice It transfers an amount of tokens to a specific address.
        @param recipient address which will receive the tokens.
        @param amount of tokens to transfer.
        @dev It throws a require error if 'transfer' invocation fails.
     */
    function tokenTransfer(address recipient, uint256 amount) private {
        ERC20 lendingToken = getLendingPool().lendingToken;
        uint256 currentBalance = lendingToken.balanceOf(address(this));
        require(currentBalance >= amount, "LENDING_TOKEN_NOT_ENOUGH_BALANCE");
        lendingToken.safeTransfer(recipient, amount);
    }

    /**
        @notice It transfers an amount of tokens from an address to this contract.
        @param from address where the tokens will transfer from.
        @param amount to be transferred.
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function tokenTransferFrom(address from, uint256 amount)
        private
        returns (uint256 balanceIncrease)
    {
        ERC20 lendingToken = getLendingPool().lendingToken;
        uint256 balanceBefore = lendingToken.balanceOf(address(this));
        uint256 allowance = lendingToken.allowance(from, address(this));
        require(allowance >= amount, "LEND_TOKEN_NOT_ENOUGH_ALLOWANCE");
        lendingToken.safeTransferFrom(from, address(this), amount);
        return lendingToken.balanceOf(address(this)) - balanceBefore;
    }

    /**
        @notice It mints tToken tokens, and send them to a specific address.
        @param to address which will receive the minted tokens.
        @param amount to be minted.
        @dev This contract must has a Minter Role in tToken (mintable) token.
        @dev It throws a require error if mint invocation fails.
     */
    function tTokenMint(address to, uint256 amount) private {
        getLendingPool().tToken.mint(to, amount);
    }

    function accrueInterest()
        internal
        returns (bool success, bytes memory data)
    {
        (success, data) = address(getLendingPool().cToken).call(
            abi.encodeWithSignature("accrueInterest()")
        );
    }
}
