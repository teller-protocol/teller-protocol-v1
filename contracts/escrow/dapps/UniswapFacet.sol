// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib } from "../../storage/app.sol";
import { DappMods } from "./DappMods.sol";
import { PausableMods } from "../../contexts2/pausable/PausableMods.sol";
import { LibDapps } from "./libraries/LibDapps.sol";
import { LibEscrow } from "../libraries/LibEscrow.sol";
import { IUniswapV2Router } from "../../shared/interfaces/IUniswapV2Router.sol";

contract UniswapFacet is PausableMods, DappMods {
    /**
        @notice Event emmitted every time a successful swap has taken place.
        @param sourceToken source token address.
        @param destinationToken destination address.
        @param sourceAmount source amount sent.
        @param destinationAmount destination amount received.
     */
    event UniswapSwapped(
        address indexed sourceToken,
        address indexed destinationToken,
        uint256 sourceAmount,
        uint256 destinationAmount
    );

    /**
        @notice Swaps ETH/Tokens for Tokens/ETH using different Uniswap v2 Router 02 methods.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source token to swap.
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function swap(
        uint256 loanID,
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) public paused("", false) onlyBorrower(loanID) {
        uint256 destinationAmount = _uniswap(path, sourceAmount);

        LibEscrow.tokenUpdated(loanID, path[0]);
        LibEscrow.tokenUpdated(loanID, path[path.length - 1]);

        emit UniswapSwapped(
            path[0],
            path[path.length - 1],
            sourceAmount,
            destinationAmount
        );
    }

    /**
     * @notice Swaps tokens using UniswapV2Router via the platform defined Uniswap contract.
     * @notice Will check Uniswap via the router what the expected minimum destination amount should be.
     * @dev See the swap function below.
     */
    function _uniswap(address[] memory path, uint256 sourceAmount)
        internal
        returns (uint256)
    {
        IUniswapV2Router uniRouter = AppStorageLib.store().uniswapRouter;
        uint256 minDestination =
            uniRouter.getAmountsOut(sourceAmount, path)[path.length - 1];
        return LibDapps.swap(path, sourceAmount, minDestination);
    }
}
