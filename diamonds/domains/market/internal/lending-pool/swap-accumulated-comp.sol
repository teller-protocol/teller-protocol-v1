// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../storage/lending-pool.sol";
import "../../../../providers/compound/IComptroller.sol";
import "../../../protocol/address.sol";
import "../../../protocol/interfaces/IAssetRegistry.sol";
import "../../../../providers/uniswap/Uniswap.sol";
import "../../../../providers/uniswap/UniSwapper.sol";

abstract contract int_swapComp_LendingPool_v1 is sto_lendingPool, UniSwapper {
    function _swapAccumulatedComp() internal {
        address cToken = getLendingPool().cToken;

        IComptroller compound = IComptroller(getLendingPool().compound);

        address[] memory cTokens = new address[](1);
        cTokens[0] = address(cToken);

        compound.claimComp(address(this), cTokens);
        address comp = IAssetRegistry(PROTOCOL).getAsset("COMP");

        // Amount which goes into the swap is COMP balance of the lending pool.
        uint256 amountIn = ERC20(comp).balanceOf(address(this));

        // Path of the swap is always COMP -> WETH -> LendingToken.
        address[] memory path = new address[](3);
        path[0] = address(comp);
        path[1] = IAssetRegistry(PROTOCOL).getAsset("WETH");
        path[2] = address(getLendingPool().lendingToken);

        _uniswap(path, amountIn);
    }
}
