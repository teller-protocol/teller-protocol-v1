// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
    @notice This defines the functions available to use in the Uniswap Dapp.
    @author develop@teller.finance
 */
interface IUniswapDapp {
    /**
        @notice Swaps tokens using the Uniswap protocol.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source token to swap.
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
        @dev This function mainly invokes 3 Uniswap external functions:
            https://uniswap.org/docs/v2/smart-contracts/router02/#swapexactethfortokens
            https://uniswap.org/docs/v2/smart-contracts/router02/#swapexacttokensforeth
            https://uniswap.org/docs/v2/smart-contracts/router02/#swapexacttokensfortokens
     */
    function swap(
        address[] calldata path,
        uint256 sourceAmount,
        uint256 minDestination
    ) external;

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
}
