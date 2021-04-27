// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { DappMods } from "./DappMods.sol";
import { PausableMods } from "../../settings/pausable/PausableMods.sol";

// Libraries
import { LibEscrow } from "../libraries/LibEscrow.sol";
import { LibUniswap } from "./libraries/LibUniswap.sol";

// Interfaces
import { IUniswapV2Router } from "../../shared/interfaces/IUniswapV2Router.sol";

contract UniswapFacet is PausableMods, DappMods {
    /**
     * @notice Event emitted every time a successful swap has taken place.
     * @param sourceToken source token address.
     * @param destinationToken destination address.
     * @param sourceAmount source amount sent.
     * @param destinationAmount destination amount received.
     */
    event UniswapSwapped(
        address indexed sourceToken,
        address indexed destinationToken,
        uint256 sourceAmount,
        uint256 destinationAmount
    );

    /**
     * @notice Swaps ETH/Tokens for Tokens/ETH using different Uniswap v2 Router 02 methods.
     * @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function swap(
        uint256 loanID,
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) external paused("", false) onlyBorrower(loanID) {
        //        uint256 minDestination =
        //            LibUniswap.ROUTER.getAmountsOut(sourceAmount, path)[path.length - 1];
        uint256 destinationAmount =
            LibUniswap.swap(path, sourceAmount, minDestination);

        LibEscrow.tokenUpdated(loanID, path[0]);
        LibEscrow.tokenUpdated(loanID, path[path.length - 1]);

        emit UniswapSwapped(
            path[0],
            path[path.length - 1],
            sourceAmount,
            destinationAmount
        );
    }
}
