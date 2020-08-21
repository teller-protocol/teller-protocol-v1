pragma solidity 0.5.17;

interface IUniswap {

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