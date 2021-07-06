// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { DappMods } from "./DappMods.sol";
import { PausableMods } from "../../settings/pausable/PausableMods.sol";

// Libraries
import { LibEscrow } from "../libraries/LibEscrow.sol";
import { LibSwapper } from "./libraries/LibSwapper.sol";
import {
    ChainlinkLib
} from "../../price-aggregator/chainlink/ChainlinkLib.sol";

// Interfaces
import { IUniswapV2Router } from "../../shared/interfaces/IUniswapV2Router.sol";

contract UniswapFacet is PausableMods, DappMods {
    /**
     * @dev The address of the swapping router on the deployed network
     * @dev example - UniswapV2Router contract address on L1 mainnet or L2 arbitrum mainnet
     */
    address public immutable UNISWAP_ROUTER_ADDRESS;

    /**
     * @notice Sets the swapping router address on protocol deployment.
     * @param routerAddress The address of the swapping router contract on the network.
     */
    constructor(address routerAddress) public {
        UNISWAP_ROUTER_ADDRESS = routerAddress;
    }

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
     * @notice Swaps tokens for tokens on Uniswap.
     * @dev {path} must have at least 2 token addresses
     * @param path An array of token addresses.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function uniswapSwap(
        uint256 loanID,
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) external paused("", false) onlySecured(loanID) onlyBorrower(loanID) {
        address src = path[0];
        address dst = path[path.length - 1];
        require(
            ChainlinkLib.isTokenSupported(src),
            "Teller: uniswap src not supported"
        );
        require(
            ChainlinkLib.isTokenSupported(dst),
            "Teller: uniswap dst not supported"
        );

        // Set allowance on source token to Uniswap Router
        LibEscrow.e(loanID).setTokenAllowance(src, UNISWAP_ROUTER_ADDRESS);

        // Encode data for LoansEscrow to call
        bytes memory callData =
            abi.encodeWithSelector(
                IUniswapV2Router.swapExactTokensForTokens.selector,
                sourceAmount,
                minDestination,
                path,
                address(LibEscrow.e(loanID)),
                block.timestamp
            );
        // Call Escrow to do swap get the response amounts
        uint256[] memory amounts =
            abi.decode(
                LibEscrow.e(loanID).callDapp(UNISWAP_ROUTER_ADDRESS, callData),
                (uint256[])
            );
        uint256 destinationAmount = amounts[amounts.length - 1];

        LibEscrow.tokenUpdated(loanID, src);
        LibEscrow.tokenUpdated(loanID, dst);

        emit UniswapSwapped(src, dst, sourceAmount, destinationAmount);
    }
}
