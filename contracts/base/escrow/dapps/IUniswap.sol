pragma solidity 0.5.17;

/**
    @notice This defines the functions available to use in the Uniswap Dapp.
    @author develop@teller.finance
 */
interface IUniswap {
    /**
        @notice Swaps ETH/Tokens for Tokens/ETH using the Uniswap protocol.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source element (ETH or Tokens) to swap.
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
        @param from address where source element will be deducted.
        @param to destination address where elements will be sent to.
        @param sourceElement source element (ETH or Token) address.
        @param receivedElement received element (ETH or Token) address.
        @param sourceAmount element (ETH or Token) amount sent.
        @param receivedAmount element (ETH or Token) amount received.
     */
    event UniswapSwapped(
        address indexed from,
        address indexed to,
        address indexed sourceElement,
        address receivedElement,
        uint256 sourceAmount,
        uint256 receivedAmount
    );
}
